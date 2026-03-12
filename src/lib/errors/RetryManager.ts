/**
 * Retry mechanism with exponential backoff and circuit breaker pattern
 */

import { logger } from '../logger';
import { NetworkError, SystemError } from './ErrorTypes';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.options.resetTimeout) {
        throw new SystemError(
          'Circuit breaker is OPEN',
          'CIRCUIT_BREAKER_OPEN',
          { circuitBreakerState: this.state }
        );
      } else {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitBreakerState.CLOSED;
        logger.info('Circuit breaker transitioning to CLOSED');
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      logger.warn('Circuit breaker transitioning to OPEN', {
        failureCount: this.failureCount,
        threshold: this.options.failureThreshold
      });
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats(): Record<string, unknown> {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

export class RetryManager {
  private circuitBreakers = new Map<string, CircuitBreaker>();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    circuitBreakerKey?: string
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: this.defaultRetryCondition,
      ...options
    };

    const executeOperation = async (): Promise<T> => {
      if (circuitBreakerKey) {
        const circuitBreaker = this.getOrCreateCircuitBreaker(circuitBreakerKey);
        return circuitBreaker.execute(operation);
      }
      return operation();
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await executeOperation();
        
        if (attempt > 1) {
          logger.info('Operation succeeded after retry', {
            attempt,
            maxAttempts: config.maxAttempts
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        logger.warn('Operation failed', {
          attempt,
          maxAttempts: config.maxAttempts,
          error: lastError.message,
          willRetry: attempt < config.maxAttempts && config.retryCondition!(lastError)
        });

        // Don't retry if this is the last attempt or if retry condition fails
        if (attempt === config.maxAttempts || !config.retryCondition!(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    // All retries exhausted, throw the last error
    throw new NetworkError(
      `Operation failed after ${config.maxAttempts} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      { 
        maxAttempts: config.maxAttempts,
        originalError: lastError.message 
      },
      lastError
    );
  }

  private defaultRetryCondition(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof NetworkError) {
      return true;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch') ||
      message.includes('5') // 5xx errors
    );
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, options.maxDelay);

    if (options.jitter) {
      // Add random jitter to prevent thundering herd
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getOrCreateCircuitBreaker(key: string): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000 // 10 seconds
      });
      this.circuitBreakers.set(key, circuitBreaker);
    }
    return this.circuitBreakers.get(key)!;
  }

  getCircuitBreakerStats(key: string): Record<string, unknown> | null {
    const circuitBreaker = this.circuitBreakers.get(key);
    return circuitBreaker ? circuitBreaker.getStats() : null;
  }

  getAllCircuitBreakerStats(): Record<string, Record<string, unknown>> {
    const stats: Record<string, Record<string, unknown>> = {};
    for (const [key, circuitBreaker] of this.circuitBreakers) {
      stats[key] = circuitBreaker.getStats();
    }
    return stats;
  }

  resetCircuitBreaker(key: string): void {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  resetAllCircuitBreakers(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }
}

// Global retry manager instance
export const retryManager = new RetryManager();

// Utility function for common retry scenarios
export const withRetry = <T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> => {
  return retryManager.executeWithRetry(operation, options);
};

// Utility function for API calls with circuit breaker
export const withCircuitBreaker = <T>(
  operation: () => Promise<T>,
  circuitBreakerKey: string,
  options?: Partial<RetryOptions>
): Promise<T> => {
  return retryManager.executeWithRetry(operation, options, circuitBreakerKey);
};