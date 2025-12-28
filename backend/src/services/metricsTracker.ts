import EventMetrics from '../models/EventMetrics'
import { IEventMetrics } from '../types'

export interface MetricSnapshot {
  eventsReceived: number
  eventsProcessed: number
  eventsFailed: number
  averageProcessingTime: number
  minProcessingTime: number
  maxProcessingTime: number
  connectionStatus: 'connected' | 'disconnected'
}

export class MetricsTracker {
  private logger: any
  private currentMetrics: {
    received: number
    processed: number
    failed: number
    processingTimes: number[]
  }

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
    this.currentMetrics = {
      received: 0,
      processed: 0,
      failed: 0,
      processingTimes: []
    }
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[MetricsTracker] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[MetricsTracker] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[MetricsTracker] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[MetricsTracker] ${msg}`, ...args)
    }
  }

  trackEventReceived(): void {
    this.currentMetrics.received++
  }

  trackEventProcessed(processingTime: number): void {
    this.currentMetrics.processed++
    this.currentMetrics.processingTimes.push(processingTime)

    if (this.currentMetrics.processingTimes.length > 1000) {
      this.currentMetrics.processingTimes = this.currentMetrics.processingTimes.slice(-1000)
    }
  }

  trackEventFailed(): void {
    this.currentMetrics.failed++
  }

  getCurrentMetrics(): MetricSnapshot {
    const times = this.currentMetrics.processingTimes
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
    const minTime = times.length > 0 ? Math.min(...times) : 0
    const maxTime = times.length > 0 ? Math.max(...times) : 0

    return {
      eventsReceived: this.currentMetrics.received,
      eventsProcessed: this.currentMetrics.processed,
      eventsFailed: this.currentMetrics.failed,
      averageProcessingTime: avgTime,
      minProcessingTime: minTime,
      maxProcessingTime: maxTime,
      connectionStatus: 'connected'
    }
  }

  async saveMetrics(connectionStatus: 'connected' | 'disconnected' = 'connected'): Promise<IEventMetrics | null> {
    try {
      const metrics = this.getCurrentMetrics()

      const savedMetrics = await EventMetrics.create({
        timestamp: new Date(),
        eventsReceived: metrics.eventsReceived,
        eventsProcessed: metrics.eventsProcessed,
        eventsFailed: metrics.eventsFailed,
        averageProcessingTime: metrics.averageProcessingTime,
        minProcessingTime: metrics.minProcessingTime,
        maxProcessingTime: metrics.maxProcessingTime,
        connectionStatus,
        lastConnectionCheck: new Date()
      })

      this.logger.info('Metrics saved', {
        received: metrics.eventsReceived,
        processed: metrics.eventsProcessed,
        failed: metrics.eventsFailed
      })

      return savedMetrics
    } catch (error) {
      this.logger.error('Failed to save metrics', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async getMetricsHistory(
    limit: number = 100,
    offset: number = 0
  ): Promise<IEventMetrics[]> {
    try {
      return await EventMetrics.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
    } catch (error) {
      this.logger.error('Failed to retrieve metrics history', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getMetricsForTimeRange(
    startTime: Date,
    endTime: Date
  ): Promise<IEventMetrics[]> {
    try {
      return await EventMetrics.find({
        timestamp: {
          $gte: startTime,
          $lte: endTime
        }
      }).sort({ timestamp: -1 })
    } catch (error) {
      this.logger.error('Failed to retrieve metrics for time range', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getAverageProcessingTime(hours: number = 1): Promise<number> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      const result = await EventMetrics.aggregate([
        {
          $match: {
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$averageProcessingTime' }
          }
        }
      ])

      return result.length > 0 ? result[0].avg : 0
    } catch (error) {
      this.logger.error('Failed to calculate average processing time', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  async getTotalEventsReceived(hours: number = 1): Promise<number> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      const result = await EventMetrics.aggregate([
        {
          $match: {
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$eventsReceived' }
          }
        }
      ])

      return result.length > 0 ? result[0].total : 0
    } catch (error) {
      this.logger.error('Failed to get total events received', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  async getFailureRate(hours: number = 1): Promise<number> {
    try {
      const startTime = new Date()
      startTime.setHours(startTime.getHours() - hours)

      const result = await EventMetrics.aggregate([
        {
          $match: {
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            totalProcessed: { $sum: '$eventsProcessed' },
            totalFailed: { $sum: '$eventsFailed' }
          }
        }
      ])

      if (result.length === 0 || result[0].totalProcessed === 0) {
        return 0
      }

      return (result[0].totalFailed / result[0].totalProcessed) * 100
    } catch (error) {
      this.logger.error('Failed to calculate failure rate', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  resetCurrentMetrics(): void {
    this.currentMetrics = {
      received: 0,
      processed: 0,
      failed: 0,
      processingTimes: []
    }
    this.logger.info('Metrics reset')
  }
}

export default MetricsTracker
