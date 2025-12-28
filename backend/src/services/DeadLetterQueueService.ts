import { DeadLetterQueue, IDeadLetterQueueItem } from '../models/DeadLetterQueue';
import { RetryQueue, IRetryQueueItem } from '../models/RetryQueue';
import { ExponentialBackoffService } from './ExponentialBackoffService';

/**
 * DeadLetterQueueService
 *
 * Manages items that have exceeded max retry attempts or are permanently failed.
 * Provides recovery mechanisms and monitoring for dead letter items.
 */

export interface DeadLetterStats {
  totalItems: number;
  byItemType: {
    event: number;
    webhook: number;
  };
  byErrorType: Record<string, number>;
  byStatus: {
    dead: number;
    recovered: number;
    archived: number;
  };
  oldestItem?: Date;
  newestItem?: Date;
}

export interface RecoveryResult {
  success: boolean;
  recoveredItems: number;
  failedItems: number;
  errors: string[];
}

export class DeadLetterQueueService {
  private backoffService: ExponentialBackoffService;

  constructor() {
    this.backoffService = new ExponentialBackoffService();
  }

  /**
   * Move a failed retry queue item to dead letter queue
   */
  async moveToDeadLetter(retryItem: IRetryQueueItem): Promise<IDeadLetterQueueItem> {
    // Collect error history from retry item
    const errorHistory = [{
      attemptNumber: retryItem.attemptCount,
      error: retryItem.lastError || 'Unknown error',
      timestamp: retryItem.lastAttemptAt || new Date(),
      errorType: retryItem.errorType
    }];

    const deadLetterItem = new DeadLetterQueue({
      itemType: retryItem.itemType,
      originalPayload: retryItem.originalPayload,
      targetUrl: retryItem.targetUrl,
      eventType: retryItem.eventType,
      contractAddress: retryItem.contractAddress,
      transactionHash: retryItem.transactionHash,
      blockHeight: retryItem.blockHeight,
      totalAttempts: retryItem.attemptCount,
      failureReason: retryItem.lastError || 'Maximum retries exceeded',
      errorType: retryItem.errorType || 'max_retries_exceeded',
      errorHistory,
      status: 'dead',
      metadata: {
        ...retryItem.metadata,
        retryQueueId: retryItem._id.toString(),
        alertSent: false,
        manualReviewRequired: true
      }
    });

    await deadLetterItem.save();

    // Update retry queue item status
    retryItem.status = 'failed';
    await retryItem.save();

    return deadLetterItem;
  }

  /**
   * Get dead letter queue statistics
   */
  async getStatistics(): Promise<DeadLetterStats> {
    const items = await DeadLetterQueue.find();

    const stats: DeadLetterStats = {
      totalItems: items.length,
      byItemType: {
        event: 0,
        webhook: 0
      },
      byErrorType: {},
      byStatus: {
        dead: 0,
        recovered: 0,
        archived: 0
      }
    };

    items.forEach(item => {
      // Count by item type
      stats.byItemType[item.itemType]++;

      // Count by error type
      stats.byErrorType[item.errorType] = (stats.byErrorType[item.errorType] || 0) + 1;

      // Count by status
      stats.byStatus[item.status]++;

      // Track oldest and newest
      if (!stats.oldestItem || item.createdAt < stats.oldestItem) {
        stats.oldestItem = item.createdAt;
      }
      if (!stats.newestItem || item.createdAt > stats.newestItem) {
        stats.newestItem = item.createdAt;
      }
    });

    return stats;
  }

  /**
   * Attempt to recover items from dead letter queue
   */
  async recoverItems(
    filter: {
      itemType?: 'event' | 'webhook';
      errorType?: string;
      olderThan?: Date;
      limit?: number;
    } = {}
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: true,
      recoveredItems: 0,
      failedItems: 0,
      errors: []
    };

    const query: any = { status: 'dead' };

    if (filter.itemType) {
      query.itemType = filter.itemType;
    }

    if (filter.errorType) {
      query.errorType = filter.errorType;
    }

    if (filter.olderThan) {
      query.createdAt = { $lt: filter.olderThan };
    }

    const items = await DeadLetterQueue.find(query)
      .limit(filter.limit || 100)
      .sort({ createdAt: 1 });

    for (const item of items) {
      try {
        // Create new retry queue item
        const retryItem = new RetryQueue({
          itemType: item.itemType,
          originalPayload: item.originalPayload,
          targetUrl: item.targetUrl,
          eventType: item.eventType,
          contractAddress: item.contractAddress,
          transactionHash: item.transactionHash,
          blockHeight: item.blockHeight,
          attemptCount: 0,
          maxAttempts: 3, // Give it fewer attempts on recovery
          nextRetryAt: new Date(), // Retry immediately
          status: 'pending',
          metadata: {
            ...item.metadata,
            deadLetterRecovery: true,
            originalDeadLetterId: item._id.toString()
          }
        });

        await retryItem.save();

        // Mark dead letter item as recovered
        item.status = 'recovered';
        item.recoveredAt = new Date();
        await item.save();

        result.recoveredItems++;
      } catch (error) {
        result.failedItems++;
        result.errors.push(`Failed to recover item ${item._id}: ${error}`);
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Archive old dead letter items
   */
  async archiveOldItems(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await DeadLetterQueue.updateMany(
      {
        status: 'dead',
        createdAt: { $lt: cutoffDate }
      },
      {
        $set: {
          status: 'archived',
          archivedAt: new Date()
        }
      }
    );

    return result.modifiedCount;
  }

  /**
   * Get items requiring manual review
   */
  async getItemsForManualReview(limit: number = 50): Promise<IDeadLetterQueueItem[]> {
    return await DeadLetterQueue.find({
      status: 'dead',
      'metadata.manualReviewRequired': true,
      'metadata.alertSent': { $ne: true }
    })
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  /**
   * Mark alert as sent for an item
   */
  async markAlertSent(itemId: string): Promise<void> {
    await DeadLetterQueue.findByIdAndUpdate(itemId, {
      $set: { 'metadata.alertSent': true }
    });
  }

  /**
   * Delete archived items
   */
  async deleteArchivedItems(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await DeadLetterQueue.deleteMany({
      status: 'archived',
      archivedAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }

  /**
   * Get detailed error analysis
   */
  async getErrorAnalysis(): Promise<{
    errorTypes: Record<string, {
      count: number;
      percentage: number;
      examples: string[];
    }>;
    mostCommonErrors: Array<{
      error: string;
      count: number;
    }>;
  }> {
    const items = await DeadLetterQueue.find({ status: 'dead' });
    const totalItems = items.length;

    const errorTypes: Record<string, {
      count: number;
      percentage: number;
      examples: string[];
    }> = {};

    const errorCounts: Record<string, number> = {};

    items.forEach(item => {
      // Count by error type
      if (!errorTypes[item.errorType]) {
        errorTypes[item.errorType] = {
          count: 0,
          percentage: 0,
          examples: []
        };
      }

      errorTypes[item.errorType].count++;
      if (errorTypes[item.errorType].examples.length < 3) {
        errorTypes[item.errorType].examples.push(item.failureReason);
      }

      // Count individual errors
      errorCounts[item.failureReason] = (errorCounts[item.failureReason] || 0) + 1;
    });

    // Calculate percentages
    Object.keys(errorTypes).forEach(type => {
      errorTypes[type].percentage = (errorTypes[type].count / totalItems) * 100;
    });

    // Get most common errors
    const mostCommonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      errorTypes,
      mostCommonErrors
    };
  }
}

export default new DeadLetterQueueService();
