import { notificationRetryHandler } from '../../src/services/NotificationRetryHandler';

describe('Notification Retry Handler', () => {
  beforeEach(() => {
    notificationRetryHandler.clear();
  });

  describe('shouldRetry', () => {
    it('should return true for first attempts', () => {
      expect(notificationRetryHandler.shouldRetry('notif-1')).toBe(true);
    });

    it('should return false after max retries', () => {
      for (let i = 0; i < 3; i++) {
        notificationRetryHandler.recordAttempt('notif-1');
      }
      expect(notificationRetryHandler.shouldRetry('notif-1')).toBe(false);
    });
  });

  describe('recordAttempt', () => {
    it('should increment attempt count', () => {
      notificationRetryHandler.recordAttempt('notif-1');
      expect(notificationRetryHandler.getAttemptCount('notif-1')).toBe(1);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate retry delay with backoff', () => {
      notificationRetryHandler.recordAttempt('notif-1');
      const delay = notificationRetryHandler.getRetryDelay('notif-1');
      expect(delay).toBe(2000);
    });

    it('should return base delay for first attempt', () => {
      const delay = notificationRetryHandler.getRetryDelay('notif-1');
      expect(delay).toBe(1000);
    });
  });

  describe('reset', () => {
    it('should reset attempt count', () => {
      notificationRetryHandler.recordAttempt('notif-1');
      notificationRetryHandler.reset('notif-1');
      expect(notificationRetryHandler.getAttemptCount('notif-1')).toBe(0);
    });
  });

  describe('getAttemptCount', () => {
    it('should return 0 for new notifications', () => {
      expect(notificationRetryHandler.getAttemptCount('notif-1')).toBe(0);
    });

    it('should return attempt count', () => {
      notificationRetryHandler.recordAttempt('notif-1');
      notificationRetryHandler.recordAttempt('notif-1');
      expect(notificationRetryHandler.getAttemptCount('notif-1')).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all attempts', () => {
      notificationRetryHandler.recordAttempt('notif-1');
      notificationRetryHandler.recordAttempt('notif-2');
      notificationRetryHandler.clear();
      expect(notificationRetryHandler.getAttemptCount('notif-1')).toBe(0);
      expect(notificationRetryHandler.getAttemptCount('notif-2')).toBe(0);
    });
  });
});
