import BadgeRevocationCoordinator from '../../services/badgeRevocationCoordinator';
import BadgeRevocationAuditLog from '../../services/badgeRevocationAuditLog';
import BadgeRevocationCacheInvalidator from '../../services/badgeRevocationCacheInvalidator';
import BadgeRevocationNotificationService from '../../services/badgeRevocationNotificationService';
import BadgeCountUpdateService from '../../services/badgeCountUpdateService';
import { BadgeRevocationEvent } from '../../chainhook/types/handlers';

describe('BadgeRevocationCoordinator Integration', () => {
  let coordinator: BadgeRevocationCoordinator;
  let auditLog: BadgeRevocationAuditLog;
  let cacheInvalidator: BadgeRevocationCacheInvalidator;
  let notificationService: BadgeRevocationNotificationService;
  let countUpdateService: BadgeCountUpdateService;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    auditLog = new BadgeRevocationAuditLog(mockLogger);
    cacheInvalidator = new BadgeRevocationCacheInvalidator(mockLogger);
    notificationService = new BadgeRevocationNotificationService(mockLogger);
    countUpdateService = new BadgeCountUpdateService(mockLogger);

    coordinator = new BadgeRevocationCoordinator(
      auditLog,
      cacheInvalidator,
      notificationService,
      countUpdateService,
      mockLogger
    );
  });

  afterEach(() => {
    coordinator.destroy();
  });

  describe('Single Revocation Processing', () => {
    it('should process soft badge revocation successfully', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Gold Badge',
        revocationType: 'soft',
        reason: 'Policy violation',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      const result = await coordinator.processBadgeRevocation(event);

      expect(result.success).toBe(true);
      expect(result.badgeId).toBe('badge-1');
      expect(result.userId).toBe('user-1');
      expect(result.revocationType).toBe('soft');
      expect(result.auditLogged).toBe(true);
      expect(result.cacheInvalidated).toBe(true);
      expect(result.notified).toBe(true);
      expect(result.countUpdated).toBe(true);
    });

    it('should process hard badge revocation successfully', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-2',
        badgeId: 'badge-2',
        badgeName: 'Platinum Badge',
        revocationType: 'hard',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx456',
        blockHeight: 1001,
        timestamp: Date.now(),
        previousActive: true
      };

      const result = await coordinator.processBadgeRevocation(event);

      expect(result.success).toBe(true);
      expect(result.revocationType).toBe('hard');
    });

    it('should handle missing required fields', async () => {
      const event = {
        badgeId: 'badge-1',
        transactionHash: '0xtx123',
        revocationType: 'soft'
      } as any;

      const result = await coordinator.processBadgeRevocation(event);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should increment processed count on success', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-3',
        badgeId: 'badge-3',
        badgeName: 'Silver Badge',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx789',
        blockHeight: 1002,
        timestamp: Date.now(),
        previousActive: true
      };

      await coordinator.processBadgeRevocation(event);

      const stats = coordinator.getStatistics();
      expect(stats.processedCount).toBe(1);
      expect(stats.errorCount).toBe(0);
    });

    it('should increment error count on failure', async () => {
      const invalidEvent = { transactionHash: '0xtx000' } as any;

      await coordinator.processBadgeRevocation(invalidEvent);

      const stats = coordinator.getStatistics();
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('Batch Revocation Processing', () => {
    it('should process multiple revocations', async () => {
      const events: BadgeRevocationEvent[] = [
        {
          userId: 'user-1',
          badgeId: 'badge-1',
          badgeName: 'Gold',
          revocationType: 'soft',
          issuerId: 'issuer-1',
          contractAddress: 'SP101...badge-issuer',
          transactionHash: '0xtx1',
          blockHeight: 1000,
          timestamp: Date.now(),
          previousActive: true
        },
        {
          userId: 'user-2',
          badgeId: 'badge-2',
          badgeName: 'Platinum',
          revocationType: 'hard',
          issuerId: 'issuer-1',
          contractAddress: 'SP101...badge-issuer',
          transactionHash: '0xtx2',
          blockHeight: 1001,
          timestamp: Date.now(),
          previousActive: true
        },
        {
          userId: 'user-3',
          badgeId: 'badge-3',
          badgeName: 'Silver',
          revocationType: 'soft',
          issuerId: 'issuer-1',
          contractAddress: 'SP101...badge-issuer',
          transactionHash: '0xtx3',
          blockHeight: 1002,
          timestamp: Date.now(),
          previousActive: true
        }
      ];

      const results = await coordinator.processBatchRevocations(events);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      const events: BadgeRevocationEvent[] = [
        {
          userId: 'user-1',
          badgeId: 'badge-1',
          badgeName: 'Gold',
          revocationType: 'soft',
          issuerId: 'issuer-1',
          contractAddress: 'SP101...badge-issuer',
          transactionHash: '0xtx1',
          blockHeight: 1000,
          timestamp: Date.now(),
          previousActive: true
        },
        {
          transactionHash: '0xtx2'
        } as any,
        {
          userId: 'user-3',
          badgeId: 'badge-3',
          badgeName: 'Silver',
          revocationType: 'soft',
          issuerId: 'issuer-1',
          contractAddress: 'SP101...badge-issuer',
          transactionHash: '0xtx3',
          blockHeight: 1002,
          timestamp: Date.now(),
          previousActive: true
        }
      ];

      const results = await coordinator.processBatchRevocations(events);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Service Integration', () => {
    it('should coordinate all services for revocation', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Test Badge',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      const auditSpy = jest.spyOn(auditLog, 'recordRevocation');
      const cacheInvalidateSpy = jest.spyOn(cacheInvalidator, 'invalidateBadgeCache');
      const notifySpy = jest.spyOn(notificationService, 'notifyBadgeRevocation');
      const countUpdateSpy = jest.spyOn(countUpdateService, 'decrementBadgeCount');

      await coordinator.processBadgeRevocation(event);

      expect(auditSpy).toHaveBeenCalled();
      expect(cacheInvalidateSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(countUpdateSpy).toHaveBeenCalled();
    });

    it('should collect metrics from all services', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Test Badge',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      await coordinator.processBadgeRevocation(event);

      const stats = coordinator.getStatistics();

      expect(stats.processedCount).toBe(1);
      expect(stats.auditLogMetrics).toBeDefined();
      expect(stats.cacheInvalidatorMetrics).toBeDefined();
      expect(stats.notificationMetrics).toBeDefined();
      expect(stats.countUpdateMetrics).toBeDefined();
    });
  });

  describe('Statistics and Metrics', () => {
    it('should calculate success rate correctly', async () => {
      const validEvent: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Valid',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx1',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      const invalidEvent = { transactionHash: '0xtx2' } as any;

      await coordinator.processBadgeRevocation(validEvent);
      await coordinator.processBadgeRevocation(invalidEvent);

      const stats = coordinator.getStatistics();
      expect(stats.successRate).toBe('50.00%');
    });

    it('should provide detailed statistics', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Test',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      await coordinator.processBadgeRevocation(event);

      const stats = coordinator.getDetailedStatistics();

      expect(stats.processedCount).toBeGreaterThan(0);
      expect(stats.auditLogStats).toBeDefined();
      expect(stats.cacheInvalidatorStats).toBeDefined();
      expect(stats.notificationStats).toBeDefined();
      expect(stats.countUpdateStats).toBeDefined();
    });

    it('should reset statistics', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Test',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      await coordinator.processBadgeRevocation(event);

      let stats = coordinator.getStatistics();
      expect(stats.processedCount).toBe(1);

      coordinator.resetStatistics();

      stats = coordinator.getStatistics();
      expect(stats.processedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('Service Lifecycle', () => {
    it('should flush pending operations', async () => {
      const event: BadgeRevocationEvent = {
        userId: 'user-1',
        badgeId: 'badge-1',
        badgeName: 'Test',
        revocationType: 'soft',
        issuerId: 'issuer-1',
        contractAddress: 'SP101...badge-issuer',
        transactionHash: '0xtx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        previousActive: true
      };

      await coordinator.processBadgeRevocation(event);
      await coordinator.flushPendingOperations();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('flushed')
      );
    });

    it('should cleanup resources on destroy', () => {
      coordinator.destroy();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('destroyed')
      );
    });
  });
});
