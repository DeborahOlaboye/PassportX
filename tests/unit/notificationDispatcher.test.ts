import { NotificationDispatcher } from '../../backend/services/NotificationDispatcher';
import { NotificationService } from '../../backend/services/NotificationService';
import { NotificationWebSocketService } from '../../backend/services/NotificationWebSocketService';
import { EmailNotificationService } from '../../backend/services/EmailNotificationService';
import { NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

jest.mock('../../backend/services/NotificationService');
jest.mock('../../backend/services/NotificationWebSocketService');
jest.mock('../../backend/services/EmailNotificationService');

describe('NotificationDispatcher', () => {
  let dispatcher: NotificationDispatcher;
  let mockWebSocketService: jest.Mocked<NotificationWebSocketService>;
  let mockEmailService: jest.Mocked<EmailNotificationService>;

  beforeEach(() => {
    mockWebSocketService = {
      sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockEmailService = {
      sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    dispatcher = new NotificationDispatcher(mockWebSocketService);
    jest.clearAllMocks();
  });

  describe('dispatch', () => {
    it('should create and dispatch notification', async () => {
      const mockNotification = {
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

      (NotificationService.prototype.createNotification as jest.Mock).mockResolvedValue(
        mockNotification
      );

      const result = await dispatcher.dispatch('user-1', 'test@email.com', {
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.IN_APP],
      });

      expect(result).toEqual(mockNotification);
    });

    it('should send WebSocket notification when channel is enabled', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.WEBSOCKET],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (NotificationService.prototype.createNotification as jest.Mock).mockResolvedValue(
        mockNotification
      );

      await dispatcher.dispatch('user-1', 'test@email.com', {
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.WEBSOCKET],
      });

      expect(mockWebSocketService.sendNotificationToUser).toHaveBeenCalledWith(
        'user-1',
        mockNotification
      );
    });

    it('should send email notification when channel is enabled', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.EMAIL],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (NotificationService.prototype.createNotification as jest.Mock).mockResolvedValue(
        mockNotification
      );

      await dispatcher.dispatch('user-1', 'test@email.com', {
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.EMAIL],
      });

      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
        'test@email.com',
        mockNotification
      );
    });
  });
});
