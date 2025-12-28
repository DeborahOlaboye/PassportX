import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { RetryQueue } from '../../models/RetryQueue';
import { RetryQueueService } from '../../services/RetryQueueService';

describe('RetryQueueService', () => {
  let service: RetryQueueService;

  beforeEach(() => {
    service = new RetryQueueService();
  });

  afterEach(async () => {
    await RetryQueue.deleteMany({});
  });

  describe('addToQueue', () => {
    it('should add an item to the retry queue', async () => {
      const item = await service.addToQueue({
        itemType: 'event',
        originalPayload: { test: 'data' },
        eventType: 'test-event',
        error: 'Test error',
        errorType: 'network'
      });

      expect(item).toBeDefined();
      expect(item.itemType).toBe('event');
      expect(item.status).toBe('pending');
      expect(item.attemptCount).toBe(0);
    });

    it('should set next retry time using exponential backoff', async () => {
      const item = await service.addToQueue({
        itemType: 'webhook',
        originalPayload: { test: 'data' },
        targetUrl: 'https://example.com/webhook',
        error: 'Connection failed',
        errorType: 'network'
      });

      expect(item.nextRetryAt).toBeDefined();
      expect(item.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      await service.addToQueue({
        itemType: 'event',
        originalPayload: {},
        errorType: 'network'
      });

      await service.addToQueue({
        itemType: 'webhook',
        originalPayload: {},
        errorType: 'timeout'
      });

      const stats = await service.getStatistics();

      expect(stats.totalItems).toBe(2);
      expect(stats.byItemType.event).toBe(1);
      expect(stats.byItemType.webhook).toBe(1);
      expect(stats.byStatus.pending).toBe(2);
    });
  });

  describe('cleanupOldItems', () => {
    it('should delete old succeeded items', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const item = await service.addToQueue({
        itemType: 'event',
        originalPayload: {}
      });

      item.status = 'succeeded';
      item.updatedAt = oldDate;
      await item.save();

      const deletedCount = await service.cleanupOldItems(7);

      expect(deletedCount).toBe(1);

      const remaining = await RetryQueue.countDocuments();
      expect(remaining).toBe(0);
    });
  });
});
