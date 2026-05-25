import { notificationQueue } from '../../src/services/NotificationQueue';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../src/types/notification';

describe('Notification Queue', () => {
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
    notificationQueue.clear();
  });

  describe('enqueue', () => {
    it('should add notification to queue', () => {
      notificationQueue.enqueue(mockNotification);
      expect(notificationQueue.size()).toBe(1);
    });

    it('should sort by priority', () => {
      notificationQueue.enqueue(mockNotification, 1);
      notificationQueue.enqueue({ ...mockNotification, id: '2' }, 10);
      const peeked = notificationQueue.peek();
      expect(peeked?.notification.id).toBe('2');
    });
  });

  describe('dequeue', () => {
    it('should remove and return notification', () => {
      notificationQueue.enqueue(mockNotification);
      const dequeued = notificationQueue.dequeue();
      expect(dequeued?.notification.id).toBe('1');
      expect(notificationQueue.size()).toBe(0);
    });

    it('should return null when empty', () => {
      const dequeued = notificationQueue.dequeue();
      expect(dequeued).toBeNull();
    });
  });

  describe('peek', () => {
    it('should return first notification without removing', () => {
      notificationQueue.enqueue(mockNotification);
      const peeked = notificationQueue.peek();
      expect(peeked?.notification.id).toBe('1');
      expect(notificationQueue.size()).toBe(1);
    });
  });

  describe('size', () => {
    it('should return queue size', () => {
      notificationQueue.enqueue(mockNotification);
      notificationQueue.enqueue({ ...mockNotification, id: '2' });
      expect(notificationQueue.size()).toBe(2);
    });
  });

  describe('isEmpty', () => {
    it('should return true when empty', () => {
      expect(notificationQueue.isEmpty()).toBe(true);
    });

    it('should return false when not empty', () => {
      notificationQueue.enqueue(mockNotification);
      expect(notificationQueue.isEmpty()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear the queue', () => {
      notificationQueue.enqueue(mockNotification);
      notificationQueue.clear();
      expect(notificationQueue.isEmpty()).toBe(true);
    });
  });
});
