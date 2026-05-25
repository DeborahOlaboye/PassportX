import { NotificationChannel } from '@/types/notification';

export interface NotificationConfig {
  enabled: boolean;
  defaultChannels: NotificationChannel[];
  maxNotificationsPerUser: number;
  notificationRetentionDays: number;
  emailEnabled: boolean;
  websocketEnabled: boolean;
}

export const notificationConfig: NotificationConfig = {
  enabled: true,
  defaultChannels: [NotificationChannel.IN_APP],
  maxNotificationsPerUser: 1000,
  notificationRetentionDays: 90,
  emailEnabled: process.env.SMTP_HOST ? true : false,
  websocketEnabled: process.env.ENABLE_NOTIFICATION_WEBSOCKET === 'true',
};

export function getNotificationConfig(): NotificationConfig {
  return notificationConfig;
}

export function isEmailNotificationEnabled(): boolean {
  return notificationConfig.emailEnabled;
}

export function isWebSocketNotificationEnabled(): boolean {
  return notificationConfig.websocketEnabled;
}
