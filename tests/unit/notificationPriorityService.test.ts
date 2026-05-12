import { notificationPriorityService } from '../../src/services/NotificationPriorityService';
import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '../../src/types/notification';

describe('Notification Priority Service', () => {
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

  describe('getPriority', () => {
    it('should return priority for notification type', () => {
      const priority = notificationPriorityService.getPriority(mockNotification);
      expect(priority).toBe(8);
    });

    it('should return default priority for unknown type', () => {
      mockNotification.type = 'unknown' as NotificationType;
      const priority = notificationPriorityService.getPriority(mockNotification);
      expect(priority).toBe(5);
    });
  });

  describe('setPriority', () => {
    it('should set priority for type', () => {
      notificationPriorityService.setPriority(NotificationType.BADGE_MINTED, 10);
      const priority = notificationPriorityService.getPriority(mockNotification);
      expect(priority).toBe(10);
    });
  });

  describe('setPriorityRules', () => {
    it('should set multiple priority rules', () => {
      const rules = [
        { type: NotificationType.BADGE_MINTED, priority: 10 },
        { type: NotificationType.COMMUNITY_INVITATION, priority: 5 },
      ];
      notificationPriorityService.setPriorityRules(rules);
      const priority = notificationPriorityService.getPriority(mockNotification);
      expect(priority).toBe(10);
    });
  });

  describe('getDefaultPriority', () => {
    it('should return default priority', () => {
      const defaultPriority = notificationPriorityService.getDefaultPriority();
      expect(defaultPriority).toBe(5);
    });
  });

  describe('setDefaultPriority', () => {
    it('should set default priority', () => {
      notificationPriorityService.setDefaultPriority(3);
      const defaultPriority = notificationPriorityService.getDefaultPriority();
      expect(defaultPriority).toBe(3);
    });
  });

  describe('getAllPriorities', () => {
    it('should return all priorities', () => {
      const priorities = notificationPriorityService.getAllPriorities();
      expect(priorities.size).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should reset to default priorities', () => {
      notificationPriorityService.setPriority(NotificationType.BADGE_MINTED, 10);
      notificationPriorityService.reset();
      const priority = notificationPriorityService.getPriority(mockNotification);
      expect(priority).toBe(8);
    });
  });
});
