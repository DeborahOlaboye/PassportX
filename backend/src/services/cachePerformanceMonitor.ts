import { EventDrivenCacheInvalidator } from './eventDrivenCacheInvalidator';
import { BadgeCacheService } from './badgeCacheService';
import { CommunityCacheService } from './communityCacheService';
import { ChainhookEventCache } from './chainhookEventCache';

export interface CachePerformanceMetrics {
  overallHitRate: number;
  badgeCacheHitRate: number;
  communityCacheHitRate: number;
  eventCacheHitRate: number;
  averageInvalidationTime: number;
  totalInvalidations: number;
  cacheSize: {
    badge: number;
    community: number;
    event: number;
  };
  invalidationsByEventType: Record<string, number>;
  topInvalidatedKeys: Array<{ key: string; count: number }>;
  cacheEfficiency: number;
  recommendations: string[];
}

export interface CacheHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  lastChecked: number;
}

export class CachePerformanceMonitor {
  private invalidator: EventDrivenCacheInvalidator;
  private badgeCache: BadgeCacheService;
  private communityCache: CommunityCacheService;
  private eventCache: ChainhookEventCache;

  private keyInvalidationCounts: Map<string, number> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private logger: any;
  private readonly MONITORING_INTERVAL_MS = 60000; // 1 minute
  private readonly HEALTH_CHECK_INTERVAL_MS = 300000; // 5 minutes

  constructor(
    invalidator: EventDrivenCacheInvalidator,
    badgeCache: BadgeCacheService,
    communityCache: CommunityCacheService,
    eventCache: ChainhookEventCache,
    logger?: any
  ) {
    this.invalidator = invalidator;
    this.badgeCache = badgeCache;
    this.communityCache = communityCache;
    this.eventCache = eventCache;
    this.logger = logger || this.getDefaultLogger();

    this.startMonitoring();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CachePerformanceMonitor] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CachePerformanceMonitor] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CachePerformanceMonitor] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CachePerformanceMonitor] ${msg}`, ...args)
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL_MS);

    this.logger.info('Cache performance monitoring started');
  }

  getPerformanceMetrics(): CachePerformanceMetrics {
    const invalidatorMetrics = this.invalidator.getMetrics();
    const eventCacheMetrics = this.eventCache.getMetrics();

    // Calculate badge cache hit rate (would need to be implemented in BadgeCacheService)
    const badgeCacheStats = this.badgeCache.getStats();
    const communityCacheStats = this.communityCache.getStats();

    // Estimate hit rates based on available data
    const badgeCacheHitRate = this.estimateHitRate(badgeCacheStats);
    const communityCacheHitRate = this.estimateHitRate(communityCacheStats);

    const overallHitRate = (
      badgeCacheHitRate * 0.4 +
      communityCacheHitRate * 0.3 +
      eventCacheMetrics.hitRate * 0.3
    );

    const topInvalidatedKeys = Array.from(this.keyInvalidationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    const cacheEfficiency = this.calculateCacheEfficiency(overallHitRate, invalidatorMetrics);

    const recommendations = this.generateRecommendations({
      overallHitRate,
      invalidationTime: invalidatorMetrics.averageInvalidationTime,
      totalInvalidations: invalidatorMetrics.totalInvalidations,
      cacheEfficiency,
      topInvalidatedKeys
    });

    return {
      overallHitRate: parseFloat(overallHitRate.toFixed(2)),
      badgeCacheHitRate: parseFloat(badgeCacheHitRate.toFixed(2)),
      communityCacheHitRate: parseFloat(communityCacheHitRate.toFixed(2)),
      eventCacheHitRate: eventCacheMetrics.hitRate,
      averageInvalidationTime: invalidatorMetrics.averageInvalidationTime,
      totalInvalidations: invalidatorMetrics.totalInvalidations,
      cacheSize: {
        badge: badgeCacheStats.size,
        community: communityCacheStats.size,
        event: this.eventCache.getSize()
      },
      invalidationsByEventType: Object.fromEntries(invalidatorMetrics.invalidationsByEventType),
      topInvalidatedKeys,
      cacheEfficiency: parseFloat(cacheEfficiency.toFixed(2)),
      recommendations
    };
  }

  private estimateHitRate(cacheStats: any): number {
    // This is a simplified estimation. In a real implementation,
    // cache services would track hits and misses directly.
    const size = cacheStats.size || 0;
    const maxSize = cacheStats.maxSize || 1000;

    // Higher utilization suggests better hit rate
    const utilizationRate = size / maxSize;

    // Assume hit rate is correlated with utilization but with diminishing returns
    return Math.min(utilizationRate * 0.8 + 0.2, 0.95);
  }

  private calculateCacheEfficiency(overallHitRate: number, invalidatorMetrics: any): number {
    // Cache efficiency considers both hit rate and invalidation overhead
    const invalidationOverhead = Math.min(invalidatorMetrics.averageInvalidationTime / 100, 1); // Cap at 100ms
    const efficiency = overallHitRate * (1 - invalidationOverhead * 0.1); // 10% penalty per 100ms

    return Math.max(0, Math.min(1, efficiency));
  }

  private generateRecommendations(metrics: {
    overallHitRate: number;
    invalidationTime: number;
    totalInvalidations: number;
    cacheEfficiency: number;
    topInvalidatedKeys: Array<{ key: string; count: number }>;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.overallHitRate < 0.8) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
      recommendations.push('Implement cache warming for high-traffic keys');
    }

    if (metrics.invalidationTime > 50) {
      recommendations.push('Optimize cache invalidation patterns to reduce processing time');
      recommendations.push('Consider batching multiple invalidations');
    }

    if (metrics.cacheEfficiency < 0.7) {
      recommendations.push('Review cache invalidation frequency - too many invalidations may reduce efficiency');
      recommendations.push('Implement selective invalidation instead of broad patterns');
    }

    if (metrics.topInvalidatedKeys.length > 0) {
      const topKey = metrics.topInvalidatedKeys[0];
      if (topKey.count > metrics.totalInvalidations * 0.3) {
        recommendations.push(`Key "${topKey.key}" is invalidated frequently - consider optimizing related operations`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache performance is optimal - continue monitoring');
    }

    return recommendations;
  }

  getHealthStatus(): CacheHealthStatus {
    const metrics = this.getPerformanceMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check hit rate
    if (metrics.overallHitRate < 0.7) {
      issues.push('Low cache hit rate detected');
      recommendations.push('Increase cache sizes or TTL values');
    }

    // Check invalidation performance
    if (metrics.averageInvalidationTime > 100) {
      issues.push('Slow cache invalidation detected');
      recommendations.push('Optimize invalidation patterns and reduce pattern matching');
    }

    // Check cache sizes
    const totalCacheSize = metrics.cacheSize.badge + metrics.cacheSize.community + metrics.cacheSize.event;
    if (totalCacheSize > 10000) {
      issues.push('High memory usage by caches');
      recommendations.push('Consider implementing cache size limits or LRU eviction');
    }

    // Check invalidation frequency
    if (metrics.totalInvalidations > 1000) {
      issues.push('High frequency of cache invalidations');
      recommendations.push('Review event processing to reduce unnecessary invalidations');
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (issues.length >= 3) {
      status = 'critical';
    } else if (issues.length >= 1) {
      status = 'warning';
    }

    return {
      status,
      issues,
      recommendations: [...recommendations, ...metrics.recommendations],
      lastChecked: Date.now()
    };
  }

  private performHealthCheck(): void {
    const healthStatus = this.getHealthStatus();

    if (healthStatus.status === 'critical') {
      this.logger.error('Critical cache health issues detected:', healthStatus.issues);
    } else if (healthStatus.status === 'warning') {
      this.logger.warn('Cache health warnings:', healthStatus.issues);
    } else {
      this.logger.debug('Cache health check passed');
    }

    // Log recommendations
    if (healthStatus.recommendations.length > 0) {
      this.logger.info('Cache optimization recommendations:', healthStatus.recommendations);
    }
  }

  recordKeyInvalidation(key: string): void {
    const count = this.keyInvalidationCounts.get(key) || 0;
    this.keyInvalidationCounts.set(key, count + 1);
  }

  resetMetrics(): void {
    this.keyInvalidationCounts.clear();
    this.invalidator.clearMetrics();
    this.eventCache.resetMetrics();
    this.logger.info('Cache performance metrics reset');
  }

  getTopInvalidatedKeys(limit: number = 10): Array<{ key: string; count: number }> {
    return Array.from(this.keyInvalidationCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }

  generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const health = this.getHealthStatus();

    return `
