import {
  formatNotificationTitle,
  formatNotificationTime,
  formatNotificationStatus,
  truncateNotificationMessage,
} from '../../src/utils/notificationFormatter';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Formatter', () => {
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
  });

  describe('formatNotificationTitle', () => {
    it('should format title with prefix', () => {
      const formatted = formatNotificationTitle(mockNotification);
      expect(formatted).toBe('New Badge Earned');
    });

    it('should return original title for unknown type', () => {
      mockNotification.type = 'unknown' as NotificationType;
      const formatted = formatNotificationTitle(mockNotification);
      expect(formatted).toBe('Test');
    });
  });

  describe('formatNotificationTime', () => {
    it('should return "Just now" for recent notifications', () => {
      mockNotification.createdAt = new Date();
      const formatted = formatNotificationTime(mockNotification.createdAt);
      expect(formatted).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 5);
      const formatted = formatNotificationTime(date);
      expect(formatted).toBe('5m ago');
    });

    it('should return hours ago', () => {
      const date = new Date();
      date.setHours(date.getHours() - 2);
      const formatted = formatNotificationTime(date);
      expect(formatted).toBe('2h ago');
    });

    it('should return days ago', () => {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const formatted = formatNotificationTime(date);
      expect(formatted).toBe('3d ago');
    });
  });

  describe('formatNotificationStatus', () => {
    it('should format status correctly', () => {
      expect(formatNotificationStatus(NotificationStatus.UNREAD)).toBe('Unread');
      expect(formatNotificationStatus(NotificationStatus.READ)).toBe('Read');
      expect(formatNotificationStatus(NotificationStatus.ARCHIVED)).toBe('Archived');
    });
  });

  describe('truncateNotificationMessage', () => {
    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(150);
      const truncated = truncateNotificationMessage(longMessage, 100);
      expect(truncated.length).toBe(100);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should not truncate short messages', () => {
      const shortMessage = 'Short message';
      const truncated = truncateNotificationMessage(shortMessage, 100);
      expect(truncated).toBe(shortMessage);
    });
  });
});
