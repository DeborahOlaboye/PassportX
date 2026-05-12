import { Notification } from '@/types/notification';

export interface DigestConfig {
  interval: 'hourly' | 'daily' | 'weekly';
  maxNotificationsPerDigest: number;
}

class NotificationDigestService {
  private pendingDigests: Map<string, Notification[]> = new Map();
  private config: DigestConfig = {
    interval: 'daily',
    maxNotificationsPerDigest: 20,
  };

  addToDigest(userId: string, notification: Notification): void {
    if (!this.pendingDigests.has(userId)) {
      this.pendingDigests.set(userId, []);
    }
    const digest = this.pendingDigests.get(userId);
    if (digest) {
      digest.push(notification);
      if (digest.length >= this.config.maxNotificationsPerDigest) {
        this.sendDigest(userId);
      }
    }
  }

  sendDigest(userId: string): void {
    const digest = this.pendingDigests.get(userId);
    if (digest && digest.length > 0) {
      this.pendingDigests.delete(userId);
    }
  }

  getPendingDigest(userId: string): Notification[] {
    return this.pendingDigests.get(userId) || [];
  }

  getDigestCount(userId: string): number {
    return this.pendingDigests.get(userId)?.length || 0;
  }

  setConfig(config: Partial<DigestConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DigestConfig {
    return { ...this.config };
  }

  clearUserDigest(userId: string): void {
    this.pendingDigests.delete(userId);
  }

  clearAll(): void {
    this.pendingDigests.clear();
  }
}

export const notificationDigestService = new NotificationDigestService();
