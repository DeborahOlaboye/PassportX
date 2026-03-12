/**
 * Error analytics and metrics collection system
 */

import { logger } from '../logger';
import { PassportXError, ErrorCategory, ErrorSeverity } from './ErrorTypes';

export interface ErrorMetric {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  duration?: number;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<string, number>;
  errorsByComponent: Record<string, number>;
  errorTrends: Array<{
    timestamp: number;
    count: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }>;
  topErrors: Array<{
    code: string;
    message: string;
    count: number;
    lastOccurrence: number;
  }>;
  userImpact: {
    affectedUsers: number;
    affectedSessions: number;
    errorRate: number;
  };
  performanceImpact: {
    averageErrorDuration: number;
    slowestErrors: Array<{
      code: string;
      averageDuration: number;
      count: number;
    }>;
  };
}

export class ErrorAnalyticsCollector {
  private metrics: ErrorMetric[] = [];
  private maxMetrics = 10000;
  private retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  private analyticsInterval: NodeJS.Timeout | null = null;
  private onAnalyticsUpdate?: (analytics: ErrorAnalytics) => void;

  constructor(
    options: {
      maxMetrics?: number;
      retentionPeriod?: number;
      onAnalyticsUpdate?: (analytics: ErrorAnalytics) => void;
    } = {}
  ) {
    this.maxMetrics = options.maxMetrics || this.maxMetrics;
    this.retentionPeriod = options.retentionPeriod || this.retentionPeriod;
    this.onAnalyticsUpdate = options.onAnalyticsUpdate;

    // Start periodic cleanup and analytics generation
    this.startPeriodicTasks();
  }

