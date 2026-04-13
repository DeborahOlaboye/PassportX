import { RateLimiter } from '../RateLimiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
  });

  describe('canMakeRequest', () => {
    it('should allow requests within limit', () => {
      expect(limiter.canMakeRequest()).toBe(true);
      expect(limiter.canMakeRequest()).toBe(true);
      expect(limiter.canMakeRequest()).toBe(true);
    });

    it('should block requests over limit', () => {
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      expect(limiter.canMakeRequest()).toBe(false);
    });

    it('should reset after window expires', () => {
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      expect(limiter.canMakeRequest()).toBe(false);

      jest.advanceTimersByTime(1100);
      expect(limiter.canMakeRequest()).toBe(true);
    });
  });

  describe('getWaitTime', () => {
    it('should return 0 when no requests', () => {
      expect(limiter.getWaitTime()).toBe(0);
    });

    it('should return wait time when at limit', () => {
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      const waitTime = limiter.getWaitTime();
      expect(waitTime).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should track current requests', () => {
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      const stats = limiter.getStats();
      expect(stats.currentRequests).toBe(2);
      expect(stats.remainingSlots).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all request times', () => {
      limiter.canMakeRequest();
      limiter.canMakeRequest();
      limiter.reset();
      const stats = limiter.getStats();
      expect(stats.currentRequests).toBe(0);
      expect(stats.remainingSlots).toBe(3);
    });
  });
});
