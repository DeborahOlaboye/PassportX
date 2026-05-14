import { notificationRateLimiter } from '../../src/services/NotificationRateLimiter';

describe('Notification Rate Limiter', () => {
  beforeEach(() => {
    notificationRateLimiter.cleanup();
  });

  describe('canSend', () => {
    it('should allow sending within limit', () => {
      const canSend = notificationRateLimiter.canSend('user-1');
      expect(canSend).toBe(true);
    });

    it('should block sending after limit', () => {
      for (let i = 0; i < 10; i++) {
        notificationRateLimiter.canSend('user-1');
      }
      const canSend = notificationRateLimiter.canSend('user-1');
      expect(canSend).toBe(false);
    });
  });

  describe('getRemainingCount', () => {
    it('should return remaining count', () => {
      notificationRateLimiter.canSend('user-1');
      const remaining = notificationRateLimiter.getRemainingCount('user-1');
      expect(remaining).toBe(9);
    });

    it('should return 0 when limit reached', () => {
      for (let i = 0; i < 10; i++) {
        notificationRateLimiter.canSend('user-1');
      }
      const remaining = notificationRateLimiter.getRemainingCount('user-1');
      expect(remaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset user rate limit', () => {
      notificationRateLimiter.canSend('user-1');
      notificationRateLimiter.reset('user-1');
      const remaining = notificationRateLimiter.getRemainingCount('user-1');
      expect(remaining).toBe(10);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', (done) => {
      notificationRateLimiter.canSend('user-1');
      setTimeout(() => {
        notificationRateLimiter.cleanup();
        const remaining = notificationRateLimiter.getRemainingCount('user-1');
        expect(remaining).toBe(10);
        done();
      }, 65000);
    });
  });
});
