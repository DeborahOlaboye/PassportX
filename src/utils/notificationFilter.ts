import { Notification, NotificationType, NotificationStatus, NotificationChannel } from '@/types/notification';

export interface NotificationFilterOptions {
  type?: NotificationType;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export function filterNotifications(notifications: Notification[], options: NotificationFilterOptions): Notification[] {
  let filtered = [...notifications];

  if (options.type) {
    filtered = filtered.filter((n) => n.type === options.type);
  }

  if (options.status) {
    filtered = filtered.filter((n) => n.status === options.status);
  }

  if (options.channel) {
    filtered = filtered.filter((n) => n.channels.some((c) => c === options.channel));
  }

  if (options.startDate) {
    const startDate = new Date(options.startDate);
    filtered = filtered.filter((n) => new Date(n.createdAt) >= startDate);
  }

  if (options.endDate) {
    const endDate = new Date(options.endDate);
    filtered = filtered.filter((n) => new Date(n.createdAt) <= endDate);
  }

  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }

  return filtered;
}

export function getUniqueNotificationTypes(notifications: Notification[]): NotificationType[] {
  const types = new Set(notifications.map((n) => n.type));
  return Array.from(types);
}

export function getUniqueNotificationStatuses(notifications: Notification[]): NotificationStatus[] {
  const statuses = new Set(notifications.map((n) => n.status));
  return Array.from(statuses);
}
