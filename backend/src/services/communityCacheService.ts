import { CommunityCreationEvent } from './communityCreationService';

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  provider: 'memory' | 'redis';
}

export class CommunityCacheService {
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
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCacheService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCacheService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCacheService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCacheService] ${msg}`, ...args)
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
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared (${size} entries)`);
  }

  onCommunityCreated(event: CommunityCreationEvent): void {
    try {
      if (!this.config.enabled) {
        this.logger.debug('Cache is disabled, skipping invalidation');
        return;
      }

      if (!event || !event.communityId) {
        this.logger.warn('Invalid community creation event for cache invalidation');
        return;
      }

      this.logger.info('Invalidating cache due to community creation', {
        communityId: event.communityId,
        communityName: event.communityName,
        ownerAddress: event.ownerAddress
      });

      const invalidatedCount = this.invalidateMultiple([
        '^communities:list:.*',
        '^communities:search:.*',
        '^communities:tag:.*',
        '^communities:admin:.*',
        'communities:count',
        event.ownerAddress ? `communities:admin:${event.ownerAddress}:count` : null,
        event.communityId ? `community:${event.communityId}` : null,
        event.communityName ? `community:slug:${this.generateSlug(event.communityName)}` : null
      ].filter(key => key !== null) as string[]);

      this.logger.info('Community cache invalidation complete', {
        communityId: event.communityId,
        invalidatedPatterns: invalidatedCount
      });
    } catch (error) {
      this.logger.error('Error during cache invalidation for community creation', error);
    }
  }

  private invalidateMultiple(keys: string[]): number {
    let totalInvalidated = 0;

    for (const key of keys) {
      if (key.includes('*') || key.includes('^')) {
        totalInvalidated += this.countInvalidatedByPattern(key);
      } else {
        const deleted = this.cache.delete(key);
        if (deleted) {
          totalInvalidated++;
          this.logger.debug(`Cache invalidated: ${key}`);
        }
      }
    }

    return totalInvalidated;
  }

  private countInvalidatedByPattern(pattern: string): number {
    try {
      const regex = new RegExp(pattern);
      let count = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          count++;
        }
      }

      if (count > 0) {
        this.logger.debug(`Cache invalidated ${count} entries matching pattern: ${pattern}`);
      }

      return count;
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  getStats(): {
    cacheSize: number;
    enabled: boolean;
    ttl: number;
    provider: string;
  } {
    return {
      cacheSize: this.cache.size,
      enabled: this.config.enabled,
      ttl: this.config.ttl,
      provider: this.config.provider
    };
  }
}

export default CommunityCacheService;
