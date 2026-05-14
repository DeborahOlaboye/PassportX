import { notificationThrottler } from '../../src/services/NotificationThrottler';

describe('Notification Throttler', () => {
  beforeEach(() => {
    notificationThrottler.reset();
  });

  describe('canSend', () => {
    it('should allow sending within limits', () => {
      expect(notificationThrottler.canSend()).toBe(true);
    });

    it('should block when limit reached', () => {
      for (let i = 0; i < 10; i++) {
        notificationThrottler.record();
      }
      expect(notificationThrottler.canSend()).toBe(false);
    });
  });

  describe('record', () => {
    it('should record timestamp', () => {
      notificationThrottler.record();
      const count = notificationThrottler.getCountInLastSecond();
      expect(count).toBe(1);
    });
  });

  describe('setConfig', () => {
    it('should update config', () => {
      notificationThrottler.setConfig({ maxPerSecond: 5 });
      const config = notificationThrottler.getConfig();
      expect(config.maxPerSecond).toBe(5);
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = notificationThrottler.getConfig();
      expect(config.maxPerSecond).toBe(10);
      expect(config.maxPerMinute).toBe(100);
    });
  });

  describe('getCountInLastSecond', () => {
    it('should return count in last second', () => {
      notificationThrottler.record();
      const count = notificationThrottler.getCountInLastSecond();
      expect(count).toBe(1);
    });
  });

  describe('getCountInLastMinute', () => {
    it('should return count in last minute', () => {
      notificationThrottler.record();
      const count = notificationThrottler.getCountInLastMinute();
      expect(count).toBe(1);
    });
  });

  describe('getCountInLastHour', () => {
    it('should return count in last hour', () => {
      notificationThrottler.record();
      const count = notificationThrottler.getCountInLastHour();
      expect(count).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all timestamps', () => {
      notificationThrottler.record();
      notificationThrottler.reset();
      expect(notificationThrottler.getCountInLastSecond()).toBe(0);
    });
  });
});
