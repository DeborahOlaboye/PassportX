import { NotificationService } from '../../backend/services/NotificationService';
import { Notification } from '../../backend/models/Notification';
import { NotificationPreference } from '../../backend/models/NotificationPreference';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from '../../src/types/notification';

jest.mock('../../backend/models/Notification');
jest.mock('../../backend/models/NotificationPreference');

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user-1',
        type: NotificationType.BADGE_MINTED,
        title: 'Test Notification',
        message: 'Test message',
        status: NotificationStatus.UNREAD,
        channels: [NotificationChannel.IN_APP],
      };

      (Notification as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockNotification),
      }));

      const result = await service.createNotification(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      (Notification as any).countDocuments = jest.fn().mockResolvedValue(5);

      const count = await service.getUnreadCount('user-1');
      expect(count).toBe(5);
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        userId: 'user-1',
        status: NotificationStatus.UNREAD,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: '1',
        status: NotificationStatus.READ,
        readAt: new Date(),
      };

      (Notification as any).findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(mockNotification);

      const result = await service.markAsRead('1');
      expect(result).toEqual(mockNotification);
      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { status: NotificationStatus.READ, readAt: expect.any(Date) },
        { new: true }
      );
    });
  });
});
