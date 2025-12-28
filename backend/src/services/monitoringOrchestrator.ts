import ChainhookEventLogger from './chainhookEventLogger'
import MetricsTracker from './metricsTracker'
import HealthMonitor from './healthMonitor'
import AlertService from './alertService'

export interface MonitoringConfig {
  nodeUrl: string
  healthCheckInterval?: number
  metricsInterval?: number
  logRetentionDays?: number
  alertThresholds?: {
    performanceThreshold?: number
    failureRateThreshold?: number
    maxConsecutiveFailures?: number
  }
}

export class MonitoringOrchestrator {
  private eventLogger: ChainhookEventLogger
  private metricsTracker: MetricsTracker
  private healthMonitor: HealthMonitor
  private alertService: AlertService
  private logger: any

  private healthCheckInterval?: NodeJS.Timeout
  private metricsInterval?: NodeJS.Timeout
  private anomalyCheckInterval?: NodeJS.Timeout

  private config: MonitoringConfig

  constructor(config: MonitoringConfig, logger?: any) {
    this.logger = logger || this.getDefaultLogger()
    this.config = config

    this.eventLogger = new ChainhookEventLogger(this.logger)
    this.metricsTracker = new MetricsTracker(this.logger)
    this.healthMonitor = new HealthMonitor(this.logger)
    this.alertService = new AlertService(config.alertThresholds, this.logger)
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[MonitoringOrchestrator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[MonitoringOrchestrator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[MonitoringOrchestrator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[MonitoringOrchestrator] ${msg}`, ...args)
    }
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing monitoring system', {
      nodeUrl: this.config.nodeUrl
    })

    try {
      await this.startHealthChecks()
      await this.startMetricsCollection()
      await this.startAnomalyDetection()

      this.logger.info('Monitoring system initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize monitoring system', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  private async startHealthChecks(): Promise<void> {
    const interval = this.config.healthCheckInterval || 30000

    await this.healthMonitor.checkHealth({
      nodeUrl: this.config.nodeUrl
    })

    this.healthCheckInterval = setInterval(async () => {
      const result = await this.healthMonitor.checkHealth({
        nodeUrl: this.config.nodeUrl
      })

      if (!result.isConnected) {
        const health = await this.healthMonitor.getHealthStatus(this.config.nodeUrl)
        if (health && health.failedAttempts >= (this.config.alertThresholds?.maxConsecutiveFailures || 5)) {
          await this.alertService.createAlert({
            type: 'connection',
            severity: 'critical',
            message: `Connection to Chainhook node lost (${health.failedAttempts} failed attempts)`,
            details: {
              nodeUrl: this.config.nodeUrl,
              failedAttempts: health.failedAttempts
            }
          })
        }
      }
    }, interval)

    this.logger.info('Health checks started', { interval })
  }

  private async startMetricsCollection(): Promise<void> {
    const interval = this.config.metricsInterval || 60000

    this.metricsInterval = setInterval(async () => {
      const health = await this.healthMonitor.getHealthStatus(this.config.nodeUrl)
      const connectionStatus = health?.isConnected ? 'connected' : 'disconnected'

      await this.metricsTracker.saveMetrics(connectionStatus)

      this.logger.debug('Metrics saved', {
        connectionStatus
      })
    }, interval)

    this.logger.info('Metrics collection started', { interval })
  }

  private async startAnomalyDetection(): Promise<void> {
    const interval = 60000

    this.anomalyCheckInterval = setInterval(async () => {
      const metrics = this.metricsTracker.getCurrentMetrics()
      const avgTime = await this.metricsTracker.getAverageProcessingTime(1)
      const failureRate = await this.metricsTracker.getFailureRate(1)

      const isAnomaly = await this.alertService.checkPerformanceAnomaly(
        avgTime,
        metrics.eventsFailed,
        metrics.eventsProcessed
      )

      if (isAnomaly) {
        this.logger.warn('Performance anomaly detected', {
          avgTime,
          failureRate
        })
      }
    }, interval)

    this.logger.info('Anomaly detection started')
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down monitoring system')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }

    if (this.anomalyCheckInterval) {
      clearInterval(this.anomalyCheckInterval)
    }

    if (this.config.logRetentionDays) {
      const cleared = await this.eventLogger.clearOldLogs(this.config.logRetentionDays)
      this.logger.info('Old logs cleared', { count: cleared })
    }

    await this.alertService.clearResolvedAlerts(7)

    this.logger.info('Monitoring system shut down')
  }

  getEventLogger(): ChainhookEventLogger {
    return this.eventLogger
  }

  getMetricsTracker(): MetricsTracker {
    return this.metricsTracker
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor
  }

  getAlertService(): AlertService {
    return this.alertService
  }

  async getStatus(): Promise<{
    isRunning: boolean
    nodeUrl: string
    healthCheckInterval: number
    metricsInterval: number
    nodeHealth: any
    currentMetrics: any
    unresolvedAlerts: number
  }> {
    try {
      const health = await this.healthMonitor.getHealthStatus(this.config.nodeUrl)
      const metrics = this.metricsTracker.getCurrentMetrics()
      const unresolved = await this.alertService.getUnresolvedAlerts(1)

      return {
        isRunning: this.healthCheckInterval !== undefined,
        nodeUrl: this.config.nodeUrl,
        healthCheckInterval: this.config.healthCheckInterval || 30000,
        metricsInterval: this.config.metricsInterval || 60000,
        nodeHealth: health,
        currentMetrics: metrics,
        unresolvedAlerts: unresolved.length
      }
    } catch (error) {
      this.logger.error('Failed to get monitoring status', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

export default MonitoringOrchestrator
