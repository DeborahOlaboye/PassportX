import { Notification, INotification } from '../models/Notification';
import { NotificationPreference, INotificationPreference } from '../models/NotificationPreference';
import { NotificationType, NotificationChannel, NotificationStatus } from '../../src/types/notification';

export class NotificationService {
  async createNotification(data: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(data);
    return await notification.save();
  }

  async getNotificationsByUserId(
    userId: string,
    status?: NotificationStatus,
    limit: number = 50
  ): Promise<INotification[]> {
    const query: any = { userId };
    if (status) {
      query.status = status;
    }
    return await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getNotificationById(id: string): Promise<INotification | null> {
    return await Notification.findById(id).exec();
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return await Notification.findByIdAndUpdate(
      id,
      { status: NotificationStatus.READ, readAt: new Date() },
      { new: true }
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    return await Notification.updateMany(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() }
    ).exec();
  }

  async deleteNotification(id: string): Promise<INotification | null> {
    return await Notification.findByIdAndDelete(id).exec();
  }

  async getUserPreferences(userId: string): Promise<INotificationPreference[]> {
    return await NotificationPreference.find({ userId }).exec();
  }

  async upsertPreference(
    userId: string,
    type: NotificationType,
    channels: NotificationChannel[],
    enabled: boolean
  ): Promise<INotificationPreference> {
    return await NotificationPreference.findOneAndUpdate(
      { userId, type },
      { channels, enabled },
      { upsert: true, new: true }
    ).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
      userId,
      status: NotificationStatus.UNREAD,
    }).exec();
  }
}
