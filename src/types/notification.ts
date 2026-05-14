export enum NotificationType {
  BADGE_MINTED = 'badge_minted',
  BADGE_REVOKED = 'badge_revoked',
  COMMUNITY_INVITATION = 'community_invitation',
  ACHIEVEMENT_MILESTONE = 'achievement_milestone',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ADMIN_NOTIFICATION = 'admin_notification',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  WEBSOCKET = 'websocket',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface NotificationPreference {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
}
