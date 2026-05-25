import {
  slidingWindowStrategy,
  tokenBucketStrategy,
} from '../../src/services/NotificationRateLimitStrategy';

describe('Notification Rate Limit Strategy', () => {
  describe('SlidingWindowStrategy', () => {
    beforeEach(() => {
      slidingWindowStrategy.reset('user-1');
    });

    describe('check', () => {
      it('should return true when within limit', () => {
        expect(slidingWindowStrategy.check('user-1')).toBe(true);
      });

      it('should return false when limit exceeded', () => {
        for (let i = 0; i < 100; i++) {
          slidingWindowStrategy.record('user-1');
        }
        expect(slidingWindowStrategy.check('user-1')).toBe(false);
      });
    });

    describe('record', () => {
      it('should record a request', () => {
        slidingWindowStrategy.record('user-1');
        expect(slidingWindowStrategy.check('user-1')).toBe(true);
      });
    });

    describe('reset', () => {
      it('should reset user rate limit', () => {
        slidingWindowStrategy.record('user-1');
        slidingWindowStrategy.reset('user-1');
        expect(slidingWindowStrategy.check('user-1')).toBe(true);
      });
    });
  });

  describe('TokenBucketStrategy', () => {
    beforeEach(() => {
      tokenBucketStrategy.reset('user-1');
    });

    describe('check', () => {
      it('should return true when tokens available', () => {
        expect(tokenBucketStrategy.check('user-1')).toBe(true);
      });

      it('should return false when no tokens', () => {
        for (let i = 0; i < 100; i++) {
          tokenBucketStrategy.record('user-1');
        }
        expect(tokenBucketStrategy.check('user-1')).toBe(false);
      });
    });

    describe('record', () => {
      it('should consume a token', () => {
        tokenBucketStrategy.record('user-1');
        expect(tokenBucketStrategy.check('user-1')).toBe(true);
      });
    });

    describe('reset', () => {
      it('should reset user tokens', () => {
        tokenBucketStrategy.record('user-1');
        tokenBucketStrategy.reset('user-1');
        expect(tokenBucketStrategy.check('user-1')).toBe(true);
      });
    });
  });
});
