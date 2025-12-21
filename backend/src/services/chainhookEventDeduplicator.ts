export interface DeduplicationConfig {
  windowSizeMs: number
  maxTrackedEvents: number
}

export interface DeduplicationMetrics {
  totalEvents: number
  duplicatesDetected: number
  deduplicationRate: number
  windowSize: number
}

export class ChainhookEventDeduplicator {
  private eventHashes: Map<string, { timestamp: number; count: number }> = new Map()
  private config: DeduplicationConfig
  private metrics: DeduplicationMetrics = {
    totalEvents: 0,
    duplicatesDetected: 0,
    deduplicationRate: 0,
    windowSize: 0
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private logger: any

  constructor(config: Partial<DeduplicationConfig> = {}, logger?: any) {
    this.config = {
      windowSizeMs: config.windowSizeMs || 60000,
      maxTrackedEvents: config.maxTrackedEvents || 10000
    }
    this.logger = logger || this.getDefaultLogger()
    this.metrics.windowSize = this.config.windowSizeMs
    this.startCleanup()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[Deduplicator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[Deduplicator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[Deduplicator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[Deduplicator] ${msg}`, ...args)
    }
  }

  private generateHash(event: any): string {
    const blockHeight = event.block_identifier?.index || 0
    const txHash = event.transactions?.[0]?.transaction_hash || ''
    const txIndex = event.transactions?.[0]?.tx_index || 0

    return `${blockHeight}:${txHash}:${txIndex}`
  }

  isDuplicate(event: any): boolean {
    const hash = this.generateHash(event)
    const now = Date.now()

    this.metrics.totalEvents++

    const existing = this.eventHashes.get(hash)

    if (existing && now - existing.timestamp < this.config.windowSizeMs) {
      existing.count++
      this.metrics.duplicatesDetected++
      this.updateDeduplicationRate()

      this.logger.debug(`Duplicate event detected (count: ${existing.count}): ${hash}`)
      return true
    }

    this.eventHashes.set(hash, { timestamp: now, count: 1 })

    if (this.eventHashes.size > this.config.maxTrackedEvents) {
      this.evictOldest()
    }

    return false
  }

  markAsProcessed(event: any): void {
    const hash = this.generateHash(event)
    const entry = this.eventHashes.get(hash)

    if (entry) {
      entry.timestamp = Date.now()
      this.logger.debug(`Event marked as processed: ${hash}`)
    }
  }

  private evictOldest(): void {
    let oldestHash: string | null = null
    let oldestTime = Date.now()

    for (const [hash, entry] of this.eventHashes.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestHash = hash
      }
    }

    if (oldestHash) {
      this.eventHashes.delete(oldestHash)
      this.logger.debug(`Evicted oldest event: ${oldestHash}`)
    }
  }

  private updateDeduplicationRate(): void {
    if (this.metrics.totalEvents > 0) {
      this.metrics.deduplicationRate = (this.metrics.duplicatesDetected / this.metrics.totalEvents) * 100
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [hash, entry] of this.eventHashes.entries()) {
        if (now - entry.timestamp > this.config.windowSizeMs) {
          this.eventHashes.delete(hash)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleanup removed ${cleanedCount} expired event hashes`)
      }
    }, Math.min(this.config.windowSizeMs / 4, 15000))
  }

  getMetrics(): DeduplicationMetrics {
    return {
      totalEvents: this.metrics.totalEvents,
      duplicatesDetected: this.metrics.duplicatesDetected,
      deduplicationRate: parseFloat(this.metrics.deduplicationRate.toFixed(2)),
      windowSize: this.metrics.windowSize
    }
  }

  getTrackedEventCount(): number {
    return this.eventHashes.size
  }

  resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      duplicatesDetected: 0,
      deduplicationRate: 0,
      windowSize: this.config.windowSizeMs
    }
    this.logger.info('Deduplicator metrics reset')
  }

  clear(): void {
    this.eventHashes.clear()
    this.logger.warn('Event deduplicator cleared')
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
    this.logger.info('EventDeduplicator destroyed')
  }
}

export default ChainhookEventDeduplicator
