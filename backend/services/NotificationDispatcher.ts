import { NotificationService } from './NotificationService';
import { NotificationWebSocketService } from './NotificationWebSocketService';
import { EmailNotificationService } from './EmailNotificationService';
import {
  Notification,
  NotificationChannel,
} from '../../src/types/notification';
import { INotification } from '../models/Notification';

export class NotificationDispatcher {
  private notificationService: NotificationService;
  private webSocketService?: NotificationWebSocketService;
  private emailService?: EmailNotificationService;

  constructor(webSocketService?: NotificationWebSocketService) {
    this.notificationService = new NotificationService();
    this.webSocketService = webSocketService;
    this.emailService = new EmailNotificationService();
  }

  async dispatch(
    userId: string,
    userEmail: string,
    notificationData: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<INotification> {
    const notification = await this.notificationService.createNotification({
      ...notificationData,
      userId,
    });

    if (
      notification.channels.includes(NotificationChannel.WEBSOCKET) &&
      this.webSocketService
    ) {
      await this.webSocketService.sendNotificationToUser(
        userId,
        notification as any
      );
    }

    if (
      notification.channels.includes(NotificationChannel.EMAIL) &&
      this.emailService
    ) {
      await this.emailService.sendNotificationEmail(
        userEmail,
        notification as any
      );
    }

    return notification;
  }
}
