import { RetryQueue, IRetryQueueItem } from '../models/RetryQueue';
import { ExponentialBackoffService } from './ExponentialBackoffService';
import DeadLetterQueueService from './DeadLetterQueueService';
import CircuitBreakerRegistry from './CircuitBreakerService';

/**
 * RetryQueueService
 *
 * Manages retry queue for failed events and webhooks.
 * Implements intelligent retry logic with exponential backoff and circuit breaker protection.
 */

export interface RetryQueueStats {
  totalItems: number;
  byStatus: {
    pending: number;
    retrying: number;
    failed: number;
    succeeded: number;
  };
  byItemType: {
    event: number;
    webhook: number;
  };
  byErrorType: Record<string, number>;
  nextRetryTime?: Date;
  averageAttempts: number;
}

export class RetryQueueService {
  private backoffService: ExponentialBackoffService;
  private deadLetterService: typeof DeadLetterQueueService;
  private circuitBreakerRegistry: typeof CircuitBreakerRegistry;
  private isProcessing: boolean = false;

  constructor() {
    this.backoffService = new ExponentialBackoffService();
    this.deadLetterService = DeadLetterQueueService;
    this.circuitBreakerRegistry = CircuitBreakerRegistry;
  }

  /**
   * Add item to retry queue
   */
  async addToQueue(params: {
    itemType: 'event' | 'webhook';
    originalPayload: any;
    targetUrl?: string;
    eventType?: string;
    contractAddress?: string;
    transactionHash?: string;
    blockHeight?: number;
    errorType?: 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown';
    error?: string;
    maxAttempts?: number;
    metadata?: Record<string, any>;
  }): Promise<IRetryQueueItem> {
    const backoff = this.backoffService.calculateBackoff(0);

    const retryItem = new RetryQueue({
      itemType: params.itemType,
      originalPayload: params.originalPayload,
      targetUrl: params.targetUrl,
      eventType: params.eventType,
      contractAddress: params.contractAddress,
      transactionHash: params.transactionHash,
      blockHeight: params.blockHeight,
      attemptCount: 0,
      maxAttempts: params.maxAttempts || 5,
      nextRetryAt: backoff.nextRetryAt,
      lastError: params.error,
      errorType: params.errorType || 'unknown',
      status: 'pending',
      metadata: params.metadata
    });

    await retryItem.save();
    return retryItem;
  }

