import { EventEmitter } from 'events';
import { BadgeRevocationEvent } from '../chainhook/types/handlers';

export interface RevocationNotification {
  userId: string;
  badgeId: string;
  badgeName: string;
  revocationType: 'soft' | 'hard';
  reason?: string;
  notificationSent: boolean;
  notificationMethod: 'email' | 'in-app' | 'webhook' | 'push' | 'all';
  sentAt?: number;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  retryCount: number;
}

export interface NotificationMetrics {
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  softRevokeNotifications: number;
  hardRevokeNotifications: number;
  notificationsByMethod: Map<string, number>;
  userNotificationCounts: Map<string, number>;
  averageNotificationDelay: number;
}

export class BadgeRevocationNotificationService extends EventEmitter {
  private notificationQueue: RevocationNotification[] = [];
  private notificationHistory: RevocationNotification[] = [];
  private logger: any;
  private metrics: NotificationMetrics = {
    totalNotifications: 0,
    sentNotifications: 0,
    failedNotifications: 0,
    pendingNotifications: 0,
    softRevokeNotifications: 0,
    hardRevokeNotifications: 0,
    notificationsByMethod: new Map(),
    userNotificationCounts: new Map(),
    averageNotificationDelay: 0
  };
  private notificationDelays: number[] = [];
  private notificationCallbacks: Map<string, (notification: RevocationNotification) => Promise<void>> = new Map();
  private processingTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly BATCH_TIMEOUT = 500;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;

