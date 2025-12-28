import ChainhookEventProcessor from '../backend/src/services/chainhookEventProcessor'
import ChainhookEventBatcher from '../backend/src/services/chainhookEventBatcher'
import ChainhookEventCache from '../backend/src/services/chainhookEventCache'
import ChainhookPerformanceProfiler from '../backend/src/services/chainhookPerformanceProfiler'
import ChainhookEventDeduplicator from '../backend/src/services/chainhookEventDeduplicator'
import ChainhookOperationRouter from '../backend/src/services/chainhookOperationRouter'

interface LoadTestConfig {
  eventCount: number
  batchSize: number
  eventSize: 'small' | 'medium' | 'large'
  concurrency: number
  duration: number
}

class ChainhookLoadTester {
  private processor: ChainhookEventProcessor
  private batcher: ChainhookEventBatcher
  private deduplicator: ChainhookEventDeduplicator
  private router: ChainhookOperationRouter
  private config: LoadTestConfig
  private logger: any
  private startTime = 0
  private processedCount = 0

  constructor(config: Partial<LoadTestConfig> = {}, logger?: any) {
    this.config = {
      eventCount: config.eventCount || 10000,
      batchSize: config.batchSize || 50,
      eventSize: config.eventSize || 'medium',
      concurrency: config.concurrency || 5,
      duration: config.duration || 60000
    }

    this.logger = logger || this.getDefaultLogger()
    this.processor = new ChainhookEventProcessor(this.logger)
    this.batcher = new ChainhookEventBatcher({ batchSize: this.config.batchSize }, this.logger)
    this.deduplicator = new ChainhookEventDeduplicator({}, this.logger)
    this.router = new ChainhookOperationRouter(this.logger)
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => {},
      info: (msg: string, ...args: any[]) => console.log(`[LoadTest] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[LoadTest] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[LoadTest] ${msg}`, ...args)
    }
  }

  private generateEvent(index: number): any {
    const blockHeight = Math.floor(index / 100) + 1000
    let transactionCount = 1
    let operationCount = 1

    if (this.config.eventSize === 'medium') {
      transactionCount = 5
      operationCount = 3
    } else if (this.config.eventSize === 'large') {
      transactionCount = 20
      operationCount = 10
    }

    const transactions: any[] = []

    for (let tx = 0; tx < transactionCount; tx++) {
      const operations: any[] = []

      for (let op = 0; op < operationCount; op++) {
        operations.push({
          type: 'contract_call',
          contract_call: {
            contract: `SP${Math.random().toString().slice(2, 30).toUpperCase()}.badge-issuer`,
            method: ['mint', 'verify', 'issue-badge'][Math.floor(Math.random() * 3)],
            args: [
              { name: 'recipient', value: `SP${Math.random().toString().slice(2, 30).toUpperCase()}` },
              { name: 'badge-id', value: Math.floor(Math.random() * 1000) }
            ]
          }
        })
      }

      transactions.push({
        transaction_hash: `0x${Math.random().toString(16).slice(2)}${index}`,
        tx_index: tx,
        operations
      })
    }

    return {
      apply: [],
      block_identifier: {
        index: blockHeight,
        hash: `0xblock${blockHeight}`
      },
      metadata: {
        pox_cycle_position: Date.now()
      },
      timestamp: Date.now(),
      transactions
    }
  }

  async run(): Promise<void> {
    this.logger.info('=== Chainhook Load Test Starting ===')
    this.logger.info(`Configuration:`)
    this.logger.info(`  Events: ${this.config.eventCount}`)
    this.logger.info(`  Batch Size: ${this.config.batchSize}`)
    this.logger.info(`  Event Size: ${this.config.eventSize}`)
    this.logger.info(`  Concurrency: ${this.config.concurrency}`)

    this.startTime = Date.now()
    const events: any[] = []

    for (let i = 0; i < this.config.eventCount; i++) {
      events.push(this.generateEvent(i))
    }

    this.logger.info(`Generated ${events.length} test events`)

    await this.processEvents(events)

    const duration = Date.now() - this.startTime
    await this.printResults(duration)

    this.cleanup()
  }

  private async processEvents(events: any[]): Promise<void> {
    const batchSize = Math.ceil(events.length / this.config.concurrency)
    const promises: Promise<void>[] = []

    for (let i = 0; i < this.config.concurrency; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, events.length)
      const batch = events.slice(start, end)

      promises.push(this.processBatch(batch))
    }

    await Promise.all(promises)
  }

  private async processBatch(events: any[]): Promise<void> {
    for (const event of events) {
      const isDuplicate = this.deduplicator.isDuplicate(event)

      if (!isDuplicate) {
        await this.processor.processEvent(event)
        this.processedCount++
      }
    }
  }

  private async printResults(duration: number): Promise<void> {
    const durationSeconds = duration / 1000

    this.logger.info('')
    this.logger.info('=== Load Test Results ===')
    this.logger.info(`Duration: ${durationSeconds.toFixed(2)}s`)
    this.logger.info(`Processed Events: ${this.processedCount}`)
    this.logger.info(`Throughput: ${(this.processedCount / durationSeconds).toFixed(2)} events/sec`)

    const processorCache = this.processor.getCacheMetrics()
    if (processorCache) {
      this.logger.info('')
      this.logger.info('Cache Metrics:')
      this.logger.info(`  Hits: ${processorCache.hits}`)
      this.logger.info(`  Misses: ${processorCache.misses}`)
      this.logger.info(`  Hit Rate: ${processorCache.hitRate}%`)
    }

    const dedupMetrics = this.deduplicator.getMetrics()
    this.logger.info('')
    this.logger.info('Deduplication Metrics:')
    this.logger.info(`  Total Events: ${dedupMetrics.totalEvents}`)
    this.logger.info(`  Duplicates Detected: ${dedupMetrics.duplicatesDetected}`)
    this.logger.info(`  Deduplication Rate: ${dedupMetrics.deduplicationRate}%`)

    const processorMetrics = this.processor.getProfilerMetrics()
    if (Object.keys(processorMetrics).length > 0) {
      this.logger.info('')
      this.logger.info('Performance Metrics (Top 5):')

      const sorted = Object.entries(processorMetrics)
        .sort(([, a]: any, [, b]: any) => b.totalTime - a.totalTime)
        .slice(0, 5)

      for (const [name, metric]: any of sorted) {
        this.logger.info(`  ${name}:`)
        this.logger.info(`    Avg: ${metric.avg.toFixed(2)}ms, Min: ${metric.min.toFixed(2)}ms, Max: ${metric.max.toFixed(2)}ms`)
        this.logger.info(`    P95: ${metric.p95.toFixed(2)}ms, P99: ${metric.p99.toFixed(2)}ms`)
      }
    }

    const snapshot = this.processor.getPerformanceSnapshot()
    if (snapshot) {
      this.logger.info('')
      this.logger.info('System Metrics:')
      this.logger.info(`  Memory: ${(snapshot.systemMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
      this.logger.info(`  Event Throughput: ${snapshot.systemMetrics.eventThroughput.toFixed(2)} events/sec`)
    }

    this.logger.info('')
    this.logger.info('=== Load Test Complete ===')
  }

  private cleanup(): void {
    this.processor.destroyCache()
    this.batcher.destroy()
    this.deduplicator.destroy()
    this.router.destroy()
  }
}

async function main() {
  const config: Partial<LoadTestConfig> = {
    eventCount: parseInt(process.env.EVENT_COUNT || '10000'),
    batchSize: parseInt(process.env.BATCH_SIZE || '50'),
    eventSize: (process.env.EVENT_SIZE || 'medium') as 'small' | 'medium' | 'large',
    concurrency: parseInt(process.env.CONCURRENCY || '5')
  }

  const tester = new ChainhookLoadTester(config)

  try {
    await tester.run()
  } catch (error) {
    console.error('Load test failed:', error)
    process.exit(1)
  }
}

main()
