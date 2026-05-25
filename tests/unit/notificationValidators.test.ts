import {
  validateNotificationType,
  validateNotificationChannel,
  validateNotificationChannels,
  validateNotificationTitle,
  validateNotificationMessage,
  sanitizeNotificationText,
} from '../../src/validators/notificationValidator';
import {
  NotificationType,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Validators', () => {
  describe('validateNotificationType', () => {
    it('should return true for valid notification types', () => {
      expect(validateNotificationType(NotificationType.BADGE_MINTED)).toBe(
        true
      );
      expect(
        validateNotificationType(NotificationType.COMMUNITY_INVITATION)
      ).toBe(true);
    });

    it('should return false for invalid notification types', () => {
      expect(validateNotificationType('invalid_type')).toBe(false);
      expect(validateNotificationType('')).toBe(false);
    });
  });

  describe('validateNotificationChannel', () => {
    it('should return true for valid notification channels', () => {
      expect(validateNotificationChannel(NotificationChannel.IN_APP)).toBe(
        true
      );
      expect(validateNotificationChannel(NotificationChannel.EMAIL)).toBe(true);
    });

    it('should return false for invalid notification channels', () => {
      expect(validateNotificationChannel('invalid_channel')).toBe(false);
      expect(validateNotificationChannel('')).toBe(false);
    });
  });

  describe('validateNotificationChannels', () => {
    it('should return true for valid channel array', () => {
      expect(
        validateNotificationChannels([
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
        ])
      ).toBe(true);
    });

    it('should return false for invalid channel array', () => {
      expect(validateNotificationChannels(['invalid_channel'])).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(validateNotificationChannels([])).toBe(true);
    });
  });

  describe('validateNotificationTitle', () => {
    it('should return true for valid title', () => {
      expect(validateNotificationTitle('Test Title')).toBe(true);
    });

    it('should return false for empty title', () => {
      expect(validateNotificationTitle('')).toBe(false);
      expect(validateNotificationTitle('   ')).toBe(false);
    });

    it('should return false for title exceeding max length', () => {
      expect(validateNotificationTitle('a'.repeat(201))).toBe(false);
    });
  });

  describe('validateNotificationMessage', () => {
    it('should return true for valid message', () => {
      expect(validateNotificationMessage('Test Message')).toBe(true);
    });

    it('should return false for empty message', () => {
      expect(validateNotificationMessage('')).toBe(false);
      expect(validateNotificationMessage('   ')).toBe(false);
    });

    it('should return false for message exceeding max length', () => {
      expect(validateNotificationMessage('a'.repeat(1001))).toBe(false);
    });
  });

  describe('sanitizeNotificationText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeNotificationText('<script>alert("xss")</script>')).toBe(
        'alert("xss")'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeNotificationText('  test  ')).toBe('test');
    });
  });
});
