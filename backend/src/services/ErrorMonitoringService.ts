import mongoose from 'mongoose';
import { DeadLetterQueue } from '../models/DeadLetterQueue';
import { RetryQueue } from '../models/RetryQueue';
import CircuitBreakerRegistry from './CircuitBreakerService';

/**
 * ErrorMonitoringService
 *
 * Monitors error rates, tracks metrics, and generates alerts for error conditions.
 */

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number; // errors per minute
  errorsByType: Record<string, number>;
  errorsByService: Record<string, number>;
  criticalErrors: number;
  recentErrors: Array<{
    timestamp: Date;
    type: string;
    message: string;
    service: string;
  }>;
}

export interface AlertThreshold {
  metric: 'error_rate' | 'dead_letter_queue_size' | 'circuit_breaker_open' | 'retry_queue_size';
  threshold: number;
  window: number; // time window in ms
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ErrorMonitoringService {
  private errorHistory: Array<{
    timestamp: Date;
    type: string;
    message: string;
    service: string;
  }> = [];

  private alerts: Alert[] = [];
  private alertThresholds: AlertThreshold[] = [
    {
      metric: 'error_rate',
      threshold: 10, // 10 errors per minute
      window: 60000,
      severity: 'high'
    },
    {
      metric: 'dead_letter_queue_size',
      threshold: 100,
      window: 300000, // 5 minutes
      severity: 'critical'
    },
    {
      metric: 'circuit_breaker_open',
      threshold: 3, // 3 or more circuit breakers open
      window: 60000,
      severity: 'critical'
    },
    {
      metric: 'retry_queue_size',
      threshold: 500,
      window: 300000,
      severity: 'medium'
    }
  ];

  private monitoringInterval?: NodeJS.Timeout;
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
   * Start monitoring for errors and alerting
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.logger.warn('Monitoring already started');
      return;
    }

    this.logger.info('Starting error monitoring');
    this.monitoringInterval = setInterval(async () => {
      await this.checkThresholds();
      this.cleanupOldErrors();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.logger.info('Error monitoring stopped');
    }
  }

