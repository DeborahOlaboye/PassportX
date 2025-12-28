/**
 * ExponentialBackoffService
 *
 * Implements exponential backoff with jitter for retry mechanisms.
 * Helps prevent thundering herd problems and provides progressive retry delays.
 */

export interface BackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterFactor: number;
  maxAttempts: number;
}

export interface BackoffResult {
  delayMs: number;
  nextRetryAt: Date;
  shouldRetry: boolean;
  attemptNumber: number;
}

export class ExponentialBackoffService {
  private defaultConfig: BackoffConfig = {
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    multiplier: 2,
    jitterFactor: 0.1,
    maxAttempts: 5
  };

  constructor(private config: Partial<BackoffConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Calculate the next retry delay with exponential backoff and jitter
   */
  calculateBackoff(attemptNumber: number, customConfig?: Partial<BackoffConfig>): BackoffResult {
    const config = { ...this.config, ...customConfig } as BackoffConfig;

    if (attemptNumber >= config.maxAttempts) {
      return {
        delayMs: 0,
        nextRetryAt: new Date(),
        shouldRetry: false,
        attemptNumber
      };
    }

    // Calculate exponential delay
    const exponentialDelay = Math.min(
      config.initialDelayMs * Math.pow(config.multiplier, attemptNumber),
      config.maxDelayMs
    );

    // Add jitter to prevent thundering herd
    const jitter = this.calculateJitter(exponentialDelay, config.jitterFactor);
    const delayMs = Math.floor(exponentialDelay + jitter);

    const nextRetryAt = new Date(Date.now() + delayMs);

    return {
      delayMs,
      nextRetryAt,
      shouldRetry: true,
      attemptNumber: attemptNumber + 1
    };
  }

  /**
   * Calculate jitter to add randomness to retry delays
   */
  private calculateJitter(delay: number, jitterFactor: number): number {
    const maxJitter = delay * jitterFactor;
    return (Math.random() - 0.5) * 2 * maxJitter;
  }

  /**
   * Get delay for specific error types with different strategies
   */
  getErrorSpecificBackoff(
    attemptNumber: number,
    errorType: 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown'
  ): BackoffResult {
    let customConfig: Partial<BackoffConfig> = {};

    switch (errorType) {
      case 'rate_limit':
        // Longer delays for rate limiting
        customConfig = {
          initialDelayMs: 5000,
          maxDelayMs: 600000, // 10 minutes
          multiplier: 3
        };
        break;

      case 'network':
        // Faster retries for network issues
        customConfig = {
          initialDelayMs: 500,
          maxDelayMs: 60000, // 1 minute
          multiplier: 2
        };
        break;

      case 'timeout':
        // Medium delay for timeouts
        customConfig = {
          initialDelayMs: 2000,
          maxDelayMs: 120000, // 2 minutes
          multiplier: 2.5
        };
        break;

      case 'server_error':
        // Standard exponential backoff
        customConfig = {
          initialDelayMs: 1000,
          maxDelayMs: 300000, // 5 minutes
          multiplier: 2
        };
        break;

      case 'validation':
        // Don't retry validation errors by default
        return {
          delayMs: 0,
          nextRetryAt: new Date(),
          shouldRetry: false,
          attemptNumber
        };

      default:
        // Use default config for unknown errors
        customConfig = {};
    }

    return this.calculateBackoff(attemptNumber, customConfig);
  }

  /**
   * Check if an error is retryable based on error type
   */
  isRetryableError(errorType: string): boolean {
    const nonRetryableErrors = ['validation'];
    return !nonRetryableErrors.includes(errorType);
  }

  /**
   * Calculate total time spent retrying
   */
  calculateTotalRetryTime(attemptNumber: number, customConfig?: Partial<BackoffConfig>): number {
    const config = { ...this.config, ...customConfig } as BackoffConfig;
    let totalTime = 0;

    for (let i = 0; i < attemptNumber; i++) {
      const exponentialDelay = Math.min(
        config.initialDelayMs * Math.pow(config.multiplier, i),
        config.maxDelayMs
      );
      totalTime += exponentialDelay;
    }

    return totalTime;
  }

  /**
   * Reset backoff by returning to initial attempt
   */
  reset(): BackoffResult {
    return this.calculateBackoff(0);
  }
}

export default new ExponentialBackoffService();
