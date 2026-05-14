import { Notification } from './notification';

export type NotificationEventType = 'notification:new' | 'notification:read' | 'notification:deleted';

export interface NotificationEvent {
  type: NotificationEventType;
  notification: Notification;
  userId: string;
  timestamp: Date;
}

export interface NotificationNewEvent extends NotificationEvent {
  type: 'notification:new';
}

export interface NotificationReadEvent extends NotificationEvent {
  type: 'notification:read';
}

export interface NotificationDeletedEvent extends NotificationEvent {
  type: 'notification:deleted';
}

export type NotificationEventUnion = NotificationNewEvent | NotificationReadEvent | NotificationDeletedEvent;

export function createNotificationEvent(
  type: NotificationEventType,
  notification: Notification,
  userId: string
): NotificationEventUnion {
  return {
    type,
    notification,
    userId,
    timestamp: new Date(),
  } as NotificationEventUnion;
}
