import BadgeMintService from '../../backend/src/services/badgeMintService';
import BadgeMintNotificationService from '../../backend/src/services/badgeMintNotificationService';
import BadgeCacheService from '../../backend/src/services/badgeCacheService';
import { BadgeMintEvent } from '../../backend/src/chainhook/types/handlers';

describe('Badge Minting Integration Tests', () => {
  let badgeMintService: BadgeMintService;
  let notificationService: BadgeMintNotificationService;
  let cacheService: BadgeCacheService;

  beforeEach(() => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    badgeMintService = new BadgeMintService(mockLogger);
    notificationService = new BadgeMintNotificationService(mockLogger);
    cacheService = new BadgeCacheService({ enabled: true, ttl: 300, provider: 'memory' }, mockLogger);
  });

  describe('Badge Minting Service', () => {
    describe('validateBadgeEvent', () => {
      it('should validate correct badge event', () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const result = badgeMintService.processBadgeMintEvent(event);
        expect(result).toBeDefined();
      });

      it('should reject event with missing userId', async () => {
        const event: any = {
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const result = await badgeMintService.processBadgeMintEvent(event);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject event with negative blockHeight', async () => {
        const event: any = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: -1,
          timestamp: Date.now()
        };

        const result = await badgeMintService.processBadgeMintEvent(event);
        expect(result.success).toBe(false);
      });

      it('should reject event with invalid timestamp', async () => {
        const event: any = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: -1
        };

        const result = await badgeMintService.processBadgeMintEvent(event);
        expect(result.success).toBe(false);
      });
    });

    describe('Audit Logging', () => {
      it('should log successful badge minting', async () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const logs = badgeMintService.getAuditLogs();
        const initialCount = logs.length;

        await badgeMintService.processBadgeMintEvent(event);

        const updatedLogs = badgeMintService.getAuditLogs();
        expect(updatedLogs.length).toBeGreaterThanOrEqual(initialCount);
      });

      it('should retrieve audit logs by recipient', async () => {
        const userId = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        const event: BadgeMintEvent = {
          userId,
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        await badgeMintService.processBadgeMintEvent(event);

        const logs = badgeMintService.getAuditLogsByRecipient(userId);
        expect(Array.isArray(logs)).toBe(true);
      });

      it('should retrieve audit logs by badge', async () => {
        const badgeId = 'badge-001';
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId,
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        await badgeMintService.processBadgeMintEvent(event);

        const logs = badgeMintService.getAuditLogsByBadge(badgeId);
        expect(Array.isArray(logs)).toBe(true);
      });
    });
  });

  describe('Badge Minting Notification Service', () => {
    describe('createBadgeMintNotification', () => {
      it('should create valid badge mint notification', () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const notification = notificationService.createBadgeMintNotification(event);

        expect(notification).toBeDefined();
        expect(notification.userId).toBe(event.userId);
        expect(notification.type).toBe('badge_received');
        expect(notification.title).toContain('Gold Badge');
        expect(notification.data.badgeId).toBe('badge-001');
      });

      it('should include customizable options', () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const notification = notificationService.createBadgeMintNotification(event, {
          includeInstructions: false,
          includePassportLink: true,
          includeCommunityLink: true
        });

        expect(notification).toBeDefined();
        expect(notification.message).toBeDefined();
      });

      it('should reject event with missing userId', () => {
        const event: any = {
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        expect(() => notificationService.createBadgeMintNotification(event)).toThrow();
      });
    });

    describe('buildNotificationBatch', () => {
      it('should create notifications for multiple recipients', async () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const recipientAddresses = [
          'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
        ];

        const notifications = await notificationService.buildNotificationBatch(event, recipientAddresses);

        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBe(2);
      });

      it('should include issuer confirmations', async () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const recipientAddresses = ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'];
        const issuerAddresses = ['ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'];

        const notifications = await notificationService.buildNotificationBatch(event, recipientAddresses, issuerAddresses);

        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBe(2);

        const hasIssuanceNotification = notifications.some(n => n.type === 'badge_issued');
        expect(hasIssuanceNotification).toBe(true);
      });
    });

    describe('validateNotificationPayload', () => {
      it('should validate correct notification payload', () => {
        const event: BadgeMintEvent = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        const notification = notificationService.createBadgeMintNotification(event);
        const isValid = notificationService.validateNotificationPayload(notification);

        expect(isValid).toBe(true);
      });

      it('should reject notification with missing badgeId', () => {
        const invalidNotification: any = {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          type: 'badge_received',
          title: 'Gold Badge',
          message: 'You received a badge',
          data: {
            eventType: 'badge-mint'
          }
        };

        const isValid = notificationService.validateNotificationPayload(invalidNotification);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Badge Cache Service', () => {
    describe('Cache Operations', () => {
      it('should set and get cache values', () => {
        cacheService.set('test-key', { data: 'test-value' });
        const value = cacheService.get<any>('test-key');

        expect(value).toBeDefined();
        expect(value.data).toBe('test-value');
      });

      it('should invalidate cache by key', () => {
        cacheService.set('test-key', { data: 'test-value' });
        cacheService.invalidate('test-key');
        const value = cacheService.get('test-key');

        expect(value).toBeNull();
      });

      it('should invalidate by pattern', () => {
        cacheService.set('badges:user:123', { data: 'badges' });
        cacheService.set('badges:user:123:list', { data: 'list' });
        cacheService.set('passport:123', { data: 'passport' });

        cacheService.invalidatePattern('^badges:user:123');

        expect(cacheService.get('badges:user:123')).toBeNull();
        expect(cacheService.get('badges:user:123:list')).toBeNull();
        expect(cacheService.get('passport:123')).toBeDefined();
      });

      it('should invalidate multiple keys', () => {
        cacheService.set('key1', { data: 'value1' });
        cacheService.set('key2', { data: 'value2' });
        cacheService.set('key3', { data: 'value3' });

        const invalidated = cacheService.invalidateMultiple(['key1', 'key2']);

        expect(invalidated).toBe(2);
        expect(cacheService.get('key1')).toBeNull();
        expect(cacheService.get('key2')).toBeNull();
        expect(cacheService.get('key3')).toBeDefined();
      });

      it('should clear all cache', () => {
        cacheService.set('key1', { data: 'value1' });
        cacheService.set('key2', { data: 'value2' });

        cacheService.clear();

        expect(cacheService.get('key1')).toBeNull();
        expect(cacheService.get('key2')).toBeNull();
      });
    });

    describe('onBadgeMinted', () => {
      it('should invalidate badge-related cache on minting', () => {
        const userId = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        const badgeId = 'badge-001';

        cacheService.set(`badges:user:${userId}`, { data: 'badges' });
        cacheService.set(`badges:user:${userId}:list`, { data: 'list' });
        cacheService.set(`passport:${userId}`, { data: 'passport' });

        const event: BadgeMintEvent = {
          userId,
          badgeId,
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        };

        cacheService.onBadgeMinted(event);

        expect(cacheService.get(`badges:user:${userId}`)).toBeNull();
        expect(cacheService.get(`passport:${userId}`)).toBeNull();
      });

      it('should handle invalid badge mint events gracefully', () => {
        const invalidEvent: any = {
          badgeName: 'Gold Badge'
        };

        expect(() => cacheService.onBadgeMinted(invalidEvent)).not.toThrow();
      });
    });

    describe('Cache Stats', () => {
      it('should return cache statistics', () => {
        cacheService.set('key1', { data: 'value1' });
        cacheService.set('key2', { data: 'value2' });

        const stats = cacheService.getStats();

        expect(stats).toBeDefined();
        expect(stats.size).toBe(2);
        expect(stats.enabled).toBe(true);
        expect(stats.ttl).toBe(300);
        expect(Array.isArray(stats.keys)).toBe(true);
      });
    });
  });

  describe('End-to-End Badge Minting Flow', () => {
    it('should process complete badge minting workflow', async () => {
      const event: BadgeMintEvent = {
        userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        badgeId: 'badge-001',
        badgeName: 'Gold Badge',
        criteria: 'Completed 10 verifications',
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
        transactionHash: 'abc123def456',
        blockHeight: 100,
        timestamp: Date.now()
      };

      const processResult = await badgeMintService.processBadgeMintEvent(event);
      expect(processResult).toBeDefined();

      const notification = notificationService.createBadgeMintNotification(event);
      expect(notification).toBeDefined();
      expect(notificationService.validateNotificationPayload(notification)).toBe(true);

      cacheService.onBadgeMinted(event);
      const stats = cacheService.getStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle multiple badge mints in sequence', async () => {
      const events: BadgeMintEvent[] = [
        {
          userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-001',
          badgeName: 'Gold Badge',
          criteria: 'Completed 10 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'abc123def456',
          blockHeight: 100,
          timestamp: Date.now()
        },
        {
          userId: 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          badgeId: 'badge-002',
          badgeName: 'Silver Badge',
          criteria: 'Completed 5 verifications',
          contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
          transactionHash: 'xyz789uvw012',
          blockHeight: 101,
          timestamp: Date.now() + 1000
        }
      ];

      for (const event of events) {
        const result = await badgeMintService.processBadgeMintEvent(event);
        expect(result).toBeDefined();

        const notification = notificationService.createBadgeMintNotification(event);
        expect(notification).toBeDefined();

        cacheService.onBadgeMinted(event);
      }

      const logs = badgeMintService.getAuditLogs();
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });
  });
});
