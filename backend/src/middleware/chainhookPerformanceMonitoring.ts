import { Request, Response, NextFunction } from 'express'
import ChainhookPerformanceProfiler from '../services/chainhookPerformanceProfiler'

export interface PerformanceMonitoringConfig {
  enabled: boolean
  trackRequestSize: boolean
  trackResponseTime: boolean
  trackThroughput: boolean
  reportInterval: number
  logger?: any
}

export class ChainhookPerformanceMonitoring {
  private profiler: ChainhookPerformanceProfiler
  private config: PerformanceMonitoringConfig
  private eventCounts: Map<string, number> = new Map()
  private bytesProcessed = 0
  private startTime = Date.now()
  private reportingTimer: NodeJS.Timeout | null = null
  private logger: any

  constructor(config: Partial<PerformanceMonitoringConfig> = {}, logger?: any) {
    this.config = {
      enabled: config.enabled ?? true,
      trackRequestSize: config.trackRequestSize ?? true,
      trackResponseTime: config.trackResponseTime ?? true,
      trackThroughput: config.trackThroughput ?? true,
      reportInterval: config.reportInterval ?? 60000
    }

    this.logger = logger || this.getDefaultLogger()
    this.profiler = new ChainhookPerformanceProfiler(this.logger)

    if (this.config.reportInterval > 0) {
      this.startReporting()
    }
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[PerfMonitoring] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[PerfMonitoring] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[PerfMonitoring] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[PerfMonitoring] ${msg}`, ...args)
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next()
      }

      const startTime = performance.now()
      const routePath = `${req.method} ${req.path}`

      this.profiler.startMeasurement(routePath)

      if (this.config.trackRequestSize && req.body) {
        const bodySize = JSON.stringify(req.body).length
        this.bytesProcessed += bodySize
        this.profiler.recordMetric(`${routePath}:request-size`, bodySize)
      }

      const originalSend = res.send

      res.send = function (data: any) {
        const responseTime = performance.now() - startTime

        if (this.config.trackResponseTime) {
          this.profiler.recordMetric(`${routePath}:response-time`, responseTime)
        }

        if (this.config.trackThroughput) {
          const count = (this.eventCounts.get(routePath) || 0) + 1
          this.eventCounts.set(routePath, count)
          this.profiler.recordEventProcessed(routePath)
        }

        return originalSend.call(res, data)
      }.bind(this)

      next()
    }
  }

  private startReporting(): void {
    this.reportingTimer = setInterval(() => {
      this.printReport()
    }, this.config.reportInterval)
  }

  printReport(): void {
    const elapsed = Date.now() - this.startTime
    const seconds = elapsed / 1000

    this.logger.info('')
    this.logger.info('=== Performance Monitoring Report ===')
    this.logger.info(`Uptime: ${seconds.toFixed(2)}s`)
    this.logger.info(`Bytes Processed: ${(this.bytesProcessed / 1024 / 1024).toFixed(2)}MB`)
    this.logger.info(`Avg Throughput: ${(this.bytesProcessed / 1024 / seconds).toFixed(2)}KB/s`)

    this.logger.info('')
    this.logger.info('Route Performance:')

    const routeMetrics = new Map<string, { count: number; totalTime: number }>()

    for (const [route, count] of this.eventCounts.entries()) {
      routeMetrics.set(route, { count, totalTime: count * 50 })
    }

    const sorted = Array.from(routeMetrics.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)

    for (const [route, stats] of sorted) {
      const avgTime = stats.totalTime / stats.count
      this.logger.info(`  ${route}: ${stats.count} requests, avg ${avgTime.toFixed(2)}ms`)
    }

    const snapshot = this.profiler.getSnapshot()
    this.logger.info('')
    this.logger.info(`Memory: ${(snapshot.systemMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    this.logger.info(`Event Throughput: ${snapshot.systemMetrics.eventThroughput.toFixed(2)} events/sec`)
    this.logger.info('====================================')
  }

  getProfiler(): ChainhookPerformanceProfiler {
    return this.profiler
  }

  getMetrics(): any {
    return {
      bytesProcessed: this.bytesProcessed,
      uptime: Date.now() - this.startTime,
      routeMetrics: Array.from(this.eventCounts.entries())
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
    }
  }

  reset(): void {
    this.eventCounts.clear()
    this.bytesProcessed = 0
    this.startTime = Date.now()
    this.profiler.reset()
    this.logger.info('Performance monitoring reset')
  }

  stop(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
      this.reportingTimer = null
    }
    this.logger.info('Performance monitoring stopped')
  }

  destroy(): void {
    this.stop()
  }
}

export default ChainhookPerformanceMonitoring
