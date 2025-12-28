import { RetryQueue } from '../models/RetryQueue';
import { DeadLetterQueue } from '../models/DeadLetterQueue';

/**
 * RetryMetricsService
 *
 * Tracks and provides metrics for retry operations, success rates, and system health.
 */

export interface RetryMetrics {
  retryQueue: {
    total: number;
    pending: number;
    retrying: number;
    succeeded: number;
    failed: number;
    averageAttempts: number;
    oldestPendingItem?: Date;
  };
  deadLetterQueue: {
    total: number;
    dead: number;
    recovered: number;
    archived: number;
    errorDistribution: Record<string, number>;
  };
  successRates: {
    overall: number; // percentage
    byErrorType: Record<string, number>;
    byItemType: Record<string, number>;
  };
  throughput: {
    eventsPerMinute: number;
    webhooksPerMinute: number;
    retryRatePerMinute: number;
  };
  latency: {
    averageRetryDelay: number; // in ms
    p50RetryDelay: number;
    p95RetryDelay: number;
    p99RetryDelay: number;
  };
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export class RetryMetricsService {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    };
  }

  /**
   * Get comprehensive retry metrics
   */
  async getMetrics(): Promise<RetryMetrics> {
    const [retryQueueMetrics, deadLetterQueueMetrics, successRates, throughput, latency] = await Promise.all([
      this.getRetryQueueMetrics(),
      this.getDeadLetterQueueMetrics(),
      this.calculateSuccessRates(),
      this.calculateThroughput(),
      this.calculateLatencyMetrics()
    ]);

    return {
      retryQueue: retryQueueMetrics,
      deadLetterQueue: deadLetterQueueMetrics,
      successRates,
      throughput,
      latency
    };
  }

  /**
   * Get retry queue metrics
   */
  private async getRetryQueueMetrics() {
    const items = await RetryQueue.find();

    const metrics = {
      total: items.length,
      pending: 0,
      retrying: 0,
      succeeded: 0,
      failed: 0,
      averageAttempts: 0,
      oldestPendingItem: undefined as Date | undefined
    };

    let totalAttempts = 0;

    items.forEach(item => {
      metrics[item.status]++;
      totalAttempts += item.attemptCount;

      if (item.status === 'pending' && (!metrics.oldestPendingItem || item.nextRetryAt < metrics.oldestPendingItem)) {
        metrics.oldestPendingItem = item.nextRetryAt;
      }
    });

    metrics.averageAttempts = items.length > 0 ? totalAttempts / items.length : 0;

    return metrics;
  }

  /**
   * Get dead letter queue metrics
   */
  private async getDeadLetterQueueMetrics() {
    const items = await DeadLetterQueue.find();

    const metrics = {
      total: items.length,
      dead: 0,
      recovered: 0,
      archived: 0,
      errorDistribution: {} as Record<string, number>
    };

    items.forEach(item => {
      metrics[item.status]++;
      metrics.errorDistribution[item.errorType] = (metrics.errorDistribution[item.errorType] || 0) + 1;
    });

    return metrics;
  }

  /**
   * Calculate success rates
   */
  private async calculateSuccessRates() {
    const retryItems = await RetryQueue.find();
    const deadLetterItems = await DeadLetterQueue.find();

    const totalItems = retryItems.length + deadLetterItems.length;
    const succeededItems = retryItems.filter(item => item.status === 'succeeded').length;
    const recoveredItems = deadLetterItems.filter(item => item.status === 'recovered').length;

    const successfulItems = succeededItems + recoveredItems;

    const rates = {
      overall: totalItems > 0 ? (successfulItems / totalItems) * 100 : 0,
      byErrorType: {} as Record<string, number>,
      byItemType: {} as Record<string, number>
    };

    // Calculate success rate by error type
    const errorTypes = new Set([
      ...retryItems.map(i => i.errorType || 'unknown'),
      ...deadLetterItems.map(i => i.errorType)
    ]);

    errorTypes.forEach(errorType => {
      const total = [
        ...retryItems.filter(i => i.errorType === errorType),
        ...deadLetterItems.filter(i => i.errorType === errorType)
      ];
      const succeeded = [
        ...retryItems.filter(i => i.errorType === errorType && i.status === 'succeeded'),
        ...deadLetterItems.filter(i => i.errorType === errorType && i.status === 'recovered')
      ];

      rates.byErrorType[errorType] = total.length > 0 ? (succeeded.length / total.length) * 100 : 0;
    });

    // Calculate success rate by item type
    ['event', 'webhook'].forEach(itemType => {
      const total = [
        ...retryItems.filter(i => i.itemType === itemType),
        ...deadLetterItems.filter(i => i.itemType === itemType)
      ];
      const succeeded = [
        ...retryItems.filter(i => i.itemType === itemType && i.status === 'succeeded'),
        ...deadLetterItems.filter(i => i.itemType === itemType && i.status === 'recovered')
      ];

      rates.byItemType[itemType] = total.length > 0 ? (succeeded.length / total.length) * 100 : 0;
    });

    return rates;
  }

  /**
   * Calculate throughput metrics
   */
  private async calculateThroughput() {
    const oneHourAgo = new Date(Date.now() - 3600000);

    const [recentRetries, recentEvents, recentWebhooks] = await Promise.all([
      RetryQueue.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      RetryQueue.countDocuments({ createdAt: { $gte: oneHourAgo }, itemType: 'event' }),
      RetryQueue.countDocuments({ createdAt: { $gte: oneHourAgo }, itemType: 'webhook' })
    ]);

    return {
      eventsPerMinute: recentEvents / 60,
      webhooksPerMinute: recentWebhooks / 60,
      retryRatePerMinute: recentRetries / 60
    };
  }

  /**
   * Calculate latency metrics
   */
  private async calculateLatencyMetrics() {
    const succeededItems = await RetryQueue.find({ status: 'succeeded' }).sort({ updatedAt: -1 }).limit(1000);

    if (succeededItems.length === 0) {
      return {
        averageRetryDelay: 0,
        p50RetryDelay: 0,
        p95RetryDelay: 0,
        p99RetryDelay: 0
      };
    }

    const delays = succeededItems.map(item => {
      const created = item.createdAt.getTime();
      const completed = item.updatedAt.getTime();
      return completed - created;
    }).sort((a, b) => a - b);

    const sum = delays.reduce((acc, delay) => acc + delay, 0);
    const average = sum / delays.length;

    const p50Index = Math.floor(delays.length * 0.5);
    const p95Index = Math.floor(delays.length * 0.95);
    const p99Index = Math.floor(delays.length * 0.99);

    return {
      averageRetryDelay: average,
      p50RetryDelay: delays[p50Index] || 0,
      p95RetryDelay: delays[p95Index] || 0,
      p99RetryDelay: delays[p99Index] || 0
    };
  }

  /**
   * Get retry success rate over time
   */
  async getSuccessRateTimeSeries(hoursBack: number = 24): Promise<TimeSeriesDataPoint[]> {
    const dataPoints: TimeSeriesDataPoint[] = [];
    const now = Date.now();
    const hourMs = 3600000;

    for (let i = hoursBack; i > 0; i--) {
      const endTime = new Date(now - (i - 1) * hourMs);
      const startTime = new Date(now - i * hourMs);

      const [totalItems, succeededItems] = await Promise.all([
        RetryQueue.countDocuments({
          createdAt: { $gte: startTime, $lt: endTime }
        }),
        RetryQueue.countDocuments({
          createdAt: { $gte: startTime, $lt: endTime },
          status: 'succeeded'
        })
      ]);

      const successRate = totalItems > 0 ? (succeededItems / totalItems) * 100 : 0;

      dataPoints.push({
        timestamp: startTime,
        value: successRate,
        label: `${i}h ago`
      });
    }

    return dataPoints;
  }

  /**
   * Get error distribution over time
   */
  async getErrorDistributionTimeSeries(hoursBack: number = 24): Promise<Record<string, TimeSeriesDataPoint[]>> {
    const errorTypes = ['network', 'validation', 'timeout', 'rate_limit', 'server_error', 'unknown'];
    const result: Record<string, TimeSeriesDataPoint[]> = {};
    const now = Date.now();
    const hourMs = 3600000;

    for (const errorType of errorTypes) {
      result[errorType] = [];

      for (let i = hoursBack; i > 0; i--) {
        const endTime = new Date(now - (i - 1) * hourMs);
        const startTime = new Date(now - i * hourMs);

        const count = await RetryQueue.countDocuments({
          createdAt: { $gte: startTime, $lt: endTime },
          errorType
        });

        result[errorType].push({
          timestamp: startTime,
          value: count,
          label: `${i}h ago`
        });
      }
    }

    return result;
  }

  /**
   * Get retry attempts distribution
   */
  async getRetryAttemptsDistribution(): Promise<Record<number, number>> {
    const items = await RetryQueue.find();
    const distribution: Record<number, number> = {};

    items.forEach(item => {
      const attempts = item.attemptCount;
      distribution[attempts] = (distribution[attempts] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get top failing items
   */
  async getTopFailingItems(limit: number = 10): Promise<Array<{
    itemType: string;
    errorType: string;
    count: number;
    lastError: string;
  }>> {
    const items = await RetryQueue.find({ status: 'failed' })
      .sort({ attemptCount: -1 })
      .limit(limit);

    return items.map(item => ({
      itemType: item.itemType,
      errorType: item.errorType || 'unknown',
      count: item.attemptCount,
      lastError: item.lastError || 'No error message'
    }));
  }

  /**
   * Export metrics as JSON
   */
  async exportMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    const successRateTimeSeries = await this.getSuccessRateTimeSeries(24);
    const errorDistribution = await getErrorDistributionTimeSeries(24);
    const retryAttemptsDistribution = await this.getRetryAttemptsDistribution();
    const topFailingItems = await this.getTopFailingItems();

    const export_data = {
      timestamp: new Date().toISOString(),
      metrics,
      timeSeries: {
        successRate: successRateTimeSeries,
        errorDistribution
      },
      distribution: {
        retryAttempts: retryAttemptsDistribution
      },
      topFailingItems
    };

    return JSON.stringify(export_data, null, 2);
  }
}

export default new RetryMetricsService();
