export interface CacheConfig {
  maxSize: number
  ttlMs: number
  enableCompression: boolean
}

export interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  hitRate: number
  avgAccessTime: number
}

export class ChainhookEventCache {
  private cache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map()
  private config: CacheConfig
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    avgAccessTime: 0
  }
  private accessTimings: number[] = []
  private readonly MAX_TIMING_SAMPLES = 1000
  private cleanupInterval: NodeJS.Timeout | null = null
  private logger: any

  constructor(config: Partial<CacheConfig> = {}, logger?: any) {
    this.config = {
      maxSize: config.maxSize || 5000,
      ttlMs: config.ttlMs || 60000,
      enableCompression: config.enableCompression ?? false
    }
    this.logger = logger || this.getDefaultLogger()
    this.startCleanup()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[EventCache] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[EventCache] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[EventCache] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[EventCache] ${msg}`, ...args)
    }
  }

  private generateKey(event: any): string {
    const blockHeight = event.block_identifier?.index || 0
    const txHash = event.transactions?.[0]?.transaction_hash || ''
    return `${blockHeight}:${txHash}`
  }

  set(event: any, value: any): void {
    const key = this.generateKey(event)

    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest()
      this.metrics.evictions++
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      accessCount: 0
    })

    this.logger.debug(`Cache set for key: ${key} (size: ${this.cache.size}/${this.config.maxSize})`)
  }

  get(event: any): any | null {
    const startTime = performance.now()
    const key = this.generateKey(event)
    const entry = this.cache.get(key)

    const accessTime = performance.now() - startTime
    this.recordAccessTiming(accessTime)

    if (!entry) {
      this.metrics.misses++
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key)
      this.metrics.misses++
      return null
    }

    entry.accessCount++
    this.metrics.hits++

    if (this.metrics.hits + this.metrics.misses > 0) {
      this.metrics.hitRate = (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
    }

    return entry.data
  }

  has(event: any): boolean {
    const key = this.generateKey(event)
    const entry = this.cache.get(key)

    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(event: any): boolean {
    const key = this.generateKey(event)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.logger.info('Cache cleared')
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.logger.debug(`Evicted cache entry: ${oldestKey}`)
    }
  }

  private recordAccessTiming(time: number): void {
    this.accessTimings.push(time)

    if (this.accessTimings.length > this.MAX_TIMING_SAMPLES) {
      this.accessTimings = this.accessTimings.slice(-this.MAX_TIMING_SAMPLES)
    }

    if (this.accessTimings.length > 0) {
      const sum = this.accessTimings.reduce((a, b) => a + b, 0)
      this.metrics.avgAccessTime = sum / this.accessTimings.length
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      let cleanedCount = 0

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.config.ttlMs) {
          this.cache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleanup removed ${cleanedCount} expired entries`)
      }
    }, Math.min(this.config.ttlMs / 2, 30000))
  }

  getMetrics(): CacheMetrics {
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      evictions: this.metrics.evictions,
      hitRate: parseFloat(this.metrics.hitRate.toFixed(2)),
      avgAccessTime: parseFloat(this.metrics.avgAccessTime.toFixed(4))
    }
  }

  getSize(): number {
    return this.cache.size
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      avgAccessTime: 0
    }
    this.accessTimings = []
    this.logger.info('Metrics reset')
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
    this.logger.info('EventCache destroyed')
  }
}

export default ChainhookEventCache
