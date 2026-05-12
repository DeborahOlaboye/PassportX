import { NotificationService } from './NotificationService';
import { NotificationWebSocketService } from './NotificationWebSocketService';
import { EmailNotificationService } from './EmailNotificationService';
import { Notification, NotificationChannel } from '../../src/types/notification';

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
  ): Promise<Notification> {
    const notification = await this.notificationService.createNotification({
      ...notificationData,
      userId,
    });

    if (notification.channels.includes(NotificationChannel.WEBSOCKET) && this.webSocketService) {
      await this.webSocketService.sendNotificationToUser(userId, notification);
    }

    if (notification.channels.includes(NotificationChannel.EMAIL) && this.emailService) {
      await this.emailService.sendNotificationEmail(userEmail, notification);
    }

    return notification;
  }
}
