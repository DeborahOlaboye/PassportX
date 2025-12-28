import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DeadLetterQueue } from '../../models/DeadLetterQueue';
import { RetryQueue } from '../../models/RetryQueue';
import DeadLetterQueueService from '../../services/DeadLetterQueueService';

describe('DeadLetterQueueService', () => {
  beforeEach(async () => {
    await DeadLetterQueue.deleteMany({});
    await RetryQueue.deleteMany({});
  });

  afterEach(async () => {
    await DeadLetterQueue.deleteMany({});
    await RetryQueue.deleteMany({});
  });

  describe('moveToDeadLetter', () => {
    it('should move a retry item to dead letter queue', async () => {
      const retryItem = new RetryQueue({
        itemType: 'event',
        originalPayload: { test: 'data' },
        attemptCount: 5,
        maxAttempts: 5,
        nextRetryAt: new Date(),
        lastError: 'Max retries exceeded',
        errorType: 'max_retries_exceeded',
        status: 'failed'
      });

      await retryItem.save();

      const deadLetterItem = await DeadLetterQueueService.moveToDeadLetter(retryItem);

      expect(deadLetterItem).toBeDefined();
      expect(deadLetterItem.itemType).toBe('event');
      expect(deadLetterItem.totalAttempts).toBe(5);
      expect(deadLetterItem.status).toBe('dead');
      expect(deadLetterItem.errorHistory).toHaveLength(1);
    });

    it('should update retry item status to failed', async () => {
      const retryItem = new RetryQueue({
        itemType: 'webhook',
        originalPayload: { test: 'data' },
        targetUrl: 'https://example.com',
        attemptCount: 5,
        maxAttempts: 5,
        nextRetryAt: new Date(),
        status: 'retrying'
      });

      await retryItem.save();
      await DeadLetterQueueService.moveToDeadLetter(retryItem);

      const updated = await RetryQueue.findById(retryItem._id);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Network error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      await DeadLetterQueue.create({
        itemType: 'webhook',
        originalPayload: {},
        totalAttempts: 5,
        failureReason: 'Timeout',
        errorType: 'timeout',
        errorHistory: [],
        status: 'dead'
      });

      const stats = await DeadLetterQueueService.getStatistics();

      expect(stats.totalItems).toBe(2);
      expect(stats.byItemType.event).toBe(1);
      expect(stats.byItemType.webhook).toBe(1);
      expect(stats.byStatus.dead).toBe(2);
      expect(stats.byErrorType.network).toBe(1);
      expect(stats.byErrorType.timeout).toBe(1);
    });
  });

  describe('recoverItems', () => {
    it('should recover items from dead letter queue', async () => {
      const dlqItem = await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: { test: 'data' },
        totalAttempts: 3,
        failureReason: 'Temporary error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      const result = await DeadLetterQueueService.recoverItems({
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.recoveredItems).toBe(1);
      expect(result.failedItems).toBe(0);

      const updated = await DeadLetterQueue.findById(dlqItem._id);
      expect(updated?.status).toBe('recovered');

      const retryItems = await RetryQueue.find();
      expect(retryItems).toHaveLength(1);
    });

    it('should filter recovery by item type', async () => {
      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      await DeadLetterQueue.create({
        itemType: 'webhook',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      const result = await DeadLetterQueueService.recoverItems({
        itemType: 'event'
      });

      expect(result.recoveredItems).toBe(1);
    });
  });

  describe('archiveOldItems', () => {
    it('should archive old dead items', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead',
        createdAt: oldDate
      });

      const archivedCount = await DeadLetterQueueService.archiveOldItems(7);

      expect(archivedCount).toBe(1);

      const items = await DeadLetterQueue.find({ status: 'archived' });
      expect(items).toHaveLength(1);
    });
  });

  describe('getErrorAnalysis', () => {
    it('should provide error analysis', async () => {
      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Network error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Network error',
        errorType: 'network',
        errorHistory: [],
        status: 'dead'
      });

      await DeadLetterQueue.create({
        itemType: 'event',
        originalPayload: {},
        totalAttempts: 3,
        failureReason: 'Timeout error',
        errorType: 'timeout',
        errorHistory: [],
        status: 'dead'
      });

      const analysis = await DeadLetterQueueService.getErrorAnalysis();

      expect(analysis.errorTypes.network.count).toBe(2);
      expect(analysis.errorTypes.timeout.count).toBe(1);
      expect(analysis.mostCommonErrors).toHaveLength(2);
      expect(analysis.mostCommonErrors[0].error).toBe('Network error');
      expect(analysis.mostCommonErrors[0].count).toBe(2);
    });
  });
});
