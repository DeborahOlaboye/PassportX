import {
  filterNotifications,
  getUniqueNotificationTypes,
  getUniqueNotificationStatuses,
} from '../../src/utils/notificationFilter';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Filter', () => {
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
    ];
  });

  describe('filterNotifications', () => {
    it('should filter by type', () => {
      const filtered = filterNotifications(mockNotifications, {
        type: NotificationType.BADGE_MINTED,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe(NotificationType.BADGE_MINTED);
    });

    it('should filter by status', () => {
      const filtered = filterNotifications(mockNotifications, {
        status: NotificationStatus.UNREAD,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe(NotificationStatus.UNREAD);
    });

    it('should filter by channel', () => {
      const filtered = filterNotifications(mockNotifications, {
        channel: NotificationChannel.IN_APP,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].channels).toContain(NotificationChannel.IN_APP);
    });

    it('should filter by search query', () => {
      const filtered = filterNotifications(mockNotifications, {
        searchQuery: 'badge',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title.toLowerCase()).toContain('badge');
    });
  });

  describe('getUniqueNotificationTypes', () => {
    it('should return unique notification types', () => {
      const types = getUniqueNotificationTypes(mockNotifications);
      expect(types).toHaveLength(2);
      expect(types).toContain(NotificationType.BADGE_MINTED);
      expect(types).toContain(NotificationType.COMMUNITY_INVITATION);
    });
  });

  describe('getUniqueNotificationStatuses', () => {
    it('should return unique notification statuses', () => {
      const statuses = getUniqueNotificationStatuses(mockNotifications);
      expect(statuses).toHaveLength(2);
      expect(statuses).toContain(NotificationStatus.UNREAD);
      expect(statuses).toContain(NotificationStatus.READ);
    });
  });
});
