import { BadgeCacheService } from './badgeCacheService';
import { CommunityCacheService } from './communityCacheService';
import { ChainhookEventCache } from './chainhookEventCache';
import { BadgeMetadataCacheInvalidator } from './badgeMetadataCacheInvalidator';
import { BadgeRevocationCacheInvalidator } from './badgeRevocationCacheInvalidator';

export interface CacheInvalidationRule {
  eventType: string;
  cacheKeys: string[];
  patterns?: string[];
  priority: 'high' | 'medium' | 'low';
  warmCache?: boolean;
  description: string;
}

export interface CacheInvalidationMetrics {
  totalInvalidations: number;
  invalidationsByEventType: Map<string, number>;
  averageInvalidationTime: number;
  cacheHitRate: number;
  lastInvalidationTime: number;
  failedInvalidations: number;
}

export interface CacheWarmupData {
  key: string;
  data: any;
  ttl: number;
}

export class EventDrivenCacheInvalidator {
  private badgeCache: BadgeCacheService;
  private communityCache: CommunityCacheService;
  private eventCache: ChainhookEventCache;
  private metadataInvalidator: BadgeMetadataCacheInvalidator;
  private revocationInvalidator: BadgeRevocationCacheInvalidator;

  private invalidationRules: Map<string, CacheInvalidationRule> = new Map();
  private metrics: CacheInvalidationMetrics = {
    totalInvalidations: 0,
    invalidationsByEventType: new Map(),
    averageInvalidationTime: 0,
    cacheHitRate: 0,
    lastInvalidationTime: 0,
    failedInvalidations: 0
  };

  private invalidationTimings: number[] = [];
  private readonly MAX_TIMING_SAMPLES = 1000;
  private logger: any;
  private warmupQueue: CacheWarmupData[] = [];
  private isWarmingUp = false;

