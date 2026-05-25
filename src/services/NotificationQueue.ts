import { Notification } from '@/types/notification';

export interface QueuedNotification {
  notification: Notification;
  priority: number;
  attempts: number;
}

class NotificationQueue {
  private queue: QueuedNotification[] = [];
  private processing: boolean = false;

  enqueue(notification: Notification, priority: number = 0): void {
    const queued: QueuedNotification = {
      notification,
      priority,
      attempts: 0,
    };

    this.queue.push(queued);
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): QueuedNotification | null {
    return this.queue.shift() || null;
  }

  peek(): QueuedNotification | null {
    return this.queue[0] || null;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }

  async process(
    handler: (notification: Notification) => Promise<void>
  ): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (!this.isEmpty()) {
      const queued = this.dequeue();
      if (queued) {
        try {
          await handler(queued.notification);
        } catch (error) {
          queued.attempts++;
          if (queued.attempts < 3) {
            this.queue.push(queued);
          }
        }
      }
    }

    this.processing = false;
  }
}

export const notificationQueue = new NotificationQueue();
