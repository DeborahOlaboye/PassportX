import BadgeMetadataUpdateService, { MetadataUpdateResult } from '../../services/badgeMetadataUpdateService';
import BadgeMetadataCacheInvalidator from '../../services/badgeMetadataCacheInvalidator';
import BadgeUIRefreshService from '../../services/badgeUIRefreshService';
import { BadgeMetadataUpdateEvent } from '../../chainhook/types/handlers';

describe('BadgeMetadataUpdateService Integration', () => {
  let service: BadgeMetadataUpdateService;
  let cacheInvalidator: BadgeMetadataCacheInvalidator;
  let uiRefreshService: BadgeUIRefreshService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    cacheInvalidator = new BadgeMetadataCacheInvalidator(mockLogger);
    uiRefreshService = new BadgeUIRefreshService(mockLogger);
    service = new BadgeMetadataUpdateService(cacheInvalidator, uiRefreshService, mockLogger);
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Single Metadata Update Processing', () => {
    it('should process valid metadata update event', async () => {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-1',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        level: { current: 'gold', previous: 'silver' },
        category: { current: 'achievement', previous: 'reward' },
        description: { current: 'Updated description', previous: 'Old description' }
      };

      const result = await service.processMetadataUpdate(event);

      expect(result.success).toBe(true);
      expect(result.badgeId).toBe('badge-1');
      expect(result.invalidated).toBe(true);
      expect(result.uiNotified).toBe(true);
      expect(result.changeCount).toBeGreaterThan(0);
    });

    it('should handle missing required fields', async () => {
      const event = {
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now()
      } as any;

      const result = await service.processMetadataUpdate(event);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.changeCount).toBe(0);
    });

    it('should track statistics on successful processing', async () => {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-2',
        transactionHash: '0xtx456',
        blockHeight: 1001,
        timestamp: Date.now(),
        level: { current: 'platinum', previous: 'gold' }
      };

      await service.processMetadataUpdate(event);

      const stats = service.getStatistics();
      expect(stats.processedCount).toBe(1);
      expect(stats.errorCount).toBe(0);
    });

    it('should increment error count on failure', async () => {
      const invalidEvent = { transactionHash: '0xtx789' } as any;

      await service.processMetadataUpdate(invalidEvent);

      const stats = service.getStatistics();
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('Batch Metadata Update Processing', () => {
    it('should process multiple metadata updates', async () => {
      const events: BadgeMetadataUpdateEvent[] = [
        {
          badgeId: 'badge-1',
          transactionHash: '0xtx1',
          blockHeight: 1000,
          level: { current: 'gold', previous: 'silver' }
        },
        {
          badgeId: 'badge-2',
          transactionHash: '0xtx2',
          blockHeight: 1001,
          category: { current: 'achievement', previous: 'reward' }
        },
        {
          badgeId: 'badge-3',
          transactionHash: '0xtx3',
          blockHeight: 1002,
          description: { current: 'New', previous: 'Old' }
        }
      ];

      const results = await service.processBatchMetadataUpdates(events);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      const events: BadgeMetadataUpdateEvent[] = [
        {
          badgeId: 'badge-1',
          transactionHash: '0xtx1',
          blockHeight: 1000,
          level: { current: 'gold', previous: 'silver' }
        },
        {
          transactionHash: '0xtx2',
          blockHeight: 1001
        } as any,
        {
          badgeId: 'badge-3',
          transactionHash: '0xtx3',
          blockHeight: 1002,
          category: { current: 'new', previous: 'old' }
        }
      ];

      const results = await service.processBatchMetadataUpdates(events);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should accumulate statistics across batch', async () => {
      const events: BadgeMetadataUpdateEvent[] = [
        {
          badgeId: 'badge-1',
          transactionHash: '0xtx1',
          blockHeight: 1000,
          level: { current: 'gold', previous: 'silver' }
        },
        {
          badgeId: 'badge-2',
          transactionHash: '0xtx2',
          blockHeight: 1001,
          category: { current: 'achievement', previous: 'reward' }
        }
      ];

      await service.processBatchMetadataUpdates(events);

      const stats = service.getStatistics();
      expect(stats.processedCount).toBe(2);
    });
  });

  describe('Integration with Cache and UI Services', () => {
    it('should coordinate cache invalidation and UI notification', async () => {
      const cacheInvalidateSpy = jest.spyOn(cacheInvalidator, 'invalidateBadgeCache');
      const uiNotifySpy = jest.spyOn(uiRefreshService, 'notifyBadgeMetadataUpdate');

      const event: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-1',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        level: { current: 'gold', previous: 'silver' },
        category: { current: 'achievement', previous: 'reward' }
      };

      await service.processMetadataUpdate(event);

      expect(cacheInvalidateSpy).toHaveBeenCalled();
      expect(uiNotifySpy).toHaveBeenCalled();
    });

    it('should report combined metrics from all services', async () => {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-1',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        level: { current: 'gold', previous: 'silver' }
      };

      await service.processMetadataUpdate(event);

      const stats = service.getStatistics();
      expect(stats.cacheInvalidatorMetrics).toBeDefined();
      expect(stats.uiRefreshMetrics).toBeDefined();
      expect(stats.successRate).toBeDefined();
    });
  });

  describe('Statistics and Metrics', () => {
    it('should calculate success rate correctly', async () => {
      const validEvent: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-1',
        transactionHash: '0xtx1',
        blockHeight: 1000,
        level: { current: 'gold', previous: 'silver' }
      };

      const invalidEvent = { transactionHash: '0xtx2' } as any;

      await service.processMetadataUpdate(validEvent);
      await service.processMetadataUpdate(invalidEvent);

      const stats = service.getStatistics();
      expect(stats.successRate).toBe('50.00%');
    });

    it('should reset statistics', async () => {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: 'badge-1',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        level: { current: 'gold', previous: 'silver' }
      };

      await service.processMetadataUpdate(event);

      let stats = service.getStatistics();
      expect(stats.processedCount).toBe(1);

      service.resetStatistics();

      stats = service.getStatistics();
      expect(stats.processedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('Service Lifecycle', () => {
    it('should flush pending updates', async () => {
      const flushSpy = jest.spyOn(uiRefreshService, 'flush');

      await service.flushPendingUpdates();

      expect(flushSpy).toHaveBeenCalled();
    });

    it('should cleanup resources on destroy', () => {
      const destroySpy = jest.spyOn(uiRefreshService, 'destroy');

      service.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('destroyed')
      );
    });
  });
});