  constructor(
    badgeCache: BadgeCacheService,
    communityCache: CommunityCacheService,
    eventCache: ChainhookEventCache,
    metadataInvalidator: BadgeMetadataCacheInvalidator,
    revocationInvalidator: BadgeRevocationCacheInvalidator,
    logger?: any
  ) {
    this.badgeCache = badgeCache;
    this.communityCache = communityCache;
    this.eventCache = eventCache;
    this.metadataInvalidator = metadataInvalidator;
    this.revocationInvalidator = revocationInvalidator;
    this.logger = logger || this.getDefaultLogger();

    this.initializeInvalidationRules();
    this.startWarmupProcessor();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[EventDrivenCacheInvalidator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[EventDrivenCacheInvalidator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[EventDrivenCacheInvalidator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[EventDrivenCacheInvalidator] ${msg}`, ...args)
    };
  }

  private initializeInvalidationRules(): void {
    // Badge minting events
    this.invalidationRules.set('badge-mint', {
      eventType: 'badge-mint',
      cacheKeys: [
        'badges:list:all',
        'badges:recent',
        'badges:count',
        'badges:search:*',
        'badges:category:*'
      ],
      patterns: [
        '^badges:user:.*:list$',
        '^badges:user:.*:count$',
        '^passport:.*$',
        '^badge:.*$'
      ],
      priority: 'high',
      warmCache: true,
      description: 'Invalidates user badge lists, counts, and general badge caches when badges are minted'
    });

    // Badge metadata update events
    this.invalidationRules.set('badge-metadata-update', {
      eventType: 'badge-metadata-update',
      cacheKeys: [
        'badges:list:all',
        'badges:search:*'
      ],
      patterns: [
        '^badge:.*$',
        '^badges:category:.*$'
      ],
      priority: 'medium',
      warmCache: false,
      description: 'Invalidates specific badge caches and search results when badge metadata is updated'
    });

    // Badge revocation events
    this.invalidationRules.set('badge-revocation', {
      eventType: 'badge-revocation',
      cacheKeys: [
        'badges:list:all',
        'badges:recent',
        'badges:count'
      ],
      patterns: [
        '^badges:user:.*:list$',
        '^badges:user:.*:count$',
        '^passport:.*$',
        '^badge:.*$'
      ],
      priority: 'high',
      warmCache: true,
      description: 'Invalidates user badge lists and passport data when badges are revoked'
    });

    // Community creation events
    this.invalidationRules.set('community-creation', {
      eventType: 'community-creation',
      cacheKeys: [
        'communities:list:all',
        'communities:count',
        'communities:search:*',
        'communities:tag:*'
      ],
      patterns: [
        '^communities:admin:.*:count$',
        '^community:.*$',
        '^community:slug:.*$'
      ],
      priority: 'medium',
      warmCache: true,
      description: 'Invalidates community lists and search caches when new communities are created'
    });

    this.logger.info(`Initialized ${this.invalidationRules.size} cache invalidation rules`);
  }

  async invalidateCacheForEvent(eventType: string, eventData: any): Promise<void> {
    const startTime = performance.now();

    try {
      const rule = this.invalidationRules.get(eventType);
      if (!rule) {
        this.logger.debug(`No invalidation rule found for event type: ${eventType}`);
        return;
      }

      this.logger.info(`Invalidating cache for ${eventType} event`, {
        priority: rule.priority,
        cacheKeys: rule.cacheKeys.length,
        patterns: rule.patterns?.length || 0
      });

      // Execute invalidation based on event type
      await this.executeInvalidation(eventType, eventData, rule);

      // Update metrics
      this.updateMetrics(eventType, performance.now() - startTime);

      // Queue cache warming if enabled
      if (rule.warmCache) {
        this.queueCacheWarmup(eventType, eventData);
      }

    } catch (error) {
      this.metrics.failedInvalidations++;
      this.logger.error(`Failed to invalidate cache for ${eventType}:`, error);
    }
  }

  private async executeInvalidation(eventType: string, eventData: any, rule: CacheInvalidationRule): Promise<void> {
    switch (eventType) {
      case 'badge-mint':
        await this.invalidateBadgeMint(eventData);
        break;
      case 'badge-metadata-update':
        await this.invalidateBadgeMetadataUpdate(eventData);
        break;
      case 'badge-revocation':
        await this.invalidateBadgeRevocation(eventData);
        break;
      case 'community-creation':
        await this.invalidateCommunityCreation(eventData);
        break;
      default:
        this.logger.warn(`Unknown event type for invalidation: ${eventType}`);
    }

    // Invalidate specific cache keys
    for (const key of rule.cacheKeys) {
      this.invalidateCacheKey(key);
    }

    // Invalidate pattern-based keys
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        this.invalidateCachePattern(pattern);
      }
    }
  }

  private async invalidateBadgeMint(eventData: any): Promise<void> {
    if (eventData.userId && eventData.badgeId) {
      this.badgeCache.onBadgeMinted(eventData);
    }
  }

  private async invalidateBadgeMetadataUpdate(eventData: any): Promise<void> {
    if (eventData.badgeId) {
      await this.metadataInvalidator.invalidateBadgeCache({
        badgeId: eventData.badgeId,
        changedFields: eventData.changedFields || [],
        timestamp: eventData.timestamp || Date.now(),
        transactionHash: eventData.transactionHash || '',
        blockHeight: eventData.blockHeight || 0
      });
    }
  }

  private async invalidateBadgeRevocation(eventData: any): Promise<void> {
    if (eventData.badgeId && eventData.userId) {
      await this.revocationInvalidator.invalidateBadgeCache(
        eventData.badgeId,
        eventData.userId,
        eventData.revocationType || 'soft'
      );
    }
  }

  private async invalidateCommunityCreation(eventData: any): Promise<void> {
    if (eventData.communityId) {
      this.communityCache.onCommunityCreated(eventData);
    }
  }

  private invalidateCacheKey(key: string): void {
    // Invalidate from all cache services
    this.badgeCache.invalidate(key);
    this.communityCache.invalidate(key);
    this.eventCache.delete({ block_identifier: { index: 0 }, transactions: [{ transaction_hash: key }] });
  }

  private invalidateCachePattern(pattern: string): void {
    // Invalidate patterns from all cache services
    this.badgeCache.invalidatePattern(pattern);
    this.communityCache.invalidatePattern(pattern);
  }

  private updateMetrics(eventType: string, duration: number): void {
    this.metrics.totalInvalidations++;
    this.metrics.lastInvalidationTime = Date.now();

    const count = this.metrics.invalidationsByEventType.get(eventType) || 0;
    this.metrics.invalidationsByEventType.set(eventType, count + 1);

    this.recordInvalidationTiming(duration);

    // Update cache hit rate from event cache
    const eventCacheMetrics = this.eventCache.getMetrics();
    this.metrics.cacheHitRate = eventCacheMetrics.hitRate;
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

  private queueCacheWarmup(eventType: string, eventData: any): void {
    // Queue cache warming tasks based on event type
    switch (eventType) {
      case 'badge-mint':
        this.warmupQueue.push({
          key: `badges:user:${eventData.userId}:count`,
          data: null, // Will be fetched by the warmup processor
          ttl: 300
        });
        break;
      case 'badge-revocation':
        this.warmupQueue.push({
          key: `badges:user:${eventData.userId}:list`,
          data: null,
          ttl: 300
        });
        break;
      case 'community-creation':
        this.warmupQueue.push({
          key: 'communities:count',
          data: null,
          ttl: 300
        });
        break;
    }
  }

  private startWarmupProcessor(): void {
    setInterval(() => {
      if (!this.isWarmingUp && this.warmupQueue.length > 0) {
        this.processWarmupQueue();
      }
    }, 5000); // Process warmup queue every 5 seconds
  }

  private async processWarmupQueue(): Promise<void> {
    if (this.isWarmingUp || this.warmupQueue.length === 0) {
      return;
    }

    this.isWarmingUp = true;

    try {
      const warmupItem = this.warmupQueue.shift();
      if (!warmupItem) return;

      // Here we would typically fetch fresh data and warm the cache
      // For now, we'll just log the warmup attempt
      this.logger.debug(`Warming cache for key: ${warmupItem.key}`);

      // In a real implementation, you would:
      // 1. Fetch fresh data from the database/API
      // 2. Set it in the appropriate cache service
      // 3. Log the warmup completion

    } catch (error) {
      this.logger.error('Error during cache warmup:', error);
    } finally {
      this.isWarmingUp = false;
    }
  }

  getMetrics(): CacheInvalidationMetrics {
    return {
      ...this.metrics,
      averageInvalidationTime: parseFloat(this.metrics.averageInvalidationTime.toFixed(4)),
      cacheHitRate: parseFloat(this.metrics.cacheHitRate.toFixed(2))
    };
  }

  getInvalidationRules(): CacheInvalidationRule[] {
    return Array.from(this.invalidationRules.values());
  }

  addInvalidationRule(rule: CacheInvalidationRule): void {
    this.invalidationRules.set(rule.eventType, rule);
    this.logger.info(`Added invalidation rule for ${rule.eventType}`);
  }

  removeInvalidationRule(eventType: string): boolean {
    const removed = this.invalidationRules.delete(eventType);
    if (removed) {
      this.logger.info(`Removed invalidation rule for ${eventType}`);
    }
    return removed;
  }

  clearMetrics(): void {
    this.metrics = {
      totalInvalidations: 0,
      invalidationsByEventType: new Map(),
      averageInvalidationTime: 0,
      cacheHitRate: 0,
      lastInvalidationTime: 0,
      failedInvalidations: 0
    };
    this.invalidationTimings = [];
    this.logger.info('Cache invalidation metrics cleared');
  }
}

export default EventDrivenCacheInvalidator;
