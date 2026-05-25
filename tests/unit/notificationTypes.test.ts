import {
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Types', () => {
  describe('NotificationType', () => {
    it('should have all expected notification types', () => {
      expect(NotificationType.BADGE_MINTED).toBe('badge_minted');
      expect(NotificationType.BADGE_REVOKED).toBe('badge_revoked');
      expect(NotificationType.COMMUNITY_INVITATION).toBe(
        'community_invitation'
      );
      expect(NotificationType.ACHIEVEMENT_MILESTONE).toBe(
        'achievement_milestone'
      );
      expect(NotificationType.SYSTEM_ANNOUNCEMENT).toBe('system_announcement');
      expect(NotificationType.ADMIN_NOTIFICATION).toBe('admin_notification');
    });
  });

  describe('NotificationStatus', () => {
    it('should have all expected notification statuses', () => {
      expect(NotificationStatus.UNREAD).toBe('unread');
      expect(NotificationStatus.READ).toBe('read');
      expect(NotificationStatus.ARCHIVED).toBe('archived');
    });
  });

  describe('NotificationChannel', () => {
    it('should have all expected notification channels', () => {
      expect(NotificationChannel.IN_APP).toBe('in_app');
      expect(NotificationChannel.EMAIL).toBe('email');
      expect(NotificationChannel.WEBSOCKET).toBe('websocket');
    });
  });
});
