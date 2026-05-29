import { Notification } from '@/types/notification';
import { notificationEncryptionService } from './NotificationEncryptionService';

export interface BatchProcessOptions {
  batchSize: number;
  delayMs: number;
}

class NotificationBatchProcessor {
  private batch: Notification[] = [];
  private options: BatchProcessOptions;
  private processedCount = 0;
  private failedCount = 0;

  constructor(options: BatchProcessOptions = { batchSize: 10, delayMs: 100 }) {
    this.options = options;
  }

  add(notification: Notification): void {
    this.batch.push(notification);
    if (this.batch.length >= this.options.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const notificationsToProcess = [...this.batch];
    this.batch = [];

    await this.processBatch(notificationsToProcess);
  }

  async processBatch(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      try {
        await dispatchNotification(notification);
        this.processedCount++;
      } catch (error) {
        this.failedCount++;
        console.error('[NotificationBatchProcessor] Failed to process notification:', error);
      }
    }
    if (this.options.delayMs > 0 && notifications.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }
  }

  getBatchSize(): number {
    return this.batch.length;
  }

  clear(): void {
    this.batch = [];
  }

  getStats(): { processed: number; failed: number } {
    return { processed: this.processedCount, failed: this.failedCount };
  }
}

async function dispatchNotification(notification: Notification): Promise<void> {
  const payload = {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    timestamp: notification.createdAt || new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  if (typeof window !== 'undefined' && 'Notification' in window) {
    await dispatchBrowserNotification(notification);
  }

  const event = new CustomEvent('notification', {
    detail: { payload, encrypted: notificationEncryptionService.hash(serialized) },
  });
  window.dispatchEvent(event);
}

async function dispatchBrowserNotification(notification: Notification): Promise<void> {
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/logo.png',
    });
  }
}

export const notificationBatchProcessor = new NotificationBatchProcessor();
