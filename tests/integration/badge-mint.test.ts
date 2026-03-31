import BadgeMintService from '../../backend/src/services/badgeMintService';
import BadgeMintNotificationService from '../../backend/src/services/badgeMintNotificationService';
import BadgeCacheService from '../../backend/src/services/badgeCacheService';
import { BadgeMintEvent } from '../../backend/src/chainhook/types/handlers';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Badge Minting Integration Tests', () => {
  let badgeMintService: BadgeMintService;
  let notificationService: BadgeMintNotificationService;
  let cacheService: BadgeCacheService;

  beforeEach(() => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    badgeMintService = new BadgeMintService(mockLogger);
    notificationService = new BadgeMintNotificationService(mockLogger);
    cacheService = new BadgeCacheService(
      { enabled: true, ttl: 300, provider: 'memory' },
      mockLogger
    );
  });

  describe('Badge Minting Service', () => {
    const validEvent: BadgeMintEvent = {
      userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      badgeId: 'badge-001',
      badgeName: 'Gold Badge',
      criteria: 'Completed 10 verifications',
      contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
      transactionHash: 'abc123def456',
      blockHeight: 100,
      timestamp: Date.now(),
    };

    describe('validateBadgeEvent', () => {
      it('should validate and process correct badge event', async () => {
        const result = await badgeMintService.processBadgeMintEvent(validEvent);
        expect(result).toBeDefined();
      });

      it('should reject invalid events (missing userId, negative height/timestamp)', async () => {
        const invalidCases = [
          { ...validEvent, userId: undefined },
          { ...validEvent, blockHeight: -1 },
          { ...validEvent, timestamp: -1 },
        ];

        for (const event of invalidCases) {
          const result = await badgeMintService.processBadgeMintEvent(event as any);
          expect(result.success).toBe(false);
        }
      });
    });

    describe('Audit Logging', () => {
      it('should log successful minting and retrieve by recipient/badge', async () => {
        await badgeMintService.processBadgeMintEvent(validEvent);

        const recipientLogs = badgeMintService.getAuditLogsByRecipient(validEvent.userId);
        const badgeLogs = badgeMintService.getAuditLogsByBadge(validEvent.badgeId);

        expect(recipientLogs.length).toBeGreaterThan(0);
        expect(badgeLogs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Badge Minting Notification Service', () => {
    const event: BadgeMintEvent = {
      userId: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      badgeId: 'badge-001',
      badgeName: 'Gold Badge',
      criteria: 'Criteria',
      contractAddress: 'addr',
      transactionHash: 'hash',
      blockHeight: 100,
      timestamp: Date.now(),
    };

    it('should create valid notifications with customizable options', () => {
      const notification = notificationService.createBadgeMintNotification(event, {
        includePassportLink: true,
      });

      expect(notification.userId).toBe(event.userId);
      expect(notification.type).toBe('badge_received');
      expect(notificationService.validateNotificationPayload(notification)).toBe(true);
    });

    it('should build notification batches for recipients and issuers', async () => {
      const recipients = ['USER1', 'USER2'];
      const issuers = ['ISSUER1'];

      const notifications = await notificationService.buildNotificationBatch(event, recipients, issuers);
      expect(notifications.length).toBe(3); // 2 recipients + 1 issuer
      expect(notifications.some(n => n.type === 'badge_issued')).toBe(true);
    });
  });

  describe('Badge Cache Service', () => {
    it('should set, get, and invalidate cache by key/pattern', () => {
      cacheService.set('badges:user:123', { data: 'val' });
      cacheService.set('passport:123', { data: 'val' });

      cacheService.invalidatePattern('^badges:user:');

      expect(cacheService.get('badges:user:123')).toBeNull();
      expect(cacheService.get('passport:123')).toBeDefined();
    });

    it('should clear all cache and return stats', () => {
      cacheService.set('k1', 'v1');
      cacheService.clear();
      const stats = cacheService.getStats();

      expect(stats.size).toBe(0);
      expect(stats.enabled).toBe(true);
    });

    it('should invalidate specific user cache on badge mint event', () => {
      const userId = 'ST1PQ';
      cacheService.set(`badges:user:${userId}`, 'data');
      
      cacheService.onBadgeMinted({ userId } as any);
      expect(cacheService.get(`badges:user:${userId}`)).toBeNull();
    });
  });

  describe('End-to-End Flow', () => {
    it('should process a complete sequence of minting, notification, and caching', async () => {
      const event: BadgeMintEvent = {
        userId: 'ST1PQ',
        badgeId: 'B1',
        badgeName: 'Gold',
        criteria: 'C',
        contractAddress: 'A',
        transactionHash: 'H',
        blockHeight: 100,
        timestamp: Date.now(),
      };

      // 1. Process Service
      const res = await badgeMintService.processBadgeMintEvent(event);
      expect(res).toBeDefined();

      // 2. Notify
      const note = notificationService.createBadgeMintNotification(event);
      expect(notificationService.validateNotificationPayload(note)).toBe(true);

      // 3. Cache Management
      cacheService.onBadgeMinted(event);
      expect(badgeMintService.getAuditLogs().length).toBeGreaterThan(0);
    });
  });
});
