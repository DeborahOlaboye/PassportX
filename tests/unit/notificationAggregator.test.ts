import {
  aggregateNotificationStats,
  getNotificationCountByType,
  getNotificationCountByChannel,
  getMostCommonNotificationType,
} from '../../src/utils/notificationAggregator';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Aggregator', () => {
  let mockNotifications: Notification[];

  beforeEach(() => {
    mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Badge Earned',
        message: 'You earned a new badge',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.IN_APP],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        userId: 'user-1',
        type: NotificationType.COMMUNITY_INVITATION,
        title: 'Community Invite',
        message: 'You are invited to join',
        status: NotificationStatus.READ,
        channels: [NotificationChannel.EMAIL],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Another Badge',
        message: 'Another badge earned',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
    ];
  });

  describe('aggregateNotificationStats', () => {
    it('should aggregate notification stats correctly', () => {
      const stats = aggregateNotificationStats(mockNotifications);
      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(2);
      expect(stats.byType[NotificationType.BADGE_MINTED]).toBe(2);
      expect(stats.byType[NotificationType.COMMUNITY_INVITATION]).toBe(1);
      expect(stats.byChannel[NotificationChannel.IN_APP]).toBe(2);
      expect(stats.byChannel[NotificationChannel.EMAIL]).toBe(2);
    });
  });

  describe('getNotificationCountByType', () => {
    it('should return count for specific type', () => {
      const count = getNotificationCountByType(mockNotifications, NotificationType.BADGE_MINTED);
      expect(count).toBe(2);
    });
  });

  describe('getNotificationCountByChannel', () => {
    it('should return count for specific channel', () => {
      const count = getNotificationCountByChannel(mockNotifications, 'in_app');
      expect(count).toBe(2);
    });
  });

  describe('getMostCommonNotificationType', () => {
    it('should return most common notification type', () => {
      const mostCommon = getMostCommonNotificationType(mockNotifications);
      expect(mostCommon).toBe(NotificationType.BADGE_MINTED);
    });

    it('should return null for empty array', () => {
      const mostCommon = getMostCommonNotificationType([]);
      expect(mostCommon).toBeNull();
    });
  });
});
