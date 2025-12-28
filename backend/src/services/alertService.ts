import Alert from '../models/Alert'
import { IAlert } from '../types'

export interface CreateAlertOptions {
  type: 'performance' | 'connection' | 'failed_event' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
}

export interface AlertThresholds {
  performanceThreshold?: number
  failureRateThreshold?: number
  connectionTimeoutThreshold?: number
  maxConsecutiveFailures?: number
}

export class AlertService {
  private logger: any
  private thresholds: AlertThresholds

  constructor(thresholds?: AlertThresholds, logger?: any) {
    this.logger = logger || this.getDefaultLogger()
    this.thresholds = {
      performanceThreshold: thresholds?.performanceThreshold || 5000,
      failureRateThreshold: thresholds?.failureRateThreshold || 10,
      connectionTimeoutThreshold: thresholds?.connectionTimeoutThreshold || 30000,
      maxConsecutiveFailures: thresholds?.maxConsecutiveFailures || 5
    }
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[AlertService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[AlertService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[AlertService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[AlertService] ${msg}`, ...args)
    }
  }

  async createAlert(options: CreateAlertOptions): Promise<IAlert | null> {
    try {
      const alert = await Alert.create({
        type: options.type,
        severity: options.severity,
        message: options.message,
        details: options.details,
        resolved: false,
        createdAt: new Date()
      })

      this.logger.warn(`Alert created: ${options.type} - ${options.severity}`, {
        message: options.message
      })

      return alert
    } catch (error) {
      this.logger.error('Failed to create alert', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async checkPerformanceAnomaly(
    averageProcessingTime: number,
    eventsFailed: number,
    eventsProcessed: number
  ): Promise<boolean> {
    let anomalyDetected = false

    if (averageProcessingTime > (this.thresholds.performanceThreshold || 5000)) {
      await this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `High event processing time detected: ${averageProcessingTime.toFixed(2)}ms`,
        details: {
          averageProcessingTime,
          threshold: this.thresholds.performanceThreshold
        }
      })
      anomalyDetected = true
    }

    if (eventsProcessed > 0) {
      const failureRate = (eventsFailed / eventsProcessed) * 100
      if (failureRate > (this.thresholds.failureRateThreshold || 10)) {
        await this.createAlert({
          type: 'anomaly',
          severity: 'high',
          message: `High failure rate detected: ${failureRate.toFixed(2)}%`,
          details: {
            failureRate,
            eventsFailed,
            eventsProcessed,
            threshold: this.thresholds.failureRateThreshold
          }
        })
        anomalyDetected = true
      }
    }

    return anomalyDetected
  }

  async checkConnectionAnomaly(
    isConnected: boolean,
    failedAttempts: number
  ): Promise<boolean> {
    if (!isConnected) {
      if (failedAttempts >= (this.thresholds.maxConsecutiveFailures || 5)) {
        await this.createAlert({
          type: 'connection',
          severity: 'critical',
          message: `Connection lost with ${failedAttempts} consecutive failures`,
          details: {
            failedAttempts,
            threshold: this.thresholds.maxConsecutiveFailures
          }
        })
        return true
      }
    }

    return false
  }

  async resolveAlert(alertId: string): Promise<IAlert | null> {
    try {
      const alert = await Alert.findByIdAndUpdate(
        alertId,
        {
          resolved: true,
          resolvedAt: new Date()
        },
        { new: true }
      )

      if (alert) {
        this.logger.info('Alert resolved', { alertId })
      }

      return alert
    } catch (error) {
      this.logger.error('Failed to resolve alert', {
        alertId,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async getUnresolvedAlerts(limit: number = 50): Promise<IAlert[]> {
    try {
      return await Alert.find({ resolved: false })
        .sort({ createdAt: -1 })
        .limit(limit)
    } catch (error) {
      this.logger.error('Failed to get unresolved alerts', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getAlertsBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 50
  ): Promise<IAlert[]> {
    try {
      return await Alert.find({ severity, resolved: false })
        .sort({ createdAt: -1 })
        .limit(limit)
    } catch (error) {
      this.logger.error('Failed to get alerts by severity', {
        severity,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getAlertsByType(
    type: 'performance' | 'connection' | 'failed_event' | 'anomaly',
    limit: number = 50
  ): Promise<IAlert[]> {
    try {
      return await Alert.find({ type, resolved: false })
        .sort({ createdAt: -1 })
        .limit(limit)
    } catch (error) {
      this.logger.error('Failed to get alerts by type', {
        type,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getRecentAlerts(hours: number = 1, limit: number = 50): Promise<IAlert[]> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      return await Alert.find({
        createdAt: { $gte: startTime }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
    } catch (error) {
      this.logger.error('Failed to get recent alerts', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getCriticalAlerts(): Promise<IAlert[]> {
    return this.getAlertsBySeverity('critical', 100)
  }

  async getAlertCount(resolved?: boolean): Promise<number> {
    try {
      const query = resolved !== undefined ? { resolved } : {}
      return await Alert.countDocuments(query)
    } catch (error) {
      this.logger.error('Failed to get alert count', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  async clearResolvedAlerts(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await Alert.deleteMany({
        resolved: true,
        resolvedAt: { $lt: cutoffDate }
      })

      this.logger.info('Resolved alerts cleared', {
        deletedCount: result.deletedCount,
        cutoffDate
      })

      return result.deletedCount || 0
    } catch (error) {
      this.logger.error('Failed to clear resolved alerts', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }
}

export default AlertService
