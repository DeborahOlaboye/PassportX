import {
  getNotificationIcon,
  getNotificationColor,
  getChannelLabel,
  formatNotificationType,
} from '../../src/utils/notificationHelpers';
import {
  NotificationType,
  NotificationChannel,
} from '../../src/types/notification';

describe('notificationHelpers', () => {
  describe('getNotificationIcon', () => {
    it('should return correct icon for badge minted', () => {
      expect(getNotificationIcon(NotificationType.BADGE_MINTED)).toBe('🏆');
    });

    it('should return correct icon for badge revoked', () => {
      expect(getNotificationIcon(NotificationType.BADGE_REVOKED)).toBe('🚫');
    });

    it('should return default icon for unknown type', () => {
      expect(getNotificationIcon('unknown' as NotificationType)).toBe('📬');
    });
  });

  describe('getNotificationColor', () => {
    it('should return correct color for badge minted', () => {
      expect(getNotificationColor(NotificationType.BADGE_MINTED)).toBe(
        'text-yellow-600'
      );
    });

    it('should return correct color for badge revoked', () => {
      expect(getNotificationColor(NotificationType.BADGE_REVOKED)).toBe(
        'text-red-600'
      );
    });

    it('should return default color for unknown type', () => {
      expect(getNotificationColor('unknown' as NotificationType)).toBe(
        'text-gray-600'
      );
    });
  });

  describe('getChannelLabel', () => {
    it('should return correct label for in-app channel', () => {
      expect(getChannelLabel(NotificationChannel.IN_APP)).toBe('In-app');
    });

    it('should return correct label for email channel', () => {
      expect(getChannelLabel(NotificationChannel.EMAIL)).toBe('Email');
    });

    it('should return correct label for websocket channel', () => {
      expect(getChannelLabel(NotificationChannel.WEBSOCKET)).toBe('Push');
    });
  });

  describe('formatNotificationType', () => {
    it('should format badge_minted correctly', () => {
      expect(formatNotificationType(NotificationType.BADGE_MINTED)).toBe(
        'Badge Minted'
      );
    });

    it('should format community_invitation correctly', () => {
      expect(
        formatNotificationType(NotificationType.COMMUNITY_INVITATION)
      ).toBe('Community Invitation');
    });

    it('should format achievement_milestone correctly', () => {
      expect(
        formatNotificationType(NotificationType.ACHIEVEMENT_MILESTONE)
      ).toBe('Achievement Milestone');
    });
  });
});
