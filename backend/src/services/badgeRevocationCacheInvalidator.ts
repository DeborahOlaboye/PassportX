import { EventEmitter } from 'events';

export interface RevocationInvalidation {
  badgeId: string;
  userId: string;
  timestamp: number;
  revocationType: 'soft' | 'hard';
}

export interface InvalidationMetrics {
  totalInvalidations: number;
  softRevokeInvalidations: number;
  hardRevokeInvalidations: number;
  uniqueBadgesInvalidated: number;
  uniqueUsersAffected: number;
  averageInvalidationTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export class BadgeRevocationCacheInvalidator extends EventEmitter {
  private invalidatedBadges: Map<string, RevocationInvalidation> = new Map();
  private userBadgeCache: Map<string, Set<string>> = new Map();
  private invalidationCallbacks: ((invalidation: RevocationInvalidation) => Promise<void>)[] = [];
  private logger: any;
  private metrics: InvalidationMetrics = {
    totalInvalidations: 0,
    softRevokeInvalidations: 0,
    hardRevokeInvalidations: 0,
    uniqueBadgesInvalidated: 0,
    uniqueUsersAffected: 0,
    averageInvalidationTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private invalidationTimes: number[] = [];
  private invalidationBatch: RevocationInvalidation[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT = 1000;

  constructor(logger?: any) {
    super();
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[RevocationCacheInvalidator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[RevocationCacheInvalidator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[RevocationCacheInvalidator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[RevocationCacheInvalidator] ${msg}`, ...args)
    };
  }

  registerInvalidationCallback(callback: (invalidation: RevocationInvalidation) => Promise<void>): void {
    this.invalidationCallbacks.push(callback);
    this.logger.debug('Invalidation callback registered');
  }

  async invalidateBadgeCache(badgeId: string, userId: string, revocationType: 'soft' | 'hard'): Promise<void> {
    const startTime = Date.now();

    try {
      const invalidation: RevocationInvalidation = {
        badgeId,
        userId,
        timestamp: Date.now(),
        revocationType
      };

      this.invalidationBatch.push(invalidation);

      if (this.invalidationBatch.length >= this.BATCH_SIZE) {
        await this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT);
      }

      const processingTime = Date.now() - startTime;
      this.invalidationTimes.push(processingTime);

      this.metrics.totalInvalidations++;
      if (revocationType === 'soft') {
        this.metrics.softRevokeInvalidations++;
      } else {
        this.metrics.hardRevokeInvalidations++;
      }

      this.updateAverageInvalidationTime();
      this.logger.debug('Badge cache invalidation queued', { badgeId, userId, revocationType });
    } catch (error) {
      this.logger.error('Error invalidating badge cache', { error });
      throw error;
    }
  }

  async invalidateBatchBadges(
    invalidations: Array<{ badgeId: string; userId: string; revocationType: 'soft' | 'hard' }>
  ): Promise<void> {
    try {
      for (const inv of invalidations) {
        await this.invalidateBadgeCache(inv.badgeId, inv.userId, inv.revocationType);
      }
      this.logger.info(`Batch invalidation queued for ${invalidations.length} badges`);
    } catch (error) {
      this.logger.error('Error in batch invalidation', { error });
      throw error;
    }
  }

  async invalidateUserBadgeCache(userId: string, revocationType: 'soft' | 'hard'): Promise<void> {
    try {
      const userBadges = this.userBadgeCache.get(userId) || new Set();

      for (const badgeId of userBadges) {
        await this.invalidateBadgeCache(badgeId, userId, revocationType);
      }

      this.logger.info(`Invalidated all badges for user ${userId}`, { count: userBadges.size });
    } catch (error) {
      this.logger.error('Error invalidating user badge cache', { error });
      throw error;
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.invalidationBatch.length === 0) {
      return;
    }

    const batch = this.invalidationBatch.splice(0, this.BATCH_SIZE);

    try {
      for (const invalidation of batch) {
        const cacheKey = `${invalidation.userId}:${invalidation.badgeId}`;
        this.invalidatedBadges.set(cacheKey, invalidation);

        const userBadges = this.userBadgeCache.get(invalidation.userId) || new Set();
        userBadges.delete(invalidation.badgeId);
        this.userBadgeCache.set(invalidation.userId, userBadges);

        this.emit('invalidation', invalidation);

        for (const callback of this.invalidationCallbacks) {
          try {
            await callback(invalidation);
          } catch (error) {
            this.logger.error('Error in invalidation callback', { error, badgeId: invalidation.badgeId });
          }
        }
      }

      this.metrics.uniqueBadgesInvalidated = this.invalidatedBadges.size;
      this.metrics.uniqueUsersAffected = this.userBadgeCache.size;

      this.logger.debug(`Processed batch of ${batch.length} invalidations`);
    } catch (error) {
      this.logger.error('Error processing invalidation batch', { error });
    }

    if (this.invalidationBatch.length > 0) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT);
    }
  }

  isBadgeInvalidated(userId: string, badgeId: string): boolean {
    const cacheKey = `${userId}:${badgeId}`;
    const isInvalidated = this.invalidatedBadges.has(cacheKey);

    if (isInvalidated) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    return isInvalidated;
  }

  markBadgeActive(userId: string, badgeId: string): void {
    const cacheKey = `${userId}:${badgeId}`;
    this.invalidatedBadges.delete(cacheKey);

    const userBadges = this.userBadgeCache.get(userId) || new Set();
    userBadges.add(badgeId);
    this.userBadgeCache.set(userId, userBadges);

    this.logger.debug('Badge marked as active', { userId, badgeId });
  }

  getInvalidatedBadgesForUser(userId: string): string[] {
    const invalidations: string[] = [];

    for (const [cacheKey, invalidation] of this.invalidatedBadges.entries()) {
      if (invalidation.userId === userId) {
        invalidations.push(invalidation.badgeId);
      }
    }

    return invalidations;
  }

  private updateAverageInvalidationTime(): void {
    if (this.invalidationTimes.length > 0) {
      const sum = this.invalidationTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageInvalidationTime = sum / this.invalidationTimes.length;

      if (this.invalidationTimes.length > 1000) {
        this.invalidationTimes = this.invalidationTimes.slice(-1000);
      }
    }
  }

  getMetrics(): InvalidationMetrics {
    return {
      ...this.metrics,
      uniqueBadgesInvalidated: this.invalidatedBadges.size,
      uniqueUsersAffected: this.userBadgeCache.size
    };
  }

  getDetailedMetrics() {
    const hitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2) + '%'
      : '0%';

    return {
      ...this.getMetrics(),
      hitRate,
      cacheHitMissRatio: `${this.metrics.cacheHits}:${this.metrics.cacheMisses}`,
      pendingInvalidations: this.invalidationBatch.length
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalInvalidations: 0,
      softRevokeInvalidations: 0,
      hardRevokeInvalidations: 0,
      uniqueBadgesInvalidated: 0,
      uniqueUsersAffected: 0,
      averageInvalidationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.invalidationTimes = [];
    this.logger.info('Invalidation metrics reset');
  }

  async flush(): Promise<void> {
    if (this.invalidationBatch.length > 0) {
      await this.processBatch();
    }
    this.logger.info('All pending invalidations flushed');
  }

  destroy(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.invalidatedBadges.clear();
    this.userBadgeCache.clear();
    this.invalidationCallbacks = [];
    this.removeAllListeners();
    this.logger.info('BadgeRevocationCacheInvalidator destroyed');
  }
}

export default BadgeRevocationCacheInvalidator;
