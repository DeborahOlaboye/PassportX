export interface CacheInvalidationEvent {
  badgeId: string;
  changedFields: string[];
  timestamp: number;
  transactionHash: string;
  blockHeight: number;
}

export interface InvalidationMetrics {
  totalInvalidations: number;
  invalidationsByBadge: Map<string, number>;
  lastInvalidationTime: number;
  averageInvalidationTime: number;
}

export class BadgeMetadataCacheInvalidator {
  private invalidatedBadges: Map<string, { timestamp: number; count: number }> = new Map();
  private invalidationTimings: number[] = [];
  private readonly MAX_TIMING_SAMPLES = 1000;
  private metrics: InvalidationMetrics = {
    totalInvalidations: 0,
    invalidationsByBadge: new Map(),
    lastInvalidationTime: 0,
    averageInvalidationTime: 0
  };
  private invalidationCallbacks: ((event: CacheInvalidationEvent) => Promise<void>)[] = [];
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CacheInvalidator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CacheInvalidator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CacheInvalidator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CacheInvalidator] ${msg}`, ...args)
    };
  }

  registerInvalidationCallback(callback: (event: CacheInvalidationEvent) => Promise<void>): void {
    this.invalidationCallbacks.push(callback);
    this.logger.debug(`Invalidation callback registered. Total: ${this.invalidationCallbacks.length}`);
  }

  async invalidateBadgeCache(event: CacheInvalidationEvent): Promise<void> {
    const startTime = performance.now();

    try {
      this.metrics.totalInvalidations++;
      this.metrics.lastInvalidationTime = Date.now();

      const existingEntry = this.invalidatedBadges.get(event.badgeId);
      if (existingEntry) {
        existingEntry.timestamp = Date.now();
        existingEntry.count++;
      } else {
        this.invalidatedBadges.set(event.badgeId, {
          timestamp: Date.now(),
          count: 1
        });
      }

      const countByBadge = this.metrics.invalidationsByBadge.get(event.badgeId) || 0;
      this.metrics.invalidationsByBadge.set(event.badgeId, countByBadge + 1);

      this.logger.info(`Invalidating badge cache: ${event.badgeId}`, {
        changedFields: event.changedFields,
        blockHeight: event.blockHeight
      });

      for (const callback of this.invalidationCallbacks) {
        try {
          await callback(event);
        } catch (error) {
          this.logger.error('Error in invalidation callback:', error);
        }
      }

      const duration = performance.now() - startTime;
      this.recordInvalidationTiming(duration);
    } catch (error) {
      this.logger.error(`Error invalidating cache for badge ${event.badgeId}:`, error);
    }
  }

  async invalidateMultipleBadges(badgeIds: string[], event: Omit<CacheInvalidationEvent, 'badgeId'>): Promise<void> {
    for (const badgeId of badgeIds) {
      await this.invalidateBadgeCache({
        ...event,
        badgeId
      });
    }

    this.logger.info(`Invalidated cache for ${badgeIds.length} badges`);
  }

  isBadgeCacheInvalidated(badgeId: string): boolean {
    return this.invalidatedBadges.has(badgeId);
  }

  getBadgeInvalidationCount(badgeId: string): number {
    return this.metrics.invalidationsByBadge.get(badgeId) || 0;
  }

  private recordInvalidationTiming(time: number): void {
    this.invalidationTimings.push(time);

    if (this.invalidationTimings.length > this.MAX_TIMING_SAMPLES) {
      this.invalidationTimings = this.invalidationTimings.slice(-this.MAX_TIMING_SAMPLES);
    }

    if (this.invalidationTimings.length > 0) {
      const sum = this.invalidationTimings.reduce((a, b) => a + b, 0);
      this.metrics.averageInvalidationTime = sum / this.invalidationTimings.length;
    }
  }

  getMetrics(): any {
    return {
      totalInvalidations: this.metrics.totalInvalidations,
      lastInvalidationTime: this.metrics.lastInvalidationTime,
      averageInvalidationTime: parseFloat(this.metrics.averageInvalidationTime.toFixed(4)),
      invalidatedBadgeCount: this.invalidatedBadges.size,
      topInvalidatedBadges: Array.from(this.metrics.invalidationsByBadge.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([badgeId, count]) => ({ badgeId, count }))
    };
  }

  clearInvalidatedBadges(): void {
    const count = this.invalidatedBadges.size;
    this.invalidatedBadges.clear();
    this.logger.info(`Cleared ${count} invalidated badge entries`);
  }

  resetMetrics(): void {
    this.metrics = {
      totalInvalidations: 0,
      invalidationsByBadge: new Map(),
      lastInvalidationTime: 0,
      averageInvalidationTime: 0
    };
    this.invalidationTimings = [];
    this.logger.info('Cache invalidation metrics reset');
  }

  destroy(): void {
    this.clearInvalidatedBadges();
    this.invalidationCallbacks = [];
    this.logger.info('BadgeMetadataCacheInvalidator destroyed');
  }
}

export default BadgeMetadataCacheInvalidator;
