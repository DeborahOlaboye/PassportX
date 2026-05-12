import { notificationCleanupService } from '../../src/services/NotificationCleanupService';
import { NotificationStatus } from '../../src/types/notification';

describe('Notification Cleanup Service', () => {
  describe('setConfig', () => {
    it('should update config', () => {
      notificationCleanupService.setConfig({ maxAge: 1000 });
      const config = notificationCleanupService.getConfig();
      expect(config.maxAge).toBe(1000);
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = notificationCleanupService.getConfig();
      expect(config.maxAge).toBeGreaterThan(0);
      expect(config.maxCount).toBeGreaterThan(0);
    });
  });

  describe('shouldCleanup', () => {
    it('should return true when age exceeds max', () => {
      const shouldCleanup = notificationCleanupService.shouldCleanup(100000000000, 100);
      expect(shouldCleanup).toBe(true);
    });

    it('should return true when count exceeds max', () => {
      const shouldCleanup = notificationCleanupService.shouldCleanup(1000, 20000);
      expect(shouldCleanup).toBe(true);
    });

    it('should return false when within limits', () => {
      const shouldCleanup = notificationCleanupService.shouldCleanup(1000, 100);
      expect(shouldCleanup).toBe(false);
    });
  });

  describe('getCleanupBatchSize', () => {
    it('should return batch size', () => {
      const batchSize = notificationCleanupService.getCleanupBatchSize();
      expect(batchSize).toBe(100);
    });
  });

  describe('getCleanupCriteria', () => {
    it('should return cleanup criteria', () => {
      const criteria = notificationCleanupService.getCleanupCriteria();
      expect(criteria).toHaveProperty('maxAge');
      expect(criteria).toHaveProperty('maxCount');
    });
  });

  describe('getStatusForCleanup', () => {
    it('should return true for archived status', () => {
      const shouldCleanup = notificationCleanupService.getStatusForCleanup(NotificationStatus.ARCHIVED);
      expect(shouldCleanup).toBe(true);
    });

    it('should return true for read status', () => {
      const shouldCleanup = notificationCleanupService.getStatusForCleanup(NotificationStatus.READ);
      expect(shouldCleanup).toBe(true);
    });

    it('should return false for unread status', () => {
      const shouldCleanup = notificationCleanupService.getStatusForCleanup(NotificationStatus.UNREAD);
      expect(shouldCleanup).toBe(false);
    });
  });
});
