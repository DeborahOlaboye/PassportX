import { notificationBatchProcessor } from '../../src/services/NotificationBatchProcessor';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Batch Processor', () => {
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
    notificationBatchProcessor.clear();
  });

  describe('add', () => {
    it('should add notification to batch', () => {
      notificationBatchProcessor.add(mockNotification);
      expect(notificationBatchProcessor.getBatchSize()).toBe(1);
    });

    it('should auto-flush when batch size reached', async () => {
      const processor =
        new (require('../../src/services/NotificationBatchProcessor').NotificationBatchProcessor)(
          { batchSize: 2, delayMs: 10 }
        );
      processor.add(mockNotification);
      processor.add({ ...mockNotification, id: '2' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(processor.getBatchSize()).toBe(0);
    });
  });

  describe('flush', () => {
    it('should flush the batch', async () => {
      notificationBatchProcessor.add(mockNotification);
      await notificationBatchProcessor.flush();
      expect(notificationBatchProcessor.getBatchSize()).toBe(0);
    });

    it('should handle empty batch', async () => {
      await notificationBatchProcessor.flush();
      expect(notificationBatchProcessor.getBatchSize()).toBe(0);
    });
  });

  describe('getBatchSize', () => {
    it('should return current batch size', () => {
      notificationBatchProcessor.add(mockNotification);
      notificationBatchProcessor.add({ ...mockNotification, id: '2' });
      expect(notificationBatchProcessor.getBatchSize()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear the batch', () => {
      notificationBatchProcessor.add(mockNotification);
      notificationBatchProcessor.clear();
      expect(notificationBatchProcessor.getBatchSize()).toBe(0);
    });
  });
});
