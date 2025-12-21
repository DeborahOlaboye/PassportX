import ChainhookEventValidator from './chainhookEventValidator'
import ChainhookEventCache from './chainhookEventCache'
import ChainhookPerformanceProfiler from './chainhookPerformanceProfiler'

export interface ProcessedEvent {
  id: string
  originalEvent: any
  eventType: string
  contractAddress?: string
  method?: string
  transactionHash: string
  blockHeight: number
  timestamp: number
  processedAt: Date
  status: 'processed' | 'failed' | 'queued'
  error?: string
}

export class ChainhookEventProcessor {
  private validator: ChainhookEventValidator
  private processedEvents: Map<string, ProcessedEvent> = new Map()
  private eventIdCounter = 0
  private cache: ChainhookEventCache
  private profiler: ChainhookPerformanceProfiler
  private logger: any
  private maxProcessedEventsInMemory = 10000
  private processingBatch: Map<string, ProcessedEvent> = new Map()

  constructor(logger?: any) {
    this.validator = new ChainhookEventValidator(logger)
    this.logger = logger || this.getDefaultLogger()
    this.cache = new ChainhookEventCache({ maxSize: 5000, ttlMs: 300000 }, this.logger)
    this.profiler = new ChainhookPerformanceProfiler(this.logger)
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    }
  }

  async processEvent(chainhookEvent: any): Promise<ProcessedEvent[]> {
    this.profiler.startMeasurement('processEvent')
    const processedEvents: ProcessedEvent[] = []

    try {
      if (this.cache.has(chainhookEvent)) {
        const cached = this.cache.get(chainhookEvent)
        this.logger.debug('Cache hit for event', { blockHeight: chainhookEvent.block_identifier?.index })
        this.profiler.endMeasurement('processEvent')
        return cached || []
      }

      const validation = this.validator.validateEventSchema(chainhookEvent)

      if (!validation.valid) {
        this.logger.warn('Invalid event received', {
          errors: validation.errors,
          blockHeight: chainhookEvent.block_identifier?.index
        })

        this.profiler.endMeasurement('processEvent')
        return []
      }

      if (chainhookEvent.transactions && Array.isArray(chainhookEvent.transactions)) {
        for (const transaction of chainhookEvent.transactions) {
          const txProcessed = await this.processTransaction(chainhookEvent, transaction)
          processedEvents.push(...txProcessed)
        }
      }

      this.cache.set(chainhookEvent, processedEvents)

      this.logger.info('Event processed successfully', {
        blockHeight: chainhookEvent.block_identifier.index,
        transactionCount: chainhookEvent.transactions?.length || 0,
        processedEventCount: processedEvents.length
      })

      this.profiler.recordEventProcessed('chainhook-event')
      this.profiler.endMeasurement('processEvent')

      return processedEvents
    } catch (error) {
      this.logger.error('Error processing event', error as Error)
      this.profiler.endMeasurement('processEvent')
      return []
    }
  }

  private async processTransaction(chainhookEvent: any, transaction: any): Promise<ProcessedEvent[]> {
    const processedEvents: ProcessedEvent[] = []

    try {
      if (!transaction.operations || !Array.isArray(transaction.operations)) {
        return processedEvents
      }

      for (const operation of transaction.operations) {
        const opProcessed = this.processOperation(chainhookEvent, transaction, operation)

        if (opProcessed) {
          this.addProcessedEvent(opProcessed)
          processedEvents.push(opProcessed)
        }
      }
    } catch (error) {
      this.logger.error('Error processing transaction', error as Error)
    }

    return processedEvents
  }

  private processOperation(
    chainhookEvent: any,
    transaction: any,
    operation: any
  ): ProcessedEvent | null {
    this.profiler.startMeasurement('processOperation')

    try {
      if (operation.type === 'contract_call' && operation.contract_call) {
        const result = {
          id: this.generateEventId(),
          originalEvent: { transaction, operation },
          eventType: this.extractEventType(operation),
          contractAddress: operation.contract_call.contract,
          method: operation.contract_call.method,
          transactionHash: transaction.transaction_hash,
          blockHeight: chainhookEvent.block_identifier.index,
          timestamp: chainhookEvent.timestamp || Date.now(),
          processedAt: new Date(),
          status: 'processed' as const
        }
        this.profiler.endMeasurement('processOperation')
        return result
      }

      if (operation.events && Array.isArray(operation.events)) {
        for (const event of operation.events) {
          if (event.type === 'contract_event') {
            const result = {
              id: this.generateEventId(),
              originalEvent: event,
              eventType: this.extractEventTypeFromContractEvent(event),
              contractAddress: event.contract_address,
              transactionHash: transaction.transaction_hash,
              blockHeight: chainhookEvent.block_identifier.index,
              timestamp: chainhookEvent.timestamp || Date.now(),
              processedAt: new Date(),
              status: 'processed' as const
            }
            this.profiler.endMeasurement('processOperation')
            return result
          }
        }
      }
    } catch (error) {
      this.logger.error('Error processing operation', error as Error)
    }

    this.profiler.endMeasurement('processOperation')
    return null
  }

  private extractEventType(contractCall: any): string {
    const method = contractCall.method || ''

    if (method.includes('mint')) return 'badge-mint'
    if (method.includes('verify')) return 'badge-verify'
    if (method.includes('issue')) return 'badge-issued'
    if (method.includes('community')) return 'community-update'
    if (method.includes('invite')) return 'community-invite'

    return 'unknown'
  }

  private extractEventTypeFromContractEvent(event: any): string {
    const topic = event.topic || ''

    if (topic.includes('mint')) return 'badge-mint'
    if (topic.includes('verify')) return 'badge-verify'
    if (topic.includes('issue')) return 'badge-issued'
    if (topic.includes('community')) return 'community-update'

    return 'unknown'
  }

  private addProcessedEvent(event: ProcessedEvent): void {
    this.processedEvents.set(event.id, event)

    // Cleanup old events if we exceed max
    if (this.processedEvents.size > this.maxProcessedEventsInMemory) {
      const idsToDelete = Array.from(this.processedEvents.keys()).slice(0, 100)
      idsToDelete.forEach(id => this.processedEvents.delete(id))
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${++this.eventIdCounter}`
  }

  getProcessedEvent(id: string): ProcessedEvent | undefined {
    return this.processedEvents.get(id)
  }

  getProcessedEvents(limit: number = 100): ProcessedEvent[] {
    return Array.from(this.processedEvents.values()).slice(-limit)
  }

  getProcessedEventsByType(eventType: string, limit: number = 50): ProcessedEvent[] {
    return Array.from(this.processedEvents.values())
      .filter(e => e.eventType === eventType)
      .slice(-limit)
  }

  getProcessedEventsByBlockHeight(blockHeight: number): ProcessedEvent[] {
    return Array.from(this.processedEvents.values()).filter(e => e.blockHeight === blockHeight)
  }

  getProcessedEventCount(): number {
    return this.processedEvents.size
  }

  getProcessedEventStatistics() {
    const events = Array.from(this.processedEvents.values())
    const eventTypeDistribution: Record<string, number> = {}
    const statusDistribution: Record<string, number> = {}

    for (const event of events) {
      eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1
      statusDistribution[event.status] = (statusDistribution[event.status] || 0) + 1
    }

    return {
      total: events.length,
      byEventType: eventTypeDistribution,
      byStatus: statusDistribution
    }
  }

  clearProcessedEvents(): void {
    this.processedEvents.clear()
    this.logger.warn('Processed events cache cleared')
  }

  clearOldProcessedEvents(olderThanMinutes: number): number {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000)
    let deletedCount = 0

    for (const [id, event] of this.processedEvents.entries()) {
      if (event.processedAt < cutoffTime) {
        this.processedEvents.delete(id)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.logger.info(`Cleared ${deletedCount} old processed events`)
    }

    return deletedCount
  }

  getCacheMetrics(): any {
    return this.cache.getMetrics()
  }

  getProfilerMetrics(): any {
    return this.profiler.getAllMetrics()
  }

  getPerformanceSnapshot(): any {
    return this.profiler.getSnapshot()
  }

  resetProfilerMetrics(): void {
    this.profiler.reset()
    this.logger.info('Profiler metrics reset')
  }

  destroyCache(): void {
    this.cache.destroy()
  }
}

export default ChainhookEventProcessor
