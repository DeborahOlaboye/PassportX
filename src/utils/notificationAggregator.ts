import { Notification, NotificationType } from '@/types/notification';

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<string, number>;
}

export function aggregateNotificationStats(notifications: Notification[]): NotificationStats {
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => n.status === 'unread').length,
    byType: {} as Record<NotificationType, number>,
    byChannel: {} as Record<string, number>,
  };

  notifications.forEach((notification) => {
    stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    notification.channels.forEach((channel) => {
      stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
    });
  });

  return stats;
}

export function getNotificationCountByType(notifications: Notification[], type: NotificationType): number {
  return notifications.filter((n) => n.type === type).length;
}

export function getNotificationCountByChannel(notifications: Notification[], channel: string): number {
  return notifications.filter((n) => n.channels.some((c) => c === channel)).length;
}

export function getMostCommonNotificationType(notifications: Notification[]): NotificationType | null {
  const counts: Record<NotificationType, number> = {} as Record<NotificationType, number>;
  notifications.forEach((n) => {
    counts[n.type] = (counts[n.type] || 0) + 1;
  });

  let maxCount = 0;
  let mostCommon: NotificationType | null = null;

  Object.entries(counts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = type as NotificationType;
    }
  });

  return mostCommon;
}
