import { Notification, NotificationType, NotificationChannel } from '@/types/notification';

export interface NotificationAnalyticsData {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  averageDeliveryTime: number;
}

class NotificationAnalytics {
  private analytics: NotificationAnalyticsData = {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    byType: {} as Record<NotificationType, number>,
    byChannel: {} as Record<NotificationChannel, number>,
    averageDeliveryTime: 0,
  };

  recordSent(notification: Notification): void {
    this.analytics.totalSent++;
    this.analytics.byType[notification.type] = (this.analytics.byType[notification.type] || 0) + 1;
    notification.channels.forEach((channel) => {
      this.analytics.byChannel[channel] = (this.analytics.byChannel[channel] || 0) + 1;
    });
  }

  recordDelivered(): void {
    this.analytics.totalDelivered++;
  }

  recordFailed(): void {
    this.analytics.totalFailed++;
  }

  getAnalytics(): NotificationAnalyticsData {
    return { ...this.analytics };
  }

  getDeliveryRate(): number {
    if (this.analytics.totalSent === 0) return 0;
    return (this.analytics.totalDelivered / this.analytics.totalSent) * 100;
  }

  getFailureRate(): number {
    if (this.analytics.totalSent === 0) return 0;
    return (this.analytics.totalFailed / this.analytics.totalSent) * 100;
  }

  reset(): void {
    this.analytics = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      byType: {} as Record<NotificationType, number>,
      byChannel: {} as Record<NotificationChannel, number>,
      averageDeliveryTime: 0,
    };
  }
}

export const notificationAnalytics = new NotificationAnalytics();
