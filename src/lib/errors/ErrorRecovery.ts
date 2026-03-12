import { RetryManager } from './RetryManager';
import { ErrorHandler } from './ErrorHandler';

export interface RecoveryStrategy {
  name: string;
  canRecover: (error: Error) => boolean;
  recover: (error: Error, context?: Record<string, unknown>) => Promise<void>;
}

export class ErrorRecovery {
  private static instance: ErrorRecovery;
  private strategies: RecoveryStrategy[] = [];
  private retryManager: RetryManager;
  private errorHandler: ErrorHandler;

  private constructor() {
    this.retryManager = RetryManager.getInstance();
    this.errorHandler = ErrorHandler.getInstance();
    this.initializeDefaultStrategies();
  }

  static getInstance(): ErrorRecovery {
    if (!ErrorRecovery.instance) {
      ErrorRecovery.instance = new ErrorRecovery();
    }
    return ErrorRecovery.instance;
  }

  private initializeDefaultStrategies(): void {
    // Network error recovery
    this.addStrategy({
      name: 'NetworkErrorRecovery',
      canRecover: (error) =>
        error.name === 'NetworkError' || error.message.includes('fetch'),
      recover: async (_error, _context) => {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
    });

    // Database connection recovery
    this.addStrategy({
      name: 'DatabaseErrorRecovery',
      canRecover: (error) =>
        error.message.includes('database') ||
        error.message.includes('connection'),
      recover: async (_error, _context) => {
        // Implement database reconnection logic
        await new Promise((resolve) => setTimeout(resolve, 2000));
      },
    });

    // Memory error recovery
    this.addStrategy({
      name: 'MemoryErrorRecovery',
      canRecover: (error) =>
        error.message.includes('memory') || error.name === 'RangeError',
      recover: async (_error, _context) => {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      },
    });
  }

  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  async attemptRecovery(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error, context);
          console.log(`Recovery successful using strategy: ${strategy.name}`);
          return true;
        } catch (recoveryError) {
          console.error(
            `Recovery failed for strategy ${strategy.name}:`,
            recoveryError
          );
          await this.errorHandler.handleError(recoveryError as Error, {
            originalError: error.message,
            recoveryStrategy: strategy.name,
            ...context,
          });
        }
      }
    }
    return false;
  }

  async recoverWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context?: Record<string, unknown>
  ): Promise<T> {
    return this.retryManager.executeWithRetry(
      async () => {
        try {
          return await operation();
        } catch (error) {
          const recovered = await this.attemptRecovery(error as Error, context);
          if (!recovered) {
            throw error;
          }
          // Retry the operation after recovery
          return await operation();
        }
      },
      maxRetries,
      1000
    );
  }

  getStrategies(): RecoveryStrategy[] {
    return [...this.strategies];
  }

  removeStrategy(name: string): boolean {
    const index = this.strategies.findIndex((s) => s.name === name);
    if (index !== -1) {
      this.strategies.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const errorRecovery = ErrorRecovery.getInstance();
