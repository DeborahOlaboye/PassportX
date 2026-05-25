export interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
}

class NotificationRetryHandler {
  private config: RetryConfig;
  private retryCount: Map<string, number> = new Map();

  constructor(
    config: RetryConfig = {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
    }
  ) {
    this.config = config;
  }

  shouldRetry(notificationId: string): boolean {
    const attempts = this.retryCount.get(notificationId) || 0;
    return attempts < this.config.maxRetries;
  }

  recordAttempt(notificationId: string): void {
    const attempts = this.retryCount.get(notificationId) || 0;
    this.retryCount.set(notificationId, attempts + 1);
  }

  getRetryDelay(notificationId: string): number {
    const attempts = this.retryCount.get(notificationId) || 0;
    return (
      this.config.retryDelayMs *
      Math.pow(this.config.backoffMultiplier, attempts)
    );
  }

  reset(notificationId: string): void {
    this.retryCount.delete(notificationId);
  }

  clear(): void {
    this.retryCount.clear();
  }

  getAttemptCount(notificationId: string): number {
    return this.retryCount.get(notificationId) || 0;
  }
}

export const notificationRetryHandler = new NotificationRetryHandler();
