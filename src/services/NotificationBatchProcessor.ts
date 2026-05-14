import { Notification } from '@/types/notification';

export interface BatchProcessOptions {
  batchSize: number;
  delayMs: number;
}

class NotificationBatchProcessor {
  private batch: Notification[] = [];
  private options: BatchProcessOptions;

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

  private async processBatch(_notifications: Notification[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
  }

  getBatchSize(): number {
    return this.batch.length;
  }

  clear(): void {
    this.batch = [];
  }
}

export const notificationBatchProcessor = new NotificationBatchProcessor();
