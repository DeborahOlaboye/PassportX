import { NotificationStatus } from '@/types/notification';

export interface CleanupConfig {
  maxAge: number;
  maxCount: number;
  batchSize: number;
}

class NotificationCleanupService {
  private config: CleanupConfig = {
    maxAge: 90 * 24 * 60 * 60 * 1000,
    maxCount: 10000,
    batchSize: 100,
  };

  setConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CleanupConfig {
    return { ...this.config };
  }

  shouldCleanup(notificationAge: number, notificationCount: number): boolean {
    return (
      notificationAge > this.config.maxAge ||
      notificationCount > this.config.maxCount
    );
  }

  getCleanupBatchSize(): number {
    return this.config.batchSize;
  }

  getCleanupCriteria(): { maxAge: number; maxCount: number } {
    return {
      maxAge: this.config.maxAge,
      maxCount: this.config.maxCount,
    };
  }

  getStatusForCleanup(status: NotificationStatus): boolean {
    return (
      status === NotificationStatus.ARCHIVED ||
      status === NotificationStatus.READ
    );
  }
}

export const notificationCleanupService = new NotificationCleanupService();
