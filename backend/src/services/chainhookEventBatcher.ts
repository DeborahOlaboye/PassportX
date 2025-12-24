export interface BatchConfig {
  batchSize: number
  batchTimeoutMs: number
  maxQueueSize: number
}

export interface BatchMetrics {
  totalBatches: number
  totalEvents: number
  averageBatchSize: number
  averageProcessingTime: number
}

export class ChainhookEventBatcher {
  private eventQueue: any[] = []
  private processingTimer: NodeJS.Timeout | null = null
  private config: BatchConfig
  private metrics: BatchMetrics = {
    totalBatches: 0,
    totalEvents: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0
  }
  private batchTimings: number[] = []
  private readonly MAX_TIMING_SAMPLES = 500
  private batchCallbacks: ((batch: any[]) => Promise<void>)[] = []
  private logger: any

  constructor(config: Partial<BatchConfig> = {}, logger?: any) {
    this.config = {
      batchSize: config.batchSize || 50,
      batchTimeoutMs: config.batchTimeoutMs || 1000,
      maxQueueSize: config.maxQueueSize || 10000
    }
    this.logger = logger || this.getDefaultLogger()
    this.logger.info(`EventBatcher initialized with batch size: ${this.config.batchSize}, timeout: ${this.config.batchTimeoutMs}ms`)
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[EventBatcher] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[EventBatcher] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[EventBatcher] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[EventBatcher] ${msg}`, ...args)
    }
  }

  registerBatchCallback(callback: (batch: any[]) => Promise<void>): void {
    this.batchCallbacks.push(callback)
    this.logger.debug(`Batch callback registered. Total callbacks: ${this.batchCallbacks.length}`)
  }

  addEvent(event: any): boolean {
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      this.logger.warn(`Event queue at max capacity (${this.config.maxQueueSize}). Dropping oldest events.`)
      this.eventQueue = this.eventQueue.slice(-Math.floor(this.config.maxQueueSize * 0.8))
    }

    this.eventQueue.push({
      ...event,
      enqueuedAt: Date.now()
    })

    if (this.eventQueue.length >= this.config.batchSize) {
      this.processBatch()
    } else if (!this.processingTimer) {
      this.scheduleProcessing()
    }

    return true
  }

  addEvents(events: any[]): boolean {
    for (const event of events) {
      this.addEvent(event)
    }
    return true
  }

  private scheduleProcessing(): void {
    if (this.processingTimer) return

    this.processingTimer = setTimeout(() => {
      this.processBatch()
      this.processingTimer = null
    }, this.config.batchTimeoutMs)
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const batch = this.eventQueue.splice(0, this.config.batchSize)
    const startTime = performance.now()

    try {
      this.metrics.totalBatches++
      this.metrics.totalEvents += batch.length

      if (this.metrics.totalBatches > 0) {
        this.metrics.averageBatchSize = this.metrics.totalEvents / this.metrics.totalBatches
      }

      this.logger.debug(`Processing batch of ${batch.length} events`)

      for (const callback of this.batchCallbacks) {
        try {
          await callback(batch)
        } catch (error) {
          this.logger.error('Error in batch callback:', error)
        }
      }

      const processingTime = performance.now() - startTime
      this.recordBatchTiming(processingTime)

      if (this.eventQueue.length > 0) {
        setImmediate(() => this.processBatch())
      } else if (this.processingTimer) {
        clearTimeout(this.processingTimer)
        this.processingTimer = null
      }
    } catch (error) {
      this.logger.error('Error processing batch:', error)
    }
  }

  private recordBatchTiming(time: number): void {
    this.batchTimings.push(time)

    if (this.batchTimings.length > this.MAX_TIMING_SAMPLES) {
      this.batchTimings = this.batchTimings.slice(-this.MAX_TIMING_SAMPLES)
    }

    if (this.batchTimings.length > 0) {
      const sum = this.batchTimings.reduce((a, b) => a + b, 0)
      this.metrics.averageProcessingTime = sum / this.batchTimings.length
    }
  }

  async flush(): Promise<void> {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
      this.processingTimer = null
    }

    while (this.eventQueue.length > 0) {
      await this.processBatch()
    }

    this.logger.info('Event batcher flushed')
  }

  getMetrics(): BatchMetrics {
    return {
      totalBatches: this.metrics.totalBatches,
      totalEvents: this.metrics.totalEvents,
      averageBatchSize: parseFloat(this.metrics.averageBatchSize.toFixed(2)),
      averageProcessingTime: parseFloat(this.metrics.averageProcessingTime.toFixed(4))
    }
  }

  getQueueSize(): number {
    return this.eventQueue.length
  }

  resetMetrics(): void {
    this.metrics = {
      totalBatches: 0,
      totalEvents: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0
    }
    this.batchTimings = []
    this.logger.info('Metrics reset')
  }

  clearQueue(): void {
    this.eventQueue = []
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
      this.processingTimer = null
    }
    this.logger.warn('Event queue cleared')
  }

  destroy(): void {
    this.clearQueue()
    this.batchCallbacks = []
    this.logger.info('EventBatcher destroyed')
  }
}

export default ChainhookEventBatcher
