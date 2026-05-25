import { NotificationType, NotificationChannel } from '@/types/notification';

export function validateNotificationType(type: string): type is NotificationType {
  return Object.values(NotificationType).includes(type as NotificationType);
}

export function validateNotificationChannel(channel: string): channel is NotificationChannel {
  return Object.values(NotificationChannel).includes(channel as NotificationChannel);
}

export function validateNotificationChannels(channels: string[]): channels is NotificationChannel[] {
  return channels.every(validateNotificationChannel);
}

export function validateNotificationTitle(title: string): boolean {
  return typeof title === 'string' && title.trim().length > 0 && title.length <= 200;
}

export function validateNotificationMessage(message: string): boolean {
  return typeof message === 'string' && message.trim().length > 0 && message.length <= 1000;
}

export function sanitizeNotificationText(text: string): string {
  return text.trim().replace(/<[^>]*>/g, '');
}
