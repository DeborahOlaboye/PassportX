import { Notification, NotificationType } from '@/types/notification';

export interface PriorityRule {
  type: NotificationType;
  priority: number;
}

class NotificationPriorityService {
  private priorityRules: Map<NotificationType, number> = new Map();
  private defaultPriority: number = 5;

  constructor() {
    this.setDefaultPriorities();
  }

  private setDefaultPriorities(): void {
    this.priorityRules.set(NotificationType.BADGE_MINTED, 8);
    this.priorityRules.set(NotificationType.BADGE_REVOKED, 9);
    this.priorityRules.set(NotificationType.COMMUNITY_INVITATION, 7);
    this.priorityRules.set(NotificationType.ACHIEVEMENT_MILESTONE, 8);
    this.priorityRules.set(NotificationType.SYSTEM_ANNOUNCEMENT, 10);
    this.priorityRules.set(NotificationType.ADMIN_NOTIFICATION, 9);
  }

  getPriority(notification: Notification): number {
    return this.priorityRules.get(notification.type) || this.defaultPriority;
  }

  setPriority(type: NotificationType, priority: number): void {
    this.priorityRules.set(type, priority);
  }

  setPriorityRules(rules: PriorityRule[]): void {
    rules.forEach((rule) => {
      this.priorityRules.set(rule.type, rule.priority);
    });
  }

  getDefaultPriority(): number {
    return this.defaultPriority;
  }

  setDefaultPriority(priority: number): void {
    this.defaultPriority = priority;
  }

  getAllPriorities(): Map<NotificationType, number> {
    return new Map(this.priorityRules);
  }

  reset(): void {
    this.priorityRules.clear();
    this.setDefaultPriorities();
  }
}

export const notificationPriorityService = new NotificationPriorityService();
