import { notificationScheduler } from '../../src/services/NotificationScheduler';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Scheduler', () => {
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
    notificationScheduler.clear();
  });

  describe('schedule', () => {
    it('should schedule a notification', () => {
      const scheduleId = notificationScheduler.schedule(mockNotification, 1000);
      expect(scheduleId).toBeDefined();
      expect(scheduleId).toContain(mockNotification.id);
    });

    it('should add to scheduled notifications', () => {
      notificationScheduler.schedule(mockNotification, 1000);
      const scheduled = notificationScheduler.getScheduledNotifications();
      expect(scheduled).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled notification', () => {
      const scheduleId = notificationScheduler.schedule(mockNotification, 1000);
      const cancelled = notificationScheduler.cancel(scheduleId);
      expect(cancelled).toBe(true);
    });

    it('should return false for non-existent schedule', () => {
      const cancelled = notificationScheduler.cancel('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return all scheduled notifications', () => {
      notificationScheduler.schedule(mockNotification, 1000);
      const scheduled = notificationScheduler.getScheduledNotifications();
      expect(scheduled).toHaveLength(1);
      expect(scheduled[0].notification.id).toBe(mockNotification.id);
    });
  });

  describe('clear', () => {
    it('should clear all scheduled notifications', () => {
      notificationScheduler.schedule(mockNotification, 1000);
      notificationScheduler.clear();
      const scheduled = notificationScheduler.getScheduledNotifications();
      expect(scheduled).toHaveLength(0);
    });
  });
});
