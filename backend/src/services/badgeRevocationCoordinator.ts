import { BadgeRevocationEvent } from '../chainhook/types/handlers';
import BadgeRevocationAuditLog from './badgeRevocationAuditLog';
import BadgeRevocationCacheInvalidator from './badgeRevocationCacheInvalidator';
import BadgeRevocationNotificationService from './badgeRevocationNotificationService';
import BadgeCountUpdateService from './badgeCountUpdateService';

export interface RevocationResult {
  success: boolean;
  badgeId: string;
  userId: string;
  revocationType: 'soft' | 'hard';
  auditLogged: boolean;
  cacheInvalidated: boolean;
  notified: boolean;
  countUpdated: boolean;
  timestamp: number;
  error?: string;
}

export class BadgeRevocationCoordinator {
  private auditLog: BadgeRevocationAuditLog;
  private cacheInvalidator: BadgeRevocationCacheInvalidator;
  private notificationService: BadgeRevocationNotificationService;
  private countUpdateService: BadgeCountUpdateService;
  private logger: any;
  private processedCount = 0;
  private errorCount = 0;

  constructor(
    auditLog: BadgeRevocationAuditLog,
    cacheInvalidator: BadgeRevocationCacheInvalidator,
    notificationService: BadgeRevocationNotificationService,
    countUpdateService: BadgeCountUpdateService,
    logger?: any
  ) {
    this.auditLog = auditLog;
    this.cacheInvalidator = cacheInvalidator;
    this.notificationService = notificationService;
    this.countUpdateService = countUpdateService;
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[RevocationCoordinator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[RevocationCoordinator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[RevocationCoordinator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[RevocationCoordinator] ${msg}`, ...args)
    };
  }

  async processBadgeRevocation(event: BadgeRevocationEvent): Promise<RevocationResult> {
    const startTime = Date.now();

    try {
      if (!event.badgeId || !event.userId || !event.transactionHash) {
        throw new Error('Invalid revocation event: missing required fields');
      }

      this.logger.info(`Processing badge revocation`, {
        badgeId: event.badgeId,
        userId: event.userId,
        revocationType: event.revocationType,
        blockHeight: event.blockHeight
      });

      let auditLogged = false;
      let cacheInvalidated = false;
      let notified = false;
      let countUpdated = false;

      try {
        this.auditLog.recordRevocation(event);
        auditLogged = true;
      } catch (error) {
        this.logger.warn('Failed to record audit log', { error });
      }

      try {
        await this.cacheInvalidator.invalidateBadgeCache(
          event.badgeId,
          event.userId,
          event.revocationType
        );
        cacheInvalidated = true;
      } catch (error) {
        this.logger.warn('Failed to invalidate cache', { error });
      }

      try {
        await this.notificationService.notifyBadgeRevocation(event);
        notified = true;
      } catch (error) {
        this.logger.warn('Failed to notify user', { error });
      }

      try {
        await this.countUpdateService.decrementBadgeCount(
          event.userId,
          event.revocationType
        );
        countUpdated = true;
      } catch (error) {
        this.logger.warn('Failed to update badge counts', { error });
      }

      this.processedCount++;

      const result: RevocationResult = {
        success: true,
        badgeId: event.badgeId,
        userId: event.userId,
        revocationType: event.revocationType,
        auditLogged,
        cacheInvalidated,
        notified,
        countUpdated,
        timestamp: Date.now()
      };

      this.logger.info(`Badge revocation processed successfully`, {
        badgeId: event.badgeId,
        userId: event.userId,
        processingTime: Date.now() - startTime
      });

      return result;
    } catch (error) {
      this.errorCount++;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing badge revocation: ${errorMessage}`, {
        badgeId: event.badgeId,
        userId: event.userId,
        error
      });

      return {
        success: false,
        badgeId: event.badgeId,
        userId: event.userId,
        revocationType: event.revocationType,
        auditLogged: false,
        cacheInvalidated: false,
        notified: false,
        countUpdated: false,
        timestamp: Date.now(),
        error: errorMessage
      };
    }
  }

  async processBatchRevocations(events: BadgeRevocationEvent[]): Promise<RevocationResult[]> {
    this.logger.info(`Processing batch of ${events.length} badge revocations`);

    const results: RevocationResult[] = [];

    for (const event of events) {
      const result = await this.processBadgeRevocation(event);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.info(`Batch revocation processing complete: ${successCount}/${events.length} successful`);

    return results;
  }

  getStatistics(): any {
    return {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      successRate: this.processedCount > 0
        ? ((this.processedCount - this.errorCount) / this.processedCount * 100).toFixed(2) + '%'
        : '0%',
      auditLogMetrics: this.auditLog.getMetrics(),
      cacheInvalidatorMetrics: this.cacheInvalidator.getMetrics(),
      notificationMetrics: this.notificationService.getMetrics(),
      countUpdateMetrics: this.countUpdateService.getMetrics()
    };
  }

  getDetailedStatistics(): any {
    return {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      successRate: this.processedCount > 0
        ? ((this.processedCount - this.errorCount) / this.processedCount * 100).toFixed(2) + '%'
        : '0%',
      auditLogStats: this.auditLog.getRevocationStatistics(),
      cacheInvalidatorStats: this.cacheInvalidator.getDetailedMetrics(),
      notificationStats: this.notificationService.getDetailedMetrics(),
      countUpdateStats: this.countUpdateService.getDetailedMetrics()
    };
  }

  resetStatistics(): void {
    this.processedCount = 0;
    this.errorCount = 0;
    this.auditLog.resetMetrics ? this.auditLog.resetMetrics() : null;
    this.cacheInvalidator.resetMetrics();
    this.notificationService.resetMetrics();
    this.countUpdateService.resetMetrics();
    this.logger.info('Revocation coordinator statistics reset');
  }

  async flushPendingOperations(): Promise<void> {
    this.logger.info('Flushing pending revocation operations');

    await this.cacheInvalidator.flush();
    await this.notificationService.flush();

    this.logger.info('All pending revocation operations flushed');
  }

  destroy(): void {
    this.auditLog.destroy();
    this.cacheInvalidator.destroy();
    this.notificationService.destroy();
    this.countUpdateService.destroy();
    this.logger.info('BadgeRevocationCoordinator destroyed');
  }
}

export default BadgeRevocationCoordinator;