  constructor(logger?: any) {
    super();
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[RevocationNotificationService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[RevocationNotificationService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[RevocationNotificationService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[RevocationNotificationService] ${msg}`, ...args)
    };
  }

  registerNotificationHandler(method: 'email' | 'in-app' | 'webhook' | 'push', handler: (notification: RevocationNotification) => Promise<void>): void {
    this.notificationCallbacks.set(method, handler);
    this.logger.info(`Notification handler registered for ${method}`);
  }

  async notifyBadgeRevocation(
    event: BadgeRevocationEvent,
    notificationMethod: 'email' | 'in-app' | 'webhook' | 'push' | 'all' = 'all'
  ): Promise<RevocationNotification> {
    const notification: RevocationNotification = {
      userId: event.userId,
      badgeId: event.badgeId,
      badgeName: event.badgeName,
      revocationType: event.revocationType,
      reason: event.reason,
      notificationSent: false,
      notificationMethod,
      deliveryStatus: 'pending',
      retryCount: 0
    };

    this.notificationQueue.push(notification);
    this.metrics.totalNotifications++;
    this.metrics.pendingNotifications++;

    if (event.revocationType === 'soft') {
      this.metrics.softRevokeNotifications++;
    } else {
      this.metrics.hardRevokeNotifications++;
    }

    this.updateUserNotificationCount(event.userId);

    this.logger.debug('Revocation notification queued', {
      userId: event.userId,
      badgeId: event.badgeId,
      method: notificationMethod
    });

    if (this.notificationQueue.length >= this.BATCH_SIZE) {
      await this.processBatch();
    } else if (!this.processingTimer) {
      this.processingTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT);
    }

    return notification;
  }

  async notifyBatchRevocations(
    events: BadgeRevocationEvent[],
    notificationMethod: 'email' | 'in-app' | 'webhook' | 'push' | 'all' = 'all'
  ): Promise<RevocationNotification[]> {
    const notifications: RevocationNotification[] = [];

    for (const event of events) {
      const notification = await this.notifyBadgeRevocation(event, notificationMethod);
      notifications.push(notification);
    }

    this.logger.info(`Batch revocation notifications queued for ${events.length} events`);
    return notifications;
  }

  private async processBatch(): Promise<void> {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }

    if (this.notificationQueue.length === 0) {
      return;
    }

    const batch = this.notificationQueue.splice(0, this.BATCH_SIZE);
    const startTime = Date.now();

    try {
      const results = await Promise.allSettled(
        batch.map(notification => this.sendNotification(notification))
      );

      results.forEach((result, index) => {
        const notification = batch[index];
        if (result.status === 'fulfilled') {
          notification.notificationSent = true;
          notification.deliveryStatus = 'sent';
          notification.sentAt = Date.now();
          this.metrics.sentNotifications++;
          this.metrics.pendingNotifications--;
          this.emit('notification-sent', notification);
        } else {
          this.handleNotificationFailure(notification, result.reason);
        }
      });

      const processingTime = Date.now() - startTime;
      this.notificationDelays.push(processingTime);
      this.updateAverageDelay();

      this.logger.debug(`Processed batch of ${batch.length} notifications`, {
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        time: processingTime
      });
    } catch (error) {
      this.logger.error('Error processing notification batch', { error });
    }

    if (this.notificationQueue.length > 0) {
      this.processingTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT);
    }
  }

  private async sendNotification(notification: RevocationNotification): Promise<void> {
    try {
      if (notification.notificationMethod === 'all') {
        const handlers = Array.from(this.notificationCallbacks.values());
        await Promise.all(handlers.map(h => h(notification)));
      } else {
        const handler = this.notificationCallbacks.get(notification.notificationMethod);
        if (handler) {
          await handler(notification);
        }
      }

      const methodCount = this.metrics.notificationsByMethod.get(notification.notificationMethod) || 0;
      this.metrics.notificationsByMethod.set(notification.notificationMethod, methodCount + 1);

      this.logger.debug('Notification sent successfully', {
        userId: notification.userId,
        badgeId: notification.badgeId,
        method: notification.notificationMethod
      });
    } catch (error) {
      throw error;
    }
  }

  private handleNotificationFailure(notification: RevocationNotification, error: any): void {
    notification.retryCount++;

    if (notification.retryCount < this.MAX_RETRIES) {
      notification.deliveryStatus = 'pending';
      this.notificationQueue.push(notification);
      this.logger.warn(`Notification retry queued (attempt ${notification.retryCount}/${this.MAX_RETRIES})`, {
        userId: notification.userId,
        badgeId: notification.badgeId
      });
    } else {
      notification.deliveryStatus = 'failed';
      this.metrics.failedNotifications++;
      this.metrics.pendingNotifications--;
      this.logger.error(`Notification failed after ${this.MAX_RETRIES} retries`, {
        userId: notification.userId,
        badgeId: notification.badgeId,
        error
      });
      this.emit('notification-failed', notification);
    }

    this.notificationHistory.push(notification);
  }

  private updateUserNotificationCount(userId: string): void {
    const count = this.metrics.userNotificationCounts.get(userId) || 0;
    this.metrics.userNotificationCounts.set(userId, count + 1);
  }

  private updateAverageDelay(): void {
    if (this.notificationDelays.length > 0) {
      const sum = this.notificationDelays.reduce((a, b) => a + b, 0);
      this.metrics.averageNotificationDelay = sum / this.notificationDelays.length;

      if (this.notificationDelays.length > 1000) {
        this.notificationDelays = this.notificationDelays.slice(-1000);
      }
    }
  }

  getUserNotificationHistory(userId: string, limit: number = 100): RevocationNotification[] {
    return this.notificationHistory
      .filter(n => n.userId === userId)
      .slice(-limit);
  }

  getNotificationsByMethod(method: string, limit: number = 100): RevocationNotification[] {
    return this.notificationHistory
      .filter(n => n.notificationMethod === method || n.notificationMethod === 'all')
      .slice(-limit);
  }

  getFailedNotifications(): RevocationNotification[] {
    return this.notificationHistory.filter(n => n.deliveryStatus === 'failed');
  }

  getPendingNotifications(): RevocationNotification[] {
    return this.notificationQueue.filter(n => n.deliveryStatus === 'pending');
  }

  getMetrics(): NotificationMetrics {
    return {
      ...this.metrics,
      pendingNotifications: this.notificationQueue.length,
      notificationsByMethod: new Map(this.metrics.notificationsByMethod),
      userNotificationCounts: new Map(this.metrics.userNotificationCounts)
    };
  }

  getDetailedMetrics() {
    const successRate = this.metrics.totalNotifications > 0
      ? ((this.metrics.sentNotifications / this.metrics.totalNotifications) * 100).toFixed(2) + '%'
      : '0%';

    return {
      ...this.getMetrics(),
      successRate,
      failureRate: this.metrics.totalNotifications > 0
        ? ((this.metrics.failedNotifications / this.metrics.totalNotifications) * 100).toFixed(2) + '%'
        : '0%',
      mostNotifiedUser: this.getMostNotifiedUser()
    };
  }

  private getMostNotifiedUser(): { userId: string; count: number } | null {
    let maxUser: string | null = null;
    let maxCount = 0;

    for (const [userId, count] of this.metrics.userNotificationCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxUser = userId;
      }
    }

    return maxUser ? { userId: maxUser, count: maxCount } : null;
  }

  resetMetrics(): void {
    this.metrics = {
      totalNotifications: 0,
      sentNotifications: 0,
      failedNotifications: 0,
      pendingNotifications: 0,
      softRevokeNotifications: 0,
      hardRevokeNotifications: 0,
      notificationsByMethod: new Map(),
      userNotificationCounts: new Map(),
      averageNotificationDelay: 0
    };
    this.notificationDelays = [];
    this.logger.info('Notification metrics reset');
  }

  async flush(): Promise<void> {
    if (this.notificationQueue.length > 0) {
      await this.processBatch();
    }
    this.logger.info('All pending notifications flushed');
  }

  destroy(): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }
    this.notificationQueue = [];
    this.notificationHistory = [];
    this.notificationCallbacks.clear();
    this.removeAllListeners();
    this.logger.info('BadgeRevocationNotificationService destroyed');
  }
}

export default BadgeRevocationNotificationService;
