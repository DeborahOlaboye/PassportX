import { NotificationType, NotificationChannel } from '@/types/notification';

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannel[] = [
  NotificationChannel.IN_APP,
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.BADGE_MINTED]: 'Badge Minted',
  [NotificationType.BADGE_REVOKED]: 'Badge Revoked',
  [NotificationType.COMMUNITY_INVITATION]: 'Community Invitation',
  [NotificationType.ACHIEVEMENT_MILESTONE]: 'Achievement Milestone',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'System Announcement',
  [NotificationType.ADMIN_NOTIFICATION]: 'Admin Notification',
};

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannel, string> =
  {
    [NotificationChannel.IN_APP]: 'In-App',
    [NotificationChannel.EMAIL]: 'Email',
    [NotificationChannel.WEBSOCKET]: 'Push',
  };

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.BADGE_MINTED]: '🏆',
  [NotificationType.BADGE_REVOKED]: '🚫',
  [NotificationType.COMMUNITY_INVITATION]: '🎉',
  [NotificationType.ACHIEVEMENT_MILESTONE]: '⭐',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: '📢',
  [NotificationType.ADMIN_NOTIFICATION]: '🔔',
};

export const MAX_NOTIFICATIONS_PER_PAGE = 50;
export const MAX_UNREAD_DISPLAY = 99;
