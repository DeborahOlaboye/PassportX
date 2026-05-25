import { Notification, NotificationStatus } from '@/types/notification';

export function sortNotificationsByDate(
  notifications: Notification[]
): Notification[] {
  return [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function sortNotificationsByStatus(
  notifications: Notification[]
): Notification[] {
  const statusOrder: Record<NotificationStatus, number> = {
    [NotificationStatus.UNREAD]: 0,
    [NotificationStatus.READ]: 1,
    [NotificationStatus.ARCHIVED]: 2,
  };
  return [...notifications].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export function sortNotificationsByType(
  notifications: Notification[]
): Notification[] {
  return [...notifications].sort((a, b) => {
    return a.type.localeCompare(b.type);
  });
}

export function groupNotificationsByType(
  notifications: Notification[]
): Record<string, Notification[]> {
  return notifications.reduce((acc, notification) => {
    if (!acc[notification.type]) {
      acc[notification.type] = [];
    }
    acc[notification.type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);
}

export function filterNotificationsByStatus(
  notifications: Notification[],
  status: NotificationStatus
): Notification[] {
  return notifications.filter((n) => n.status === status);
}

export function filterNotificationsByType(
  notifications: Notification[],
  type: string
): Notification[] {
  return notifications.filter((n) => n.type === type);
}