  /**
   * Process pending retry queue items
   */
  async processQueue(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
  }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    this.isProcessing = true;

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };

    try {
      const items = await this.getItemsReadyForRetry();

      for (const item of items) {
        try {
          await this.processItem(item);
          results.processed++;
        } catch (error) {
          results.skipped++;
          console.error(`Failed to process retry item ${item._id}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  /**
   * Get items ready for retry
   */
  private async getItemsReadyForRetry(limit: number = 100): Promise<IRetryQueueItem[]> {
    return await RetryQueue.find({
      status: { $in: ['pending', 'retrying'] },
      nextRetryAt: { $lte: new Date() }
    })
      .limit(limit)
      .sort({ nextRetryAt: 1 });
  }

  /**
   * Process individual retry item
   */
  private async processItem(item: IRetryQueueItem): Promise<void> {
    // Check if we should retry based on error type
    if (!this.backoffService.isRetryableError(item.errorType || 'unknown')) {
      await this.moveToDeadLetter(item, 'Non-retryable error type');
      return;
    }

    // Check if max attempts exceeded
    if (item.attemptCount >= item.maxAttempts) {
      await this.moveToDeadLetter(item, 'Maximum retry attempts exceeded');
      return;
    }

    // Get circuit breaker for this item type
    const breakerName = this.getCircuitBreakerName(item);
    const circuitBreaker = this.circuitBreakerRegistry.getBreaker(breakerName);

    // Update status to retrying
    item.status = 'retrying';
    item.lastAttemptAt = new Date();
    item.attemptCount++;
    await item.save();

    try {
      // Execute retry with circuit breaker protection
      await circuitBreaker.execute(async () => {
        await this.executeRetry(item);
      });

      // Success - mark as succeeded
      item.status = 'succeeded';
      await item.save();
    } catch (error: any) {
      // Failure - schedule next retry or move to dead letter
      await this.handleRetryFailure(item, error);
    }
  }

  /**
   * Execute the actual retry logic
   */
  private async executeRetry(item: IRetryQueueItem): Promise<void> {
    if (item.itemType === 'webhook') {
      // Will be implemented with webhook retry enhancement
      throw new Error('Webhook retry not yet implemented in this service');
    } else if (item.itemType === 'event') {
      // Will be integrated with event processor
      throw new Error('Event retry not yet implemented in this service');
    }
  }

  /**
   * Handle retry failure
   */
  private async handleRetryFailure(item: IRetryQueueItem, error: any): Promise<void> {
    item.lastError = error.message || 'Unknown error';

    // Classify error type if not already set
    if (!item.errorType || item.errorType === 'unknown') {
      item.errorType = this.classifyError(error);
    }

    // Check if we should continue retrying
    if (item.attemptCount >= item.maxAttempts) {
      await this.moveToDeadLetter(item, 'Maximum retry attempts exceeded after failure');
      return;
    }

    // Calculate next retry time with backoff
    const backoff = this.backoffService.getErrorSpecificBackoff(
      item.attemptCount,
      item.errorType
    );

    if (!backoff.shouldRetry) {
      await this.moveToDeadLetter(item, 'Backoff service determined not to retry');
      return;
    }

    // Schedule next retry
    item.nextRetryAt = backoff.nextRetryAt;
    item.status = 'pending';
    await item.save();
  }

  /**
   * Classify error type from error object
   */
  private classifyError(error: any): 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown' {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status || '';

    if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
      return 'timeout';
    }

    if (errorMessage.includes('network') || errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
      return 'network';
    }

    if (errorMessage.includes('validation') || errorCode === 400) {
      return 'validation';
    }

    if (errorMessage.includes('rate limit') || errorCode === 429) {
      return 'rate_limit';
    }

    if (errorCode >= 500 && errorCode < 600) {
      return 'server_error';
    }

    return 'unknown';
  }

  /**
   * Move item to dead letter queue
   */
  private async moveToDeadLetter(item: IRetryQueueItem, reason: string): Promise<void> {
    item.lastError = reason;
    await this.deadLetterService.moveToDeadLetter(item);
  }

  /**
   * Get circuit breaker name for item
   */
  private getCircuitBreakerName(item: IRetryQueueItem): string {
    if (item.itemType === 'webhook' && item.targetUrl) {
      return `webhook:${item.targetUrl}`;
    }
    return `${item.itemType}:${item.eventType || 'unknown'}`;
  }

  /**
   * Get retry queue statistics
   */
  async getStatistics(): Promise<RetryQueueStats> {
    const items = await RetryQueue.find();

    const stats: RetryQueueStats = {
      totalItems: items.length,
      byStatus: {
        pending: 0,
        retrying: 0,
        failed: 0,
        succeeded: 0
      },
      byItemType: {
        event: 0,
        webhook: 0
      },
      byErrorType: {},
      averageAttempts: 0
    };

    let totalAttempts = 0;

    items.forEach(item => {
      stats.byStatus[item.status]++;
      stats.byItemType[item.itemType]++;

      if (item.errorType) {
        stats.byErrorType[item.errorType] = (stats.byErrorType[item.errorType] || 0) + 1;
      }

      totalAttempts += item.attemptCount;

      if (!stats.nextRetryTime || (item.nextRetryAt && item.nextRetryAt < stats.nextRetryTime)) {
        if (item.status === 'pending' || item.status === 'retrying') {
          stats.nextRetryTime = item.nextRetryAt;
        }
      }
    });

    stats.averageAttempts = items.length > 0 ? totalAttempts / items.length : 0;

    return stats;
  }

  /**
   * Clean up old completed items
   */
  async cleanupOldItems(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await RetryQueue.deleteMany({
      status: 'succeeded',
      updatedAt: { $lt: cutoffDate }
    });

    return result.deletedCount;
  }

  /**
   * Retry a specific item immediately
   */
  async retryNow(itemId: string): Promise<void> {
    const item = await RetryQueue.findById(itemId);
    if (!item) {
      throw new Error(`Retry item ${itemId} not found`);
    }

    item.nextRetryAt = new Date();
    item.status = 'pending';
    await item.save();
  }

  /**
   * Cancel retry for an item
   */
  async cancelRetry(itemId: string): Promise<void> {
    const item = await RetryQueue.findById(itemId);
    if (!item) {
      throw new Error(`Retry item ${itemId} not found`);
    }

    await this.moveToDeadLetter(item, 'Manually cancelled');
  }
}

export default new RetryQueueService();
