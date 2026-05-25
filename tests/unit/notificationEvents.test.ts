import {
  createNotificationEvent,
  NotificationEventType,
  NotificationEventUnion,
} from '../../src/types/notificationEvents';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Events', () => {
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

  describe('createNotificationEvent', () => {
    it('should create notification new event', () => {
      const event = createNotificationEvent(
        'notification:new',
        mockNotification,
        'user-1'
      );
      expect(event.type).toBe('notification:new');
      expect(event.notification).toEqual(mockNotification);
      expect(event.userId).toBe('user-1');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create notification read event', () => {
      const event = createNotificationEvent(
        'notification:read',
        mockNotification,
        'user-1'
      );
      expect(event.type).toBe('notification:read');
      expect(event.notification).toEqual(mockNotification);
    });

    it('should create notification deleted event', () => {
      const event = createNotificationEvent(
        'notification:deleted',
        mockNotification,
        'user-1'
      );
      expect(event.type).toBe('notification:deleted');
      expect(event.notification).toEqual(mockNotification);
    });
  });

  describe('NotificationEventType', () => {
    it('should have correct event types', () => {
      const validTypes: NotificationEventType[] = [
        'notification:new',
        'notification:read',
        'notification:deleted',
      ];
      expect(validTypes).toHaveLength(3);
    });
  });
});
