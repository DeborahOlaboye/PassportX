export interface RateLimitStrategy {
  check(userId: string): boolean;
  record(userId: string): void;
  reset(userId: string): void;
}

class SlidingWindowStrategy implements RateLimitStrategy {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter((ts) => now - ts < this.windowMs);
    return validRequests.length < this.maxRequests;
  }

  record(userId: string): void {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    userRequests.push(now);
    const validRequests = userRequests.filter((ts) => now - ts < this.windowMs);
    this.requests.set(userId, validRequests);
  }

  reset(userId: string): void {
    this.requests.delete(userId);
  }
}

class TokenBucketStrategy implements RateLimitStrategy {
  private tokens: Map<string, number> = new Map();
  private lastRefill: Map<string, number> = new Map();
  private capacity: number;
  private refillRate: number;

  constructor(capacity: number = 100, refillRate: number = 10) {
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  check(userId: string): boolean {
    this.refill(userId);
    return (this.tokens.get(userId) || 0) > 0;
  }

  record(userId: string): void {
    const currentTokens = this.tokens.get(userId) || this.capacity;
    this.tokens.set(userId, Math.max(0, currentTokens - 1));
  }

  reset(userId: string): void {
    this.tokens.delete(userId);
    this.lastRefill.delete(userId);
  }

  private refill(userId: string): void {
    const now = Date.now();
    const lastRefill = this.lastRefill.get(userId) || now;
    const elapsed = now - lastRefill;
    const tokensToAdd = Math.floor(elapsed / 1000) * this.refillRate;
    const currentTokens = this.tokens.get(userId) || this.capacity;
    this.tokens.set(
      userId,
      Math.min(this.capacity, currentTokens + tokensToAdd)
    );
    this.lastRefill.set(userId, now);
  }
}

export const slidingWindowStrategy = new SlidingWindowStrategy();
export const tokenBucketStrategy = new TokenBucketStrategy();
