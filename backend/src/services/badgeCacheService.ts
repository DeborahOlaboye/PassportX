import { BadgeMintEvent } from '../chainhook/types/handlers';

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  provider: 'memory' | 'redis';
}

export class BadgeCacheService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private logger: any;
  private config: CacheConfig;

  constructor(config: CacheConfig = { enabled: true, ttl: 300, provider: 'memory' }, logger?: any) {
    this.config = config;
    this.logger = logger || this.getDefaultLogger();
    this.startCleanupInterval();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeCacheService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeCacheService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeCacheService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeCacheService] ${msg}`, ...args)
    };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  set(key: string, data: any, ttl: number = this.config.ttl): void {
    if (!this.config.enabled) {
      return;
    }

    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { data, expiresAt });

    this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  get<T>(key: string): T | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data as T;
  }

  invalidate(key: string): void {
    if (!this.config.enabled) {
      return;
    }

    const deleted = this.cache.delete(key);

    if (deleted) {
      this.logger.info(`Cache invalidated: ${key}`);
    }
  }

  invalidatePattern(pattern: string): void {
    if (!this.config.enabled) {
      return;
    }

    try {
      const regex = new RegExp(pattern);
      let invalidated = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          invalidated++;
        }
      }

      if (invalidated > 0) {
        this.logger.info(`Cache invalidated ${invalidated} entries matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to compile regex pattern: ${pattern}`, error);
    }
  }

  invalidateMultiple(keys: string[]): number {
    let invalidated = 0;

    for (const key of keys) {
      if (this.cache.delete(key)) {
        invalidated++;
      }
    }

    if (invalidated > 0) {
      this.logger.info(`Cache invalidated ${invalidated} entries`);
    }

    return invalidated;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared (${size} entries)`);
  }

  onBadgeMinted(event: BadgeMintEvent): void {
    try {
      if (!this.config.enabled) {
        this.logger.debug('Cache is disabled, skipping invalidation');
        return;
      }

      if (!event || !event.userId || !event.badgeId) {
        this.logger.warn('Invalid badge mint event for cache invalidation');
        return;
      }

      this.logger.info('Invalidating cache due to badge minting', {
        badgeId: event.badgeId,
        userId: event.userId,
        badgeName: event.badgeName
      });

      const invalidatedCount = this.invalidateMultiple([
        `badges:user:${event.userId}`,
        `badges:user:${event.userId}:list`,
        `badges:user:${event.userId}:count`,
        `badges:list:.*`,
        `badges:search:.*`,
        `badges:category:.*`,
        `badges:recent`,
        `passport:${event.userId}`,
        `badge:${event.badgeId}`,
        'badges:count'
      ].filter(key => key !== null) as string[]);

      this.logger.debug(`Invalidated ${invalidatedCount} cache entries for badge minting`, {
        badgeId: event.badgeId,
        userId: event.userId
      });
    } catch (error) {
      this.logger.error('Error invalidating cache for badge minting:', error);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      enabled: this.config.enabled,
      ttl: this.config.ttl,
      provider: this.config.provider,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default BadgeCacheService;