Cache Performance Report
========================

Overall Health: ${health.status.toUpperCase()}

Performance Metrics:
- Overall Hit Rate: ${(metrics.overallHitRate * 100).toFixed(1)}%
- Badge Cache Hit Rate: ${(metrics.badgeCacheHitRate * 100).toFixed(1)}%
- Community Cache Hit Rate: ${(metrics.communityCacheHitRate * 100).toFixed(1)}%
- Event Cache Hit Rate: ${(metrics.eventCacheHitRate).toFixed(1)}%
- Average Invalidation Time: ${metrics.averageInvalidationTime.toFixed(2)}ms
- Total Invalidations: ${metrics.totalInvalidations}
- Cache Efficiency: ${(metrics.cacheEfficiency * 100).toFixed(1)}%

Cache Sizes:
- Badge Cache: ${metrics.cacheSize.badge} entries
- Community Cache: ${metrics.cacheSize.community} entries
- Event Cache: ${metrics.cacheSize.event} entries

Top Invalidated Keys:
${metrics.topInvalidatedKeys.map(item => `- ${item.key}: ${item.count} times`).join('\n')}

Issues:
${health.issues.length > 0 ? health.issues.map(issue => `- ${issue}`).join('\n') : 'None detected'}

Recommendations:
${health.recommendations.map(rec => `- ${rec}`).join('\n')}
    `.trim();
  }

  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.info('Cache performance monitor destroyed');
  }
}

export default CachePerformanceMonitor;</content>
<parameter name="filePath">/Users/mac/Documents/DEBY/Personal Projects/PassportX/backend/src/services/cachePerformanceMonitor.ts