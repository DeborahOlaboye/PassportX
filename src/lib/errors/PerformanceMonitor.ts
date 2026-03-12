/**
 * Performance monitoring for error-prone operations
 */

import { logger } from '../logger';
import { errorHandler } from './ErrorHandler';
import { SystemError } from './ErrorTypes';

export interface PerformanceMetric {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: Error;
  metadata?: Record<string, unknown>;
  memoryUsage?: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: NodeJS.MemoryUsage;
  };
  resourceUsage?: {
    cpuUsage?: NodeJS.CpuUsage;
    networkRequests?: number;
    databaseQueries?: number;
  };
}

export interface PerformanceThreshold {
  operationName: string;
  maxDuration: number;
  maxMemoryIncrease: number;
  maxErrorRate: number;
  sampleSize: number;
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  operationName: string;
  alertType: 'duration' | 'memory' | 'error_rate' | 'resource_leak';
  severity: 'warning' | 'critical';
  message: string;
  metrics: PerformanceMetric[];
  threshold: PerformanceThreshold;
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>();
  private thresholds = new Map<string, PerformanceThreshold>();
  private activeOperations = new Map<
    string,
    {
      startTime: number;
      startMemory: NodeJS.MemoryUsage;
      startCpuUsage?: NodeJS.CpuUsage;
      metadata?: Record<string, unknown>;
    }
  >();
  private alerts: PerformanceAlert[] = [];
  private maxMetricsPerOperation = 1000;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    options: {
      maxMetricsPerOperation?: number;
      cleanupInterval?: number;
    } = {}
  ) {
    this.maxMetricsPerOperation = options.maxMetricsPerOperation || 1000;

    // Start periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, options.cleanupInterval || 5 * 60 * 1000); // 5 minutes
  }

  setThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.set(threshold.operationName, threshold);
    logger.debug('Performance threshold set', {
      operationName: threshold.operationName,
      maxDuration: threshold.maxDuration,
      maxErrorRate: threshold.maxErrorRate,
    });
  }

  startOperation(
    operationName: string,
    metadata?: Record<string, unknown>
  ): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      startCpuUsage: process.cpuUsage(),
      metadata,
    });

    return operationId;
  }

  endOperation(operationId: string, error?: Error): PerformanceMetric | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      logger.warn('Attempted to end unknown operation', { operationId });
      return null;
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpuUsage = process.cpuUsage(operation.startCpuUsage);

    const operationName = operationId.split('_')[0];
    const duration = endTime - operation.startTime;

    const metric: PerformanceMetric = {
      operationName,
      startTime: operation.startTime,
      endTime,
      duration,
      success: !error,
      error,
      metadata: operation.metadata,
      memoryUsage: {
        before: operation.startMemory,
        after: endMemory,
        delta: {
          rss: endMemory.rss - operation.startMemory.rss,
          heapTotal: endMemory.heapTotal - operation.startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - operation.startMemory.heapUsed,
          external: endMemory.external - operation.startMemory.external,
          arrayBuffers:
            endMemory.arrayBuffers - operation.startMemory.arrayBuffers,
        },
      },
      resourceUsage: {
        cpuUsage: endCpuUsage,
      },
    };

    // Store the metric
    this.storeMetric(metric);

    // Check thresholds
    this.checkThresholds(operationName);

    // Clean up active operation
    this.activeOperations.delete(operationId);

    logger.debug('Operation completed', {
      operationName,
      duration,
      success: metric.success,
      memoryDelta: metric.memoryUsage.delta.heapUsed,
    });

    return metric;
  }

  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const operationId = this.startOperation(operationName, metadata);

    try {
      const result = await operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId, error as Error);
      throw error;
    }
  }

  monitorSync<T>(
    operationName: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const operationId = this.startOperation(operationName, metadata);

    try {
      const result = operation();
      this.endOperation(operationId);
      return result;
    } catch (error) {
      this.endOperation(operationId, error as Error);
      throw error;
    }
  }

  private storeMetric(metric: PerformanceMetric): void {
    const operationMetrics = this.metrics.get(metric.operationName) || [];
    operationMetrics.push(metric);

    // Limit the number of stored metrics
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift(); // Remove oldest metric
    }

    this.metrics.set(metric.operationName, operationMetrics);
  }

  private checkThresholds(operationName: string): void {
    const threshold = this.thresholds.get(operationName);
    if (!threshold) return;

    const metrics = this.metrics.get(operationName) || [];
    if (metrics.length < threshold.sampleSize) return;

    const recentMetrics = metrics.slice(-threshold.sampleSize);

    // Check duration threshold
    this.checkDurationThreshold(operationName, recentMetrics, threshold);

    // Check memory threshold
    this.checkMemoryThreshold(operationName, recentMetrics, threshold);

    // Check error rate threshold
    this.checkErrorRateThreshold(operationName, recentMetrics, threshold);

    // Check for resource leaks
    this.checkResourceLeaks(operationName, recentMetrics, threshold);
  }

  private checkDurationThreshold(
    operationName: string,
    metrics: PerformanceMetric[],
    threshold: PerformanceThreshold
  ): void {
    const averageDuration =
      metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    const maxDuration = Math.max(...metrics.map((m) => m.duration));

    if (
      averageDuration > threshold.maxDuration ||
      maxDuration > threshold.maxDuration * 2
    ) {
      const alert: PerformanceAlert = {
        id: `duration_${operationName}_${Date.now()}`,
        timestamp: Date.now(),
        operationName,
        alertType: 'duration',
        severity:
          maxDuration > threshold.maxDuration * 2 ? 'critical' : 'warning',
        message: `Operation ${operationName} exceeded duration threshold. Average: ${averageDuration.toFixed(
          2
        )}ms, Max: ${maxDuration}ms, Threshold: ${threshold.maxDuration}ms`,
        metrics: metrics.filter((m) => m.duration > threshold.maxDuration),
        threshold,
      };

      this.triggerAlert(alert);
    }
  }

  private checkMemoryThreshold(
    operationName: string,
    metrics: PerformanceMetric[],
    threshold: PerformanceThreshold
  ): void {
    const memoryIncreases = metrics
      .filter((m) => m.memoryUsage?.delta.heapUsed)
      .map((m) => m.memoryUsage!.delta.heapUsed);

    if (memoryIncreases.length === 0) return;

    const averageIncrease =
      memoryIncreases.reduce((sum, inc) => sum + inc, 0) /
      memoryIncreases.length;
    const maxIncrease = Math.max(...memoryIncreases);

    if (
      averageIncrease > threshold.maxMemoryIncrease ||
      maxIncrease > threshold.maxMemoryIncrease * 2
    ) {
      const alert: PerformanceAlert = {
        id: `memory_${operationName}_${Date.now()}`,
        timestamp: Date.now(),
        operationName,
        alertType: 'memory',
        severity:
          maxIncrease > threshold.maxMemoryIncrease * 2
            ? 'critical'
            : 'warning',
        message: `Operation ${operationName} exceeded memory threshold. Average increase: ${(
          averageIncrease /
          1024 /
          1024
        ).toFixed(2)}MB, Max: ${(maxIncrease / 1024 / 1024).toFixed(
          2
        )}MB, Threshold: ${(threshold.maxMemoryIncrease / 1024 / 1024).toFixed(
          2
        )}MB`,
        metrics: metrics.filter(
          (m) =>
            m.memoryUsage &&
            m.memoryUsage.delta.heapUsed > threshold.maxMemoryIncrease
        ),
        threshold,
      };

      this.triggerAlert(alert);
    }
  }

  private checkErrorRateThreshold(
    operationName: string,
    metrics: PerformanceMetric[],
    threshold: PerformanceThreshold
  ): void {
    const errorCount = metrics.filter((m) => !m.success).length;
    const errorRate = errorCount / metrics.length;

    if (errorRate > threshold.maxErrorRate) {
      const alert: PerformanceAlert = {
        id: `error_rate_${operationName}_${Date.now()}`,
        timestamp: Date.now(),
        operationName,
        alertType: 'error_rate',
        severity:
          errorRate > threshold.maxErrorRate * 2 ? 'critical' : 'warning',
        message: `Operation ${operationName} exceeded error rate threshold. Error rate: ${(
          errorRate * 100
        ).toFixed(2)}%, Threshold: ${(threshold.maxErrorRate * 100).toFixed(
          2
        )}%`,
        metrics: metrics.filter((m) => !m.success),
        threshold,
      };

      this.triggerAlert(alert);
    }
  }

  private checkResourceLeaks(
    operationName: string,
    metrics: PerformanceMetric[],
    threshold: PerformanceThreshold
  ): void {
    // Check for consistent memory growth (potential leak)
    const memoryGrowth = metrics
      .filter((m) => m.memoryUsage?.delta.heapUsed)
      .map((m) => m.memoryUsage!.delta.heapUsed);

    if (memoryGrowth.length < 10) return; // Need enough samples

    // Check if memory consistently grows
    const positiveGrowthCount = memoryGrowth.filter(
      (growth) => growth > 0
    ).length;
    const growthRatio = positiveGrowthCount / memoryGrowth.length;

    if (growthRatio > 0.8) {
      // 80% of operations cause memory growth
      const totalGrowth = memoryGrowth.reduce(
        (sum, growth) => sum + Math.max(0, growth),
        0
      );

      const alert: PerformanceAlert = {
        id: `resource_leak_${operationName}_${Date.now()}`,
        timestamp: Date.now(),
        operationName,
        alertType: 'resource_leak',
        severity: 'critical',
        message: `Potential memory leak detected in ${operationName}. ${(
          growthRatio * 100
        ).toFixed(1)}% of operations cause memory growth. Total growth: ${(
          totalGrowth /
          1024 /
          1024
        ).toFixed(2)}MB`,
        metrics: metrics.slice(-10), // Last 10 metrics
        threshold,
      };

      this.triggerAlert(alert);
    }
  }

  private triggerAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    logger.warn('Performance alert triggered', {
      alertId: alert.id,
      operationName: alert.operationName,
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
    });

    // Report critical alerts as errors
    if (alert.severity === 'critical') {
      errorHandler.handleError(
        new SystemError(
          alert.message,
          `PERFORMANCE_${alert.alertType.toUpperCase()}`,
          {
            component: 'PerformanceMonitor',
            action: alert.operationName,
            additionalData: {
              alertType: alert.alertType,
              metricsCount: alert.metrics.length,
            },
          }
        )
      );
    }

    // Notify callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Error in performance alert callback', { error });
      }
    }
  }

  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  getMetrics(operationName?: string): PerformanceMetric[] {
    if (operationName) {
      return this.metrics.get(operationName) || [];
    }

    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    return allMetrics.sort((a, b) => b.startTime - a.startTime);
  }

  getAlerts(operationName?: string): PerformanceAlert[] {
    if (operationName) {
      return this.alerts.filter(
        (alert) => alert.operationName === operationName
      );
    }

    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  getOperationStats(operationName: string): {
    totalOperations: number;
    successRate: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    averageMemoryIncrease: number;
    alertCount: number;
  } | null {
    const metrics = this.metrics.get(operationName);
    if (!metrics || metrics.length === 0) return null;

    const successfulOperations = metrics.filter((m) => m.success);
    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const memoryIncreases = metrics
      .filter((m) => m.memoryUsage?.delta.heapUsed)
      .map((m) => m.memoryUsage!.delta.heapUsed);

    return {
      totalOperations: metrics.length,
      successRate: successfulOperations.length / metrics.length,
      averageDuration:
        durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      averageMemoryIncrease:
        memoryIncreases.length > 0
          ? memoryIncreases.reduce((sum, inc) => sum + inc, 0) /
            memoryIncreases.length
          : 0,
      alertCount: this.alerts.filter((a) => a.operationName === operationName)
        .length,
    };
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let totalRemoved = 0;

    for (const [operationName, metrics] of this.metrics) {
      const filteredMetrics = metrics.filter((m) => m.startTime >= oneHourAgo);
      const removedCount = metrics.length - filteredMetrics.length;

      if (removedCount > 0) {
        this.metrics.set(operationName, filteredMetrics);
        totalRemoved += removedCount;
      }
    }

    // Clean up old alerts
    this.alerts = this.alerts.filter((alert) => alert.timestamp >= oneHourAgo);

    if (totalRemoved > 0) {
      logger.debug('Cleaned up old performance metrics', {
        removedCount: totalRemoved,
      });
    }
  }

  clearMetrics(operationName?: string): void {
    if (operationName) {
      this.metrics.delete(operationName);
      this.alerts = this.alerts.filter(
        (alert) => alert.operationName !== operationName
      );
    } else {
      this.metrics.clear();
      this.alerts = [];
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.metrics.clear();
    this.alerts = [];
    this.alertCallbacks = [];
    this.activeOperations.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Set up common thresholds
performanceMonitor.setThreshold({
  operationName: 'badge-minting',
  maxDuration: 5000, // 5 seconds
  maxMemoryIncrease: 50 * 1024 * 1024, // 50MB
  maxErrorRate: 0.05, // 5%
  sampleSize: 10,
});

performanceMonitor.setThreshold({
  operationName: 'community-creation',
  maxDuration: 3000, // 3 seconds
  maxMemoryIncrease: 30 * 1024 * 1024, // 30MB
  maxErrorRate: 0.03, // 3%
  sampleSize: 10,
});

performanceMonitor.setThreshold({
  operationName: 'api-request',
  maxDuration: 2000, // 2 seconds
  maxMemoryIncrease: 10 * 1024 * 1024, // 10MB
  maxErrorRate: 0.1, // 10%
  sampleSize: 20,
});

// Utility decorators for automatic monitoring
export function monitored(
  operationName?: string
): (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const opName =
      operationName ||
      `${target?.constructor?.name || 'Unknown'}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.monitorOperation(opName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
