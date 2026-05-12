import { NotificationType, NotificationChannel } from '@/types/notification';

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    [NotificationType.BADGE_MINTED]: '🏆',
    [NotificationType.BADGE_REVOKED]: '🚫',
    [NotificationType.COMMUNITY_INVITATION]: '🎉',
    [NotificationType.ACHIEVEMENT_MILESTONE]: '⭐',
    [NotificationType.SYSTEM_ANNOUNCEMENT]: '📢',
    [NotificationType.ADMIN_NOTIFICATION]: '🔔',
  };
  return icons[type] || '📬';
}

export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    [NotificationType.BADGE_MINTED]: 'text-yellow-600',
    [NotificationType.BADGE_REVOKED]: 'text-red-600',
    [NotificationType.COMMUNITY_INVITATION]: 'text-green-600',
    [NotificationType.ACHIEVEMENT_MILESTONE]: 'text-purple-600',
    [NotificationType.SYSTEM_ANNOUNCEMENT]: 'text-blue-600',
    [NotificationType.ADMIN_NOTIFICATION]: 'text-orange-600',
  };
  return colors[type] || 'text-gray-600';
}

export function getChannelLabel(channel: NotificationChannel): string {
  const labels: Record<NotificationChannel, string> = {
    [NotificationChannel.IN_APP]: 'In-app',
    [NotificationChannel.EMAIL]: 'Email',
    [NotificationChannel.WEBSOCKET]: 'Push',
  };
  return labels[channel] || channel;
}

export function formatNotificationType(type: NotificationType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