  /**
   * Record an error
   */
  recordError(type: string, message: string, service: string, metadata?: Record<string, any>): void {
    this.errorHistory.push({
      timestamp: new Date(),
      type,
      message,
      service
    });

    this.logger.error(`Error recorded: [${service}] ${type} - ${message}`, metadata);

    // Keep only last 1000 errors in memory
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  /**
   * Get current error metrics
   */
  async getMetrics(windowMs: number = 60000): Promise<ErrorMetrics> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentErrors = this.errorHistory.filter(
      err => err.timestamp.getTime() > windowStart
    );

    const errorsByType: Record<string, number> = {};
    const errorsByService: Record<string, number> = {};
    let criticalErrors = 0;

    recentErrors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;

      if (error.type.includes('critical') || error.type.includes('fatal')) {
        criticalErrors++;
      }
    });

    const errorRate = (recentErrors.length / windowMs) * 60000; // errors per minute

    return {
      totalErrors: recentErrors.length,
      errorRate,
      errorsByType,
      errorsByService,
      criticalErrors,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Check all alert thresholds
   */
  private async checkThresholds(): Promise<void> {
    for (const threshold of this.alertThresholds) {
      try {
        await this.checkThreshold(threshold);
      } catch (error) {
        this.logger.error('Error checking threshold', error);
      }
    }
  }

  /**
   * Check individual threshold
   */
  private async checkThreshold(threshold: AlertThreshold): Promise<void> {
    let currentValue = 0;
    let shouldAlert = false;
    let message = '';

    switch (threshold.metric) {
      case 'error_rate':
        const metrics = await this.getMetrics(threshold.window);
        currentValue = metrics.errorRate;
        shouldAlert = currentValue > threshold.threshold;
        message = `Error rate is ${currentValue.toFixed(2)} errors/minute (threshold: ${threshold.threshold})`;
        break;

      case 'dead_letter_queue_size':
        currentValue = await DeadLetterQueue.countDocuments({ status: 'dead' });
        shouldAlert = currentValue > threshold.threshold;
        message = `Dead letter queue has ${currentValue} items (threshold: ${threshold.threshold})`;
        break;

      case 'circuit_breaker_open':
        const allBreakers = CircuitBreakerRegistry.getAllBreakers();
        const openBreakers = allBreakers.filter(b => b.getState() === 'OPEN');
        currentValue = openBreakers.length;
        shouldAlert = currentValue >= threshold.threshold;
        message = `${currentValue} circuit breakers are open (threshold: ${threshold.threshold})`;
        break;

      case 'retry_queue_size':
        currentValue = await RetryQueue.countDocuments({ status: { $in: ['pending', 'retrying'] } });
        shouldAlert = currentValue > threshold.threshold;
        message = `Retry queue has ${currentValue} pending items (threshold: ${threshold.threshold})`;
        break;
    }

    if (shouldAlert) {
      this.createAlert(threshold.metric, threshold.severity, message, {
        currentValue,
        threshold: threshold.threshold
      });
    }
  }

  /**
   * Create an alert
   */
  private createAlert(type: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string, metadata?: Record<string, any>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata
    };

    this.alerts.push(alert);
    this.logger.warn(`ALERT [${severity.toUpperCase()}]: ${message}`, metadata);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // TODO: Send notification (email, slack, etc.)
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 50, severity?: 'low' | 'medium' | 'high' | 'critical'): Alert[] {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts.slice(-limit).reverse();
  }

  /**
   * Clear old errors from memory
   */
  private cleanupOldErrors(maxAgeMs: number = 3600000): void {
    const cutoff = Date.now() - maxAgeMs;
    this.errorHistory = this.errorHistory.filter(
      err => err.timestamp.getTime() > cutoff
    );
  }

  /**
   * Get error statistics
   */
  async getStatistics(): Promise<{
    errorHistory: ErrorMetrics;
    deadLetterQueueSize: number;
    retryQueueSize: number;
    circuitBreakerStats: Record<string, any>;
    recentAlerts: Alert[];
  }> {
    const metrics = await this.getMetrics(3600000); // Last hour
    const dlqSize = await DeadLetterQueue.countDocuments({ status: 'dead' });
    const retryQueueSize = await RetryQueue.countDocuments({ status: { $in: ['pending', 'retrying'] } });
    const circuitBreakerStats = CircuitBreakerRegistry.getAllStats();

    return {
      errorHistory: metrics,
      deadLetterQueueSize: dlqSize,
      retryQueueSize,
      circuitBreakerStats,
      recentAlerts: this.getAlerts(10)
    };
  }

  /**
   * Add custom alert threshold
   */
  addAlertThreshold(threshold: AlertThreshold): void {
    this.alertThresholds.push(threshold);
    this.logger.info('Added custom alert threshold', threshold);
  }

  /**
   * Remove alert threshold
   */
  removeAlertThreshold(metric: string): void {
    this.alertThresholds = this.alertThresholds.filter(t => t.metric !== metric);
    this.logger.info(`Removed alert threshold for ${metric}`);
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: ErrorMetrics;
  }> {
    const metrics = await this.getMetrics(300000); // Last 5 minutes
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    if (metrics.errorRate > 10) {
      issues.push(`High error rate: ${metrics.errorRate.toFixed(2)} errors/minute`);
      status = 'degraded';
    }

    if (metrics.errorRate > 50) {
      status = 'unhealthy';
    }

    // Check critical errors
    if (metrics.criticalErrors > 0) {
      issues.push(`${metrics.criticalErrors} critical errors detected`);
      status = 'unhealthy';
    }

    // Check circuit breakers
    const allBreakers = CircuitBreakerRegistry.getAllBreakers();
    const openBreakers = allBreakers.filter(b => b.getState() === 'OPEN');
    if (openBreakers.length > 0) {
      issues.push(`${openBreakers.length} circuit breakers are open`);
      if (openBreakers.length >= 3) {
        status = 'unhealthy';
      } else {
        status = status === 'healthy' ? 'degraded' : status;
      }
    }

    // Check dead letter queue
    const dlqSize = await DeadLetterQueue.countDocuments({ status: 'dead' });
    if (dlqSize > 100) {
      issues.push(`Dead letter queue has ${dlqSize} items`);
      status = status === 'healthy' ? 'degraded' : status;
    }

    return {
      status,
      issues,
      metrics
    };
  }
}

export default new ErrorMonitoringService();
