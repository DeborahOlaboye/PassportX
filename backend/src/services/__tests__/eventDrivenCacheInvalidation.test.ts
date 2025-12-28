import { EventDrivenCacheInvalidator } from '../eventDrivenCacheInvalidator';
import { BadgeCacheService } from '../badgeCacheService';
import { CommunityCacheService } from '../communityCacheService';
import { ChainhookEventCache } from '../chainhookEventCache';
import { BadgeMetadataCacheInvalidator } from '../badgeMetadataCacheInvalidator';
import { BadgeRevocationCacheInvalidator } from '../badgeRevocationCacheInvalidator';

describe('Event-Driven Cache Invalidation System', () => {
  let badgeCache: BadgeCacheService;
  let communityCache: CommunityCacheService;
  let eventCache: ChainhookEventCache;
  let metadataInvalidator: BadgeMetadataCacheInvalidator;
  let revocationInvalidator: BadgeRevocationCacheInvalidator;
  let invalidator: EventDrivenCacheInvalidator;

  beforeEach(() => {
    // Initialize cache services
    badgeCache = new BadgeCacheService({ enabled: true, ttl: 300, provider: 'memory' });
    communityCache = new CommunityCacheService({ enabled: true, ttl: 300, provider: 'memory' });
    eventCache = new ChainhookEventCache({ maxSize: 1000, ttlMs: 300000 });
    metadataInvalidator = new BadgeMetadataCacheInvalidator();
    revocationInvalidator = new BadgeRevocationCacheInvalidator();

    // Initialize core invalidation system
    invalidator = new EventDrivenCacheInvalidator(
      badgeCache,
      communityCache,
      eventCache,
      metadataInvalidator,
      revocationInvalidator
    );
  });

  describe('Cache Invalidation Rules', () => {
    test('should have correct invalidation rules initialized', () => {
      const rules = invalidator.getInvalidationRules();
      expect(rules.length).toBe(4);

      const ruleTypes = rules.map((rule: any) => rule.eventType);
      expect(ruleTypes).toContain('badge-mint');
      expect(ruleTypes).toContain('badge-metadata-update');
      expect(ruleTypes).toContain('badge-revocation');
      expect(ruleTypes).toContain('community-creation');
    });

    test('badge-mint rule should have high priority and cache warming', () => {
      const rules = invalidator.getInvalidationRules();
      const badgeMintRule = rules.find((rule: any) => rule.eventType === 'badge-mint');

      expect(badgeMintRule?.priority).toBe('high');
      expect(badgeMintRule?.warmCache).toBe(true);
      expect(badgeMintRule?.cacheKeys).toContain('badges:list:all');
    });
  });

  describe('Cache Operations', () => {
    test('should perform cache invalidation for badge mint', async () => {
      // Set some cache entries
      badgeCache.set('badges:user:123:list', ['badge1', 'badge2']);
      badgeCache.set('badges:user:123:count', 2);

      // Invalidate for badge mint
      await invalidator.invalidateCacheForEvent('badge-mint', {
        userId: '123',
        badgeId: 'badge4'
      });

      // Check that relevant caches were invalidated
      expect(badgeCache.get('badges:user:123:list')).toBeNull();
      expect(badgeCache.get('badges:user:123:count')).toBeNull();
    });

    test('should track invalidation metrics', async () => {
      await invalidator.invalidateCacheForEvent('badge-mint', {
        userId: 'test',
        badgeId: 'test-badge'
      });

      const metrics = invalidator.getMetrics();
      expect(metrics.totalInvalidations).toBeGreaterThan(0);
      expect(metrics.invalidationsByEventType.get('badge-mint')).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid events gracefully', async () => {
      const invalidEvent = {
        invalidField: 'test'
      };

      // Should not throw
      await expect(invalidator.invalidateCacheForEvent('invalid-event', invalidEvent)).resolves.not.toThrow();
    });
  });
});