import {
  sortNotificationsByDate,
  sortNotificationsByStatus,
  sortNotificationsByType,
  groupNotificationsByType,
  filterNotificationsByStatus,
  filterNotificationsByType,
} from '../../src/utils/notificationSorter';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Sorter', () => {
  let mockNotifications: Notification[];

  beforeEach(() => {
    mockNotifications = [
      {
        id: '1',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test 1',
        message: 'Message 1',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.IN_APP],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        userId: 'user-1',
        type: NotificationType.COMMUNITY_INVITATION,
        title: 'Test 2',
        message: 'Message 2',
        status: NotificationStatus.READ,
        channels: [NotificationChannel.IN_APP],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];
  });

  describe('sortNotificationsByDate', () => {
    it('should sort by date descending', () => {
      const sorted = sortNotificationsByDate(mockNotifications);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });
  });

  describe('sortNotificationsByStatus', () => {
    it('should sort by status', () => {
      const sorted = sortNotificationsByStatus(mockNotifications);
      expect(sorted[0].status).toBe(NotificationStatus.UNREAD);
      expect(sorted[1].status).toBe(NotificationStatus.READ);
    });
  });

  describe('sortNotificationsByType', () => {
    it('should sort by type alphabetically', () => {
      const sorted = sortNotificationsByType(mockNotifications);
      expect(sorted[0].type).toBe(NotificationType.BADGE_MINTED);
      expect(sorted[1].type).toBe(NotificationType.COMMUNITY_INVITATION);
    });
  });

  describe('groupNotificationsByType', () => {
    it('should group notifications by type', () => {
      const grouped = groupNotificationsByType(mockNotifications);
      expect(grouped[NotificationType.BADGE_MINTED]).toHaveLength(1);
      expect(grouped[NotificationType.COMMUNITY_INVITATION]).toHaveLength(1);
    });
  });

  describe('filterNotificationsByStatus', () => {
    it('should filter by status', () => {
      const filtered = filterNotificationsByStatus(mockNotifications, NotificationStatus.UNREAD);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe(NotificationStatus.UNREAD);
    });
  });

  describe('filterNotificationsByType', () => {
    it('should filter by type', () => {
      const filtered = filterNotificationsByType(mockNotifications, NotificationType.BADGE_MINTED);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe(NotificationType.BADGE_MINTED);
    });
  });
});
