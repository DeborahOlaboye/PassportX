export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  onRateLimit?: () => void;
}

export class RateLimiter {
  private requestTimes: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.config.windowMs
    );

    if (this.requestTimes.length >= this.config.maxRequests) {
      this.config.onRateLimit?.();
      return false;
    }

    this.requestTimes.push(now);
    return true;
  }

  getWaitTime(): number {
    if (this.requestTimes.length === 0) return 0;
    const oldestRequest = Math.min(...this.requestTimes);
    const windowEnd = oldestRequest + this.config.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }

  reset(): void {
    this.requestTimes = [];
  }

  getStats(): { currentRequests: number; remainingSlots: number } {
    const now = Date.now();
    const activeRequests = this.requestTimes.filter(
      (time) => now - time < this.config.windowMs
    ).length;
    return {
      currentRequests: activeRequests,
      remainingSlots: Math.max(0, this.config.maxRequests - activeRequests),
    };
  }
}

export const createRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  return new RateLimiter({
    maxRequests: config.maxRequests || 100,
    windowMs: config.windowMs || 60000,
    onRateLimit: config.onRateLimit,
  });
};
