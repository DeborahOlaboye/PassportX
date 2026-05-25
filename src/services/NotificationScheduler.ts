import { Notification } from '@/types/notification';

export interface ScheduledNotification {
  notification: Notification;
  scheduledTime: Date;
}

class NotificationScheduler {
  private scheduledNotifications: Map<string, ScheduledNotification> =
    new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  schedule(notification: Notification, delayMs: number): string {
    const scheduledTime = new Date(Date.now() + delayMs);
    const scheduledNotification: ScheduledNotification = {
      notification,
      scheduledTime,
    };

    const id = `${notification.id}_${scheduledTime.getTime()}`;
    this.scheduledNotifications.set(id, scheduledNotification);

    const timer = setTimeout(() => {
      this.executeScheduledNotification(id);
    }, delayMs);

    this.timers.set(id, timer);

    return id;
  }

  cancel(scheduleId: string): boolean {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
      this.scheduledNotifications.delete(scheduleId);
      return true;
    }
    return false;
  }

  private executeScheduledNotification(scheduleId: string): void {
    const scheduled = this.scheduledNotifications.get(scheduleId);
    if (scheduled) {
      // Execute notification dispatch here
      this.scheduledNotifications.delete(scheduleId);
      this.timers.delete(scheduleId);
    }
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.scheduledNotifications.clear();
  }
}

export const notificationScheduler = new NotificationScheduler();
