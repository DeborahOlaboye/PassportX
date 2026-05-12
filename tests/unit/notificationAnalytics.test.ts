import { notificationAnalytics } from '../../src/services/NotificationAnalytics';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Analytics', () => {
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
    notificationAnalytics.reset();
  });

  describe('recordSent', () => {
    it('should record sent notification', () => {
      notificationAnalytics.recordSent(mockNotification);
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.totalSent).toBe(1);
    });

    it('should increment by type', () => {
      notificationAnalytics.recordSent(mockNotification);
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.byType[NotificationType.BADGE_MINTED]).toBe(1);
    });
  });

  describe('recordDelivered', () => {
    it('should record delivered notification', () => {
      notificationAnalytics.recordDelivered();
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.totalDelivered).toBe(1);
    });
  });

  describe('recordFailed', () => {
    it('should record failed notification', () => {
      notificationAnalytics.recordFailed();
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.totalFailed).toBe(1);
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', () => {
      notificationAnalytics.recordSent(mockNotification);
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.totalSent).toBe(1);
    });
  });

  describe('getDeliveryRate', () => {
    it('should calculate delivery rate', () => {
      notificationAnalytics.recordSent(mockNotification);
      notificationAnalytics.recordDelivered();
      const rate = notificationAnalytics.getDeliveryRate();
      expect(rate).toBe(100);
    });

    it('should return 0 when no notifications sent', () => {
      const rate = notificationAnalytics.getDeliveryRate();
      expect(rate).toBe(0);
    });
  });

  describe('getFailureRate', () => {
    it('should calculate failure rate', () => {
      notificationAnalytics.recordSent(mockNotification);
      notificationAnalytics.recordFailed();
      const rate = notificationAnalytics.getFailureRate();
      expect(rate).toBe(100);
    });
  });

  describe('reset', () => {
    it('should reset analytics', () => {
      notificationAnalytics.recordSent(mockNotification);
      notificationAnalytics.reset();
      const analytics = notificationAnalytics.getAnalytics();
      expect(analytics.totalSent).toBe(0);
    });
  });
});
