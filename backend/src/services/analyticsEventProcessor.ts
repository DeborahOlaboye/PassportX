import { EventEmitter } from 'events'
import AnalyticsAggregator from './analyticsAggregator'

export interface AnalyticsEvent {
  type: 'badge_issued' | 'badge_revoked' | 'user_joined' | 'community_created'
  timestamp: number
  data: Record<string, any>
}

export class AnalyticsEventProcessor extends EventEmitter {
  private aggregator: AnalyticsAggregator
  private logger: any
  private eventQueue: AnalyticsEvent[] = []
  private processingTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_TIMEOUT_MS = 10000
  private readonly QUEUE_THRESHOLD = 50

  private metrics = {
    eventsProcessed: 0,
    eventsFailed: 0,
    lastProcessedTime: 0,
    averageProcessingTime: 0,
    processingTimes: [] as number[]
  }

  constructor(aggregator: AnalyticsAggregator, logger?: any) {
    super()
    this.aggregator = aggregator
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[AnalyticsEventProcessor] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[AnalyticsEventProcessor] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[AnalyticsEventProcessor] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[AnalyticsEventProcessor] ${msg}`, ...args)
    }
  }

  processBadgeIssuedEvent(data: {
    badgeId: string
    userId: string
    badgeName: string
    contractAddress: string
    blockHeight: number
    timestamp: number
  }): void {
    const event: AnalyticsEvent = {
      type: 'badge_issued',
      timestamp: Date.now(),
      data
    }

    this.queueEvent(event)
  }

  processBadgeRevokedEvent(data: {
    badgeId: string
    userId: string
    badgeName: string
    revocationType: 'soft' | 'hard'
    blockHeight: number
    timestamp: number
  }): void {
    const event: AnalyticsEvent = {
      type: 'badge_revoked',
      timestamp: Date.now(),
      data
    }

    this.queueEvent(event)
  }

  processUserJoinedEvent(data: {
    userId: string
    username: string
    walletAddress: string
    timestamp: number
  }): void {
    const event: AnalyticsEvent = {
      type: 'user_joined',
      timestamp: Date.now(),
      data
    }

    this.queueEvent(event)
  }

  processCommunityCreatedEvent(data: {
    communityId: string
    communityName: string
    creatorId: string
    blockHeight: number
    timestamp: number
  }): void {
    const event: AnalyticsEvent = {
      type: 'community_created',
      timestamp: Date.now(),
      data
    }

    this.queueEvent(event)
  }

  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event)

    if (this.eventQueue.length >= this.QUEUE_THRESHOLD) {
      this.processBatch()
    } else if (!this.processingTimeout) {
      this.processingTimeout = setTimeout(() => {
        this.processBatch()
      }, this.BATCH_TIMEOUT_MS)
    }
  }

  private async processBatch(): Promise<void> {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout)
      this.processingTimeout = null
    }

    if (this.eventQueue.length === 0) {
      return
    }

    const batch = this.eventQueue.splice(0, this.QUEUE_THRESHOLD)
    const startTime = Date.now()

    try {
      this.logger.debug('Processing analytics event batch', { batchSize: batch.length })

      const eventsByType = new Map<string, AnalyticsEvent[]>()

      for (const event of batch) {
        if (!eventsByType.has(event.type)) {
          eventsByType.set(event.type, [])
        }
        eventsByType.get(event.type)!.push(event)
      }

      for (const [eventType, events] of eventsByType) {
        this.aggregator.requestAnalyticsUpdate(eventType)

        for (const event of events) {
          this.emit('analytics:event-processed', {
            type: event.type,
            timestamp: event.timestamp,
            dataKeys: Object.keys(event.data)
          })
        }
      }

      this.metrics.eventsProcessed += batch.length
      const processingTime = Date.now() - startTime
      this.metrics.lastProcessedTime = processingTime
      this.metrics.processingTimes.push(processingTime)

      if (this.metrics.processingTimes.length > 1000) {
        this.metrics.processingTimes = this.metrics.processingTimes.slice(-1000)
      }

      this.metrics.averageProcessingTime =
        this.metrics.processingTimes.reduce((a, b) => a + b, 0) /
        this.metrics.processingTimes.length

      this.logger.info('Analytics event batch processed', {
        batchSize: batch.length,
        processingTime,
        totalProcessed: this.metrics.eventsProcessed
      })
    } catch (error) {
      this.metrics.eventsFailed += batch.length

      this.logger.error('Error processing analytics event batch:', {
        batchSize: batch.length,
        error: error instanceof Error ? error.message : String(error)
      })

      this.emit('analytics:batch-error', {
        batchSize: batch.length,
        error: error instanceof Error ? error.message : String(error)
      })
    }

    if (this.eventQueue.length > 0) {
      this.processingTimeout = setTimeout(() => {
        this.processBatch()
      }, this.BATCH_TIMEOUT_MS)
    }
  }

  getMetrics() {
    return {
      eventsProcessed: this.metrics.eventsProcessed,
      eventsFailed: this.metrics.eventsFailed,
      lastProcessedTime: this.metrics.lastProcessedTime,
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime),
      queueSize: this.eventQueue.length,
      totalMetrics: this.metrics.processingTimes.length
    }
  }

  async flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.eventQueue.length === 0) {
        resolve()
        return
      }

      const checkQueue = setInterval(() => {
        if (this.eventQueue.length === 0) {
          clearInterval(checkQueue)
          resolve()
        }
      }, 100)

      this.processBatch()
    })
  }

  async cleanup(): Promise<void> {
    try {
      if (this.processingTimeout) {
        clearTimeout(this.processingTimeout)
        this.processingTimeout = null
      }

      await this.flush()
      this.removeAllListeners()

      this.logger.info('Analytics event processor cleaned up', {
        totalEventsProcessed: this.metrics.eventsProcessed,
        totalEventsFailed: this.metrics.eventsFailed
      })
    } catch (error) {
      this.logger.error('Error during cleanup:', error)
    }
  }
}

export default AnalyticsEventProcessor
