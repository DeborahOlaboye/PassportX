import mongoose from 'mongoose';
import ErrorMonitoringService from '../services/ErrorMonitoringService';

/**
 * DatabaseTransaction
 *
 * Provides transactional database operations with automatic rollback on errors.
 * Ensures data consistency for critical operations.
 */

export interface TransactionOptions {
  retries?: number;
  retryDelay?: number;
  isolationLevel?: 'readUncommitted' | 'readCommitted' | 'repeatableRead' | 'serializable';
  timeout?: number;
}

export class DatabaseTransaction {
  private session?: mongoose.ClientSession;
  private logger: any;
  private isActive: boolean = false;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    };
  }

  /**
   * Execute a function within a database transaction
   */
  async execute<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const retries = options.retries || 3;
    const retryDelay = options.retryDelay || 1000;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          this.logger.info(`Transaction retry attempt ${attempt + 1}/${retries}`);
          await this.delay(retryDelay * attempt);
        }

        const result = await this.executeOnce(fn, options);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.error(`Transaction attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        ErrorMonitoringService.recordError(
          'database_transaction_failure',
          (error as Error).message,
          'DatabaseTransaction',
          {
            attempt: attempt + 1,
            maxRetries: retries
          }
        );
      }
    }

    throw lastError || new Error('Transaction failed after all retries');
  }

  /**
   * Execute transaction once
   */
  private async executeOnce<T>(
    fn: (session: mongoose.ClientSession) => Promise<T>,
    options: TransactionOptions
  ): Promise<T> {
    this.session = await mongoose.startSession();
    this.isActive = true;

    try {
      this.logger.debug('Starting database transaction');

      // Configure transaction options
      const transactionOptions: any = {
        readPreference: 'primary'
      };

      if (options.timeout) {
        transactionOptions.maxTimeMS = options.timeout;
      }

      // Start transaction
      this.session.startTransaction(transactionOptions);

      // Execute the function
      const result = await fn(this.session);

      // Commit transaction
      await this.session.commitTransaction();
      this.logger.debug('Transaction committed successfully');

      return result;
    } catch (error) {
      // Abort transaction on error
      if (this.session.inTransaction()) {
        await this.session.abortTransaction();
        this.logger.warn('Transaction aborted due to error');
      }

      throw error;
    } finally {
      // Clean up
      await this.session.endSession();
      this.session = undefined;
      this.isActive = false;
    }
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: any): boolean {
    const nonRetryableErrors = [
      'ValidationError',
      'CastError',
      'DocumentNotFoundError'
    ];

    return nonRetryableErrors.some(errType => error.name === errType);
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current session
   */
  getSession(): mongoose.ClientSession | undefined {
    return this.session;
  }

  /**
   * Check if transaction is active
   */
  isTransactionActive(): boolean {
    return this.isActive;
  }
}

/**
 * Helper function to run a database operation in a transaction
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const transaction = new DatabaseTransaction();
  return await transaction.execute(fn, options);
}

/**
 * Batch transaction helper for multiple operations
 */
export async function batchTransaction<T>(
  operations: Array<(session: mongoose.ClientSession) => Promise<T>>,
  options: TransactionOptions = {}
): Promise<T[]> {
  return await withTransaction(async (session) => {
    const results: T[] = [];

    for (const operation of operations) {
      const result = await operation(session);
      results.push(result);
    }

    return results;
  }, options);
}

/**
 * Transaction decorator for class methods
 */
export function Transactional(options: TransactionOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await withTransaction(async (session) => {
        return await originalMethod.apply(this, [...args, session]);
      }, options);
    };

    return descriptor;
  };
}

export default DatabaseTransaction;
