import ProcessedEvent from '../models/ProcessedEvent'
import { IProcessedEvent } from '../types'

export interface EventReplayFilters {
  eventType?: string
  contractAddress?: string
  method?: string
  startDate?: Date
  endDate?: Date
  startBlock?: number
  endBlock?: number
  transactionHash?: string
  limit?: number
  offset?: number
}

export interface ReplayResult {
  success: boolean
  eventsReplayed: number
  errors: string[]
}

export class EventReplayService {
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    }
  }

  async getHistoricalEvents(filters: EventReplayFilters = {}): Promise<IProcessedEvent[]> {
    try {
      const query: any = {}

      if (filters.eventType) {
        query.eventType = filters.eventType
      }

      if (filters.contractAddress) {
        query.contractAddress = filters.contractAddress
      }

      if (filters.method) {
        query.method = filters.method
      }

      if (filters.transactionHash) {
        query.transactionHash = filters.transactionHash
      }

      if (filters.startBlock || filters.endBlock) {
        query.blockHeight = {}
        if (filters.startBlock) query.blockHeight.$gte = filters.startBlock
        if (filters.endBlock) query.blockHeight.$lte = filters.endBlock
      }

      if (filters.startDate || filters.endDate) {
        query.processedAt = {}
        if (filters.startDate) query.processedAt.$gte = filters.startDate
        if (filters.endDate) query.processedAt.$lte = filters.endDate
      }

      const limit = Math.min(filters.limit || 100, 1000) // Max 1000 events
      const offset = filters.offset || 0

      const events = await ProcessedEvent
        .find(query)
        .sort({ processedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean()

      this.logger.info(`Retrieved ${events.length} historical events`, { filters })

      return events
    } catch (error) {
      this.logger.error('Failed to retrieve historical events', error)
      throw error
    }
  }

  async getEventStatistics(filters: EventReplayFilters = {}): Promise<{
    totalEvents: number
    eventTypes: { [key: string]: number }
    dateRange: { earliest: Date | null; latest: Date | null }
    blockRange: { min: number | null; max: number | null }
  }> {
    try {
      const query: any = {}

      // Apply same filters as getHistoricalEvents
      if (filters.eventType) query.eventType = filters.eventType
      if (filters.contractAddress) query.contractAddress = filters.contractAddress
      if (filters.method) query.method = filters.method
      if (filters.transactionHash) query.transactionHash = filters.transactionHash

      if (filters.startBlock || filters.endBlock) {
        query.blockHeight = {}
        if (filters.startBlock) query.blockHeight.$gte = filters.startBlock
        if (filters.endBlock) query.blockHeight.$lte = filters.endBlock
      }

      if (filters.startDate || filters.endDate) {
        query.processedAt = {}
        if (filters.startDate) query.processedAt.$gte = filters.startDate
        if (filters.endDate) query.processedAt.$lte = filters.endDate
      }

      const [totalEvents, eventTypeStats, dateStats, blockStats] = await Promise.all([
        ProcessedEvent.countDocuments(query),
        ProcessedEvent.aggregate([
          { $match: query },
          { $group: { _id: '$eventType', count: { $sum: 1 } } }
        ]),
        ProcessedEvent.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              earliest: { $min: '$processedAt' },
              latest: { $max: '$processedAt' }
            }
          }
        ]),
        ProcessedEvent.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              min: { $min: '$blockHeight' },
              max: { $max: '$blockHeight' }
            }
          }
        ])
      ])

      const eventTypes: { [key: string]: number } = {}
      eventTypeStats.forEach((stat: any) => {
        eventTypes[stat._id] = stat.count
      })

      const dateRange = dateStats.length > 0 ? {
        earliest: dateStats[0].earliest,
        latest: dateStats[0].latest
      } : { earliest: null, latest: null }

      const blockRange = blockStats.length > 0 ? {
        min: blockStats[0].min,
        max: blockStats[0].max
      } : { min: null, max: null }

      return {
        totalEvents,
        eventTypes,
        dateRange,
        blockRange
      }
    } catch (error) {
      this.logger.error('Failed to get event statistics', error)
      throw error
    }
  }

  async replayEvents(
    filters: EventReplayFilters,
    eventProcessor: any // ChainhookEventProcessor instance
  ): Promise<ReplayResult> {
    try {
      const events = await this.getHistoricalEvents({ ...filters, limit: 1000 }) // Limit replay to 1000 events at once

      let eventsReplayed = 0
      const errors: string[] = []

      for (const event of events) {
        try {
          // Check if event has already been replayed recently (within last hour)
          if (event.lastReplayedAt && (Date.now() - event.lastReplayedAt.getTime()) < 3600000) {
            this.logger.warn(`Skipping replay of event ${event.id} - recently replayed`)
            continue
          }

          // Re-process the event
          const processedEvents = await eventProcessor.processEvent(event.originalEvent)

          // Update replay count and timestamp
          await ProcessedEvent.findOneAndUpdate(
            { id: event.id },
            {
              $inc: { replayCount: 1 },
              lastReplayedAt: new Date()
            }
          )

          eventsReplayed++
          this.logger.info(`Replayed event ${event.id}`, { eventType: event.eventType })
        } catch (error) {
          const errorMsg = `Failed to replay event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          this.logger.error(errorMsg, error)
        }
      }

      this.logger.info(`Event replay completed`, { eventsReplayed, errors: errors.length })

      return {
        success: errors.length === 0,
        eventsReplayed,
        errors
      }
    } catch (error) {
      this.logger.error('Failed to replay events', error)
      return {
        success: false,
        eventsReplayed: 0,
        errors: [`Replay failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }
}

export default EventReplayService