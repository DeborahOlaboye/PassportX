import { notificationDigestService } from '../../src/services/NotificationDigestService';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Digest Service', () => {
  let mockNotification: Notification;

  beforeEach(() => {
    mockNotification = {
      id: '1',
      userId: 'user-1',
      type: NotificationType.BADGE_MINTED,
      title: 'Test',
      message: 'Test message',
      status: NotificationStatus.UNREAD,
      channels: [NotificationChannel.IN_APP],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    notificationDigestService.clearAll();
  });

  describe('addToDigest', () => {
    it('should add notification to digest', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      const count = notificationDigestService.getDigestCount('user-1');
      expect(count).toBe(1);
    });

    it('should auto-send when max reached', () => {
      notificationDigestService.setConfig({ maxNotificationsPerDigest: 2 });
      notificationDigestService.addToDigest('user-1', mockNotification);
      notificationDigestService.addToDigest('user-1', { ...mockNotification, id: '2' });
      const count = notificationDigestService.getDigestCount('user-1');
      expect(count).toBe(0);
    });
  });

  describe('sendDigest', () => {
    it('should clear pending digest', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      notificationDigestService.sendDigest('user-1');
      const count = notificationDigestService.getDigestCount('user-1');
      expect(count).toBe(0);
    });
  });

  describe('getPendingDigest', () => {
    it('should return pending notifications', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      const pending = notificationDigestService.getPendingDigest('user-1');
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('1');
    });

    it('should return empty array for no pending', () => {
      const pending = notificationDigestService.getPendingDigest('user-1');
      expect(pending).toHaveLength(0);
    });
  });

  describe('getDigestCount', () => {
    it('should return count of pending notifications', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      notificationDigestService.addToDigest('user-1', { ...mockNotification, id: '2' });
      const count = notificationDigestService.getDigestCount('user-1');
      expect(count).toBe(2);
    });
  });

  describe('setConfig', () => {
    it('should update config', () => {
      notificationDigestService.setConfig({ interval: 'hourly' });
      const config = notificationDigestService.getConfig();
      expect(config.interval).toBe('hourly');
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = notificationDigestService.getConfig();
      expect(config.interval).toBe('daily');
      expect(config.maxNotificationsPerDigest).toBe(20);
    });
  });

  describe('clearUserDigest', () => {
    it('should clear user digest', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      notificationDigestService.clearUserDigest('user-1');
      const count = notificationDigestService.getDigestCount('user-1');
      expect(count).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all digests', () => {
      notificationDigestService.addToDigest('user-1', mockNotification);
      notificationDigestService.addToDigest('user-2', mockNotification);
      notificationDigestService.clearAll();
      expect(notificationDigestService.getDigestCount('user-1')).toBe(0);
      expect(notificationDigestService.getDigestCount('user-2')).toBe(0);
    });
  });
});
