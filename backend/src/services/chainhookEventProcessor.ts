import ChainhookEventValidator from './chainhookEventValidator'
import ChainhookEventCache from './chainhookEventCache'
import ChainhookPerformanceProfiler from './chainhookPerformanceProfiler'
import WebhookService from './WebhookService'
import BadgeCategoryFilter, { FilteredBadgeEvent } from './BadgeCategoryFilter'
import CategoryHandlerManager from './CategoryHandlerManager'
import ReorgHandlerService from './ReorgHandlerService'
import ReorgAwareDatabase from './ReorgAwareDatabase'
import ReorgMonitoringService from '../../src/services/ReorgMonitoringService'
import ProcessedEvent from '../models/ProcessedEvent'
import RetryQueueService from './RetryQueueService'
import CircuitBreakerRegistry from './CircuitBreakerService'

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
  private reorgDatabase: ReorgAwareDatabase
  private reorgMonitor: ReorgMonitoringService
  private retryQueueService: typeof RetryQueueService
  private circuitBreakerRegistry: typeof CircuitBreakerRegistry

  constructor(logger?: any) {
    this.validator = new ChainhookEventValidator(logger)
    this.logger = logger || this.getDefaultLogger()
    this.cache = new ChainhookEventCache({ maxSize: 5000, ttlMs: 300000 }, this.logger)
    this.profiler = new ChainhookPerformanceProfiler(this.logger)
    this.reorgDatabase = new ReorgAwareDatabase(ReorgHandlerService.getInstance(this.logger), this.logger)
    this.reorgMonitor = ReorgMonitoringService.getInstance(this.logger)
    this.retryQueueService = RetryQueueService
    this.circuitBreakerRegistry = CircuitBreakerRegistry
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
      // Handle reorg events first
      const reorgHandler = ReorgHandlerService.getInstance(this.logger);
      const reorgEvent = await reorgHandler.handleReorgEvent(chainhookEvent);

      // If a reorg was detected, handle database rollback
      if (reorgEvent) {
        this.logger.info('Reorg detected and processed', {
          rollbackToBlock: reorgEvent.rollbackToBlock,
          newCanonicalBlock: reorgEvent.newCanonicalBlock,
          affectedTransactionsCount: reorgEvent.affectedTransactions.length,
          reorgDepth: reorgEvent.newCanonicalBlock - reorgEvent.rollbackToBlock
        });

        await this.reorgDatabase.handleReorg(reorgEvent);
        await this.reorgMonitor.recordReorgEvent(reorgEvent, this.reorgDatabase);

        this.logger.info('Database rollback and monitoring completed for reorg', {
          rollbackToBlock: reorgEvent.rollbackToBlock,
          affectedTransactions: reorgEvent.affectedTransactions.length
        });
      }

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

      // Forward events to registered webhooks
      await this.forwardToWebhooks(chainhookEvent, processedEvents)

      this.profiler.recordEventProcessed('chainhook-event')
      this.profiler.endMeasurement('processEvent')

      return processedEvents
    } catch (error) {
      this.logger.error('Error processing event', error as Error)
      this.profiler.endMeasurement('processEvent')

      // Add failed event to retry queue
      try {
        await this.retryQueueService.addToQueue({
          itemType: 'event',
          originalPayload: chainhookEvent,
          eventType: 'chainhook-event-processing',
          blockHeight: chainhookEvent.block_identifier?.index,
          error: (error as Error).message,
          errorType: this.classifyError(error),
          metadata: {
            processingStage: 'event-processing',
            timestamp: new Date().toISOString()
          }
        })
        this.logger.info('Failed event added to retry queue')
      } catch (retryError) {
        this.logger.error('Failed to add event to retry queue', retryError)
      }

      return []
    }
  }

  private classifyError(error: any): 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown' {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || error.status || '';

    if (errorMessage.includes('timeout') || errorCode === 'ETIMEDOUT') {
      return 'timeout';
    }

    if (errorMessage.includes('network') || errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND') {
      return 'network';
    }

    if (errorMessage.includes('validation') || errorCode === 400) {
      return 'validation';
    }

    if (errorMessage.includes('rate limit') || errorCode === 429) {
      return 'rate_limit';
    }

    if (errorCode >= 500 && errorCode < 600) {
      return 'server_error';
    }

    return 'unknown';
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
          await this.addProcessedEvent(opProcessed)
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

  private async addProcessedEvent(event: ProcessedEvent): Promise<void> {
    this.processedEvents.set(event.id, event)

    // Save to database for replay functionality
    try {
      await ProcessedEvent.findOneAndUpdate(
        { id: event.id },
        {
          ...event,
          replayCount: 0
        },
        {
          upsert: true,
          new: true
        }
      )
    } catch (error) {
      this.logger.error('Failed to save processed event to database', error)
    }

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

  private async forwardToWebhooks(chainhookEvent: any, processedEvents: ProcessedEvent[]): Promise<void> {
    try {
      const webhookService = WebhookService.getInstance()
      const categoryFilter = BadgeCategoryFilter.getInstance()
      const handlerManager = CategoryHandlerManager.getInstance()

      for (const processedEvent of processedEvents) {
        // Apply category filtering for badge events
        if (processedEvent.eventType.includes('badge') || processedEvent.eventType.includes('mint')) {
          const filteredEvent = categoryFilter.filterEvent(
            processedEvent.eventType,
            processedEvent.originalEvent
          )

          if (filteredEvent) {
            // Process with category-specific handler
            await handlerManager.processEvent(filteredEvent)

            // Forward to webhooks with category information
            await this.sendCategoryFilteredWebhooks(webhookService, filteredEvent)
          }
        } else {
          // For non-badge events, send as before
          const webhooks = await webhookService.getActiveWebhooks(processedEvent.eventType)

          if (webhooks.length === 0) {
            continue
          }

          const payload = {
            event: processedEvent.eventType,
            data: {
              id: processedEvent.id,
              contractAddress: processedEvent.contractAddress,
              method: processedEvent.method,
              transactionHash: processedEvent.transactionHash,
              blockHeight: processedEvent.blockHeight,
              timestamp: processedEvent.timestamp,
              originalEvent: processedEvent.originalEvent
            },
            timestamp: new Date().toISOString()
          }

          // Send webhooks with circuit breaker protection
          const webhookPromises = webhooks.map(webhook =>
            this.sendWebhookWithRetry(webhookService, webhook, payload)
          )

          await Promise.allSettled(webhookPromises)
        }
      }
    } catch (error) {
      this.logger.error('Error forwarding events to webhooks', error)
    }
  }

  private async sendWebhookWithRetry(webhookService: WebhookService, webhook: any, payload: any): Promise<void> {
    const circuitBreaker = this.circuitBreakerRegistry.getBreaker(`webhook:${webhook.url}`, {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
      volumeThreshold: 5,
      errorThresholdPercentage: 50,
      monitoringPeriod: 60000
    })

    try {
      await circuitBreaker.execute(async () => {
        await webhookService.sendWebhook(webhook, payload)
      })
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${webhook.url}`, error)

      // Add to retry queue
      try {
        await this.retryQueueService.addToQueue({
          itemType: 'webhook',
          originalPayload: payload,
          targetUrl: webhook.url,
          error: (error as Error).message,
          errorType: this.classifyError(error),
          metadata: {
            webhookId: webhook._id?.toString(),
            eventType: payload.event
          }
        })
        this.logger.info(`Failed webhook added to retry queue: ${webhook.url}`)
      } catch (retryError) {
        this.logger.error('Failed to add webhook to retry queue', retryError)
      }
    }
  }

  private async sendCategoryFilteredWebhooks(
    webhookService: WebhookService,
    filteredEvent: FilteredBadgeEvent
  ): Promise<void> {
    // Get webhooks that subscribe to this category and level
    const webhooks = await webhookService.getActiveWebhooks()

    // Filter webhooks that want this category and level
    const categoryWebhooks = webhooks.filter(webhook => {
      // Check if webhook subscribes to this category
      const hasCategory = !webhook.categories ||
        webhook.categories.length === 0 ||
        webhook.categories.includes(filteredEvent.category)

      // Check if webhook subscribes to this level
      const hasLevel = !webhook.levels ||
        webhook.levels.length === 0 ||
        webhook.levels.includes(filteredEvent.level)

      return hasCategory && hasLevel
    })

    if (categoryWebhooks.length === 0) {
      return
    }

    const payload = {
      event: `badge_${filteredEvent.category.replace(/\s+/g, '_')}`,
      data: {
        ...filteredEvent,
        category: filteredEvent.category,
        level: filteredEvent.level
      },
      timestamp: new Date().toISOString()
    }

    const webhookPromises = categoryWebhooks.map(webhook =>
      webhookService.sendWebhook(webhook, payload).catch(error => {
        this.logger.error(`Failed to send category webhook to ${webhook.url}`, error)
      })
    )

    await Promise.allSettled(webhookPromises)
  }
}

export default ChainhookEventProcessor