  collectError(
    error: PassportXError,
    additionalData?: Record<string, unknown>
  ): void {
    const metric: ErrorMetric = {
      id: error.id,
      timestamp: Date.now(),
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      userAgent: error.context.userAgent,
      url: error.context.url,
      userId: error.context.userId,
      sessionId: error.context.sessionId,
      component: error.context.component,
      action: error.context.action,
      stackTrace: error.stackTrace,
      additionalData: {
        ...error.context.additionalData,
        ...additionalData,
      },
    };

    this.metrics.push(metric);

    // Maintain metrics size limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    logger.debug('Error metric collected', {
      errorId: error.id,
      category: error.category,
    });
  }

  generateAnalytics(timeRange?: {
    start: number;
    end: number;
  }): ErrorAnalytics {
    const now = Date.now();
    const filteredMetrics = this.metrics.filter((metric) => {
      if (timeRange) {
        return (
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end
        );
      }
      return metric.timestamp >= now - this.retentionPeriod;
    });

    const analytics: ErrorAnalytics = {
      totalErrors: filteredMetrics.length,
      errorsByCategory: this.groupByCategory(filteredMetrics),
      errorsBySeverity: this.groupBySeverity(filteredMetrics),
      errorsByCode: this.groupByCode(filteredMetrics),
      errorsByComponent: this.groupByComponent(filteredMetrics),
      errorTrends: this.generateErrorTrends(filteredMetrics),
      topErrors: this.getTopErrors(filteredMetrics),
      userImpact: this.calculateUserImpact(filteredMetrics),
      performanceImpact: this.calculatePerformanceImpact(filteredMetrics),
    };

    return analytics;
  }

  private groupByCategory(
    metrics: ErrorMetric[]
  ): Record<ErrorCategory, number> {
    const grouped = {} as Record<ErrorCategory, number>;

    for (const category of Object.values(ErrorCategory)) {
      grouped[category] = 0;
    }

    for (const metric of metrics) {
      grouped[metric.category]++;
    }

    return grouped;
  }

  private groupBySeverity(
    metrics: ErrorMetric[]
  ): Record<ErrorSeverity, number> {
    const grouped = {} as Record<ErrorSeverity, number>;

    for (const severity of Object.values(ErrorSeverity)) {
      grouped[severity] = 0;
    }

    for (const metric of metrics) {
      grouped[metric.severity]++;
    }

    return grouped;
  }

  private groupByCode(metrics: ErrorMetric[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const metric of metrics) {
      grouped[metric.code] = (grouped[metric.code] || 0) + 1;
    }

    return grouped;
  }

  private groupByComponent(metrics: ErrorMetric[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const metric of metrics) {
      if (metric.component) {
        grouped[metric.component] = (grouped[metric.component] || 0) + 1;
      }
    }

    return grouped;
  }

  private generateErrorTrends(metrics: ErrorMetric[]): Array<{
    timestamp: number;
    count: number;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }> {
    const hourlyBuckets = new Map<string, Map<string, number>>();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Create hourly buckets for the last 24 hours
    for (let i = 0; i < 24; i++) {
      const bucketTime = oneDayAgo + i * 60 * 60 * 1000;
      const bucketKey = Math.floor(bucketTime / (60 * 60 * 1000)).toString();
      hourlyBuckets.set(bucketKey, new Map());
    }

    // Fill buckets with error data
    for (const metric of metrics) {
      if (metric.timestamp >= oneDayAgo) {
        const bucketKey = Math.floor(
          metric.timestamp / (60 * 60 * 1000)
        ).toString();
        const bucket = hourlyBuckets.get(bucketKey);

        if (bucket) {
          const errorKey = `${metric.category}:${metric.severity}`;
          bucket.set(errorKey, (bucket.get(errorKey) || 0) + 1);
        }
      }
    }

    // Convert to trend data
    const trends: Array<{
      timestamp: number;
      count: number;
      category: ErrorCategory;
      severity: ErrorSeverity;
    }> = [];

    for (const [bucketKey, bucket] of hourlyBuckets) {
      const timestamp = parseInt(bucketKey) * 60 * 60 * 1000;

      for (const [errorKey, count] of bucket) {
        const [category, severity] = errorKey.split(':') as [
          ErrorCategory,
          ErrorSeverity
        ];
        trends.push({ timestamp, count, category, severity });
      }
    }

    return trends.sort((a, b) => a.timestamp - b.timestamp);
  }

  private getTopErrors(metrics: ErrorMetric[]): Array<{
    code: string;
    message: string;
    count: number;
    lastOccurrence: number;
  }> {
    const errorCounts = new Map<
      string,
      {
        message: string;
        count: number;
        lastOccurrence: number;
      }
    >();

    for (const metric of metrics) {
      const existing = errorCounts.get(metric.code);

      if (existing) {
        existing.count++;
        existing.lastOccurrence = Math.max(
          existing.lastOccurrence,
          metric.timestamp
        );
      } else {
        errorCounts.set(metric.code, {
          message: metric.message,
          count: 1,
          lastOccurrence: metric.timestamp,
        });
      }
    }

    return Array.from(errorCounts.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateUserImpact(metrics: ErrorMetric[]): {
    affectedUsers: number;
    affectedSessions: number;
    errorRate: number;
  } {
    const uniqueUsers = new Set<string>();
    const uniqueSessions = new Set<string>();
    let totalInteractions = 0;

    for (const metric of metrics) {
      if (metric.userId) {
        uniqueUsers.add(metric.userId);
      }
      if (metric.sessionId) {
        uniqueSessions.add(metric.sessionId);
      }
      totalInteractions++;
    }

    // Estimate total interactions (this would come from other analytics in a real system)
    const estimatedTotalInteractions = totalInteractions * 10; // Rough estimate
    const errorRate = totalInteractions / estimatedTotalInteractions;

    return {
      affectedUsers: uniqueUsers.size,
      affectedSessions: uniqueSessions.size,
      errorRate: Math.min(errorRate, 1),
    };
  }

  private calculatePerformanceImpact(metrics: ErrorMetric[]): {
    averageErrorDuration: number;
    slowestErrors: Array<{
      code: string;
      averageDuration: number;
      count: number;
    }>;
  } {
    const metricsWithDuration = metrics.filter((m) => m.duration !== undefined);
    const totalDuration = metricsWithDuration.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );
    const averageErrorDuration =
      metricsWithDuration.length > 0
        ? totalDuration / metricsWithDuration.length
        : 0;

    // Group by error code and calculate average duration
    const durationByCode = new Map<
      string,
      { totalDuration: number; count: number }
    >();

    for (const metric of metricsWithDuration) {
      const existing = durationByCode.get(metric.code);
      const duration = metric.duration || 0;

      if (existing) {
        existing.totalDuration += duration;
        existing.count++;
      } else {
        durationByCode.set(metric.code, { totalDuration: duration, count: 1 });
      }
    }

    const slowestErrors = Array.from(durationByCode.entries())
      .map(([code, data]) => ({
        code,
        averageDuration: data.totalDuration / data.count,
        count: data.count,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    return {
      averageErrorDuration,
      slowestErrors,
    };
  }

  private startPeriodicTasks(): void {
    // Run cleanup and analytics generation every 5 minutes
    this.analyticsInterval = setInterval(() => {
      this.cleanupOldMetrics();

      if (this.onAnalyticsUpdate) {
        const analytics = this.generateAnalytics();
        this.onAnalyticsUpdate(analytics);
      }
    }, 5 * 60 * 1000);
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.retentionPeriod;
    const initialLength = this.metrics.length;

    this.metrics = this.metrics.filter(
      (metric) => metric.timestamp >= cutoffTime
    );

    const removedCount = initialLength - this.metrics.length;
    if (removedCount > 0) {
      logger.debug('Cleaned up old error metrics', {
        removedCount,
        remaining: this.metrics.length,
      });
    }
  }

  getMetrics(filters?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    timeRange?: { start: number; end: number };
  }): ErrorMetric[] {
    let filteredMetrics = this.metrics;

    if (filters) {
      if (filters.category) {
        filteredMetrics = filteredMetrics.filter(
          (m) => m.category === filters.category
        );
      }

      if (filters.severity) {
        filteredMetrics = filteredMetrics.filter(
          (m) => m.severity === filters.severity
        );
      }

      if (filters.timeRange) {
        filteredMetrics = filteredMetrics.filter(
          (m) =>
            m.timestamp >= filters.timeRange!.start &&
            m.timestamp <= filters.timeRange!.end
        );
      }
    }

    return filteredMetrics;
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'id',
        'timestamp',
        'category',
        'severity',
        'code',
        'message',
        'userAgent',
        'url',
        'userId',
        'sessionId',
        'component',
        'action',
      ];

      const csvRows = [
        headers.join(','),
        ...this.metrics.map((metric) =>
          headers
            .map((header) => {
              const value = metric[header as keyof ErrorMetric];
              return typeof value === 'string'
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(',')
        ),
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  clearMetrics(): void {
    this.metrics = [];
    logger.info('Error metrics cleared');
  }

  destroy(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }
  }
}

// Global error analytics collector
export const errorAnalytics = new ErrorAnalyticsCollector({
  onAnalyticsUpdate: (analytics) => {
    logger.info('Error analytics updated', {
      totalErrors: analytics.totalErrors,
      errorRate: analytics.userImpact.errorRate,
      topErrorCode: analytics.topErrors[0]?.code,
    });
  },
});
