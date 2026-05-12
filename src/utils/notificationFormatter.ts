import { Notification, NotificationType, NotificationStatus } from '@/types/notification';

export function formatNotificationTitle(notification: Notification): string {
  const prefixes: Record<NotificationType, string> = {
    [NotificationType.BADGE_MINTED]: 'New Badge Earned',
    [NotificationType.BADGE_REVOKED]: 'Badge Revoked',
    [NotificationType.COMMUNITY_INVITATION]: 'Community Invitation',
    [NotificationType.ACHIEVEMENT_MILESTONE]: 'Achievement Milestone',
    [NotificationType.SYSTEM_ANNOUNCEMENT]: 'System Announcement',
    [NotificationType.ADMIN_NOTIFICATION]: 'Admin Notification',
  };
  return prefixes[notification.type] || notification.title;
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatNotificationStatus(status: NotificationStatus): string {
  const statusMap: Record<NotificationStatus, string> = {
    [NotificationStatus.UNREAD]: 'Unread',
    [NotificationStatus.READ]: 'Read',
    [NotificationStatus.ARCHIVED]: 'Archived',
  };
  return statusMap[status] || status;
}

export function truncateNotificationMessage(message: string, maxLength: number = 100): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}
