import ChainhookEventLog from '../models/ChainhookEventLog'
import { IChainhookEventLog } from '../types'

export interface LogEventOptions {
  eventId?: string
  eventType: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  payload: any
  handler?: string
  transactionHash?: string
  blockHeight?: number
  processingTime?: number
  errorMessage?: string
}

export class ChainhookEventLogger {
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ChainhookEventLogger] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ChainhookEventLogger] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ChainhookEventLogger] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ChainhookEventLogger] ${msg}`, ...args)
    }
  }

  async logEvent(options: LogEventOptions): Promise<IChainhookEventLog | null> {
    try {
      const eventId = options.eventId || this.generateEventId()

      const logEntry = {
        eventId,
        eventType: options.eventType,
        status: options.status,
        payload: options.payload,
        handler: options.handler,
        transactionHash: options.transactionHash,
        blockHeight: options.blockHeight,
        processingTime: options.processingTime,
        errorMessage: options.errorMessage,
        receivedAt: new Date(),
        processedAt: options.status === 'completed' || options.status === 'failed' ? new Date() : undefined
      }

      const savedLog = await ChainhookEventLog.create(logEntry)

      this.logger.debug('Event logged', {
        eventId,
        eventType: options.eventType,
        status: options.status
      })

      return savedLog
    } catch (error) {
      this.logger.error('Failed to log event', {
        error: error instanceof Error ? error.message : String(error),
        eventType: options.eventType
      })
      return null
    }
  }

  async updateEventStatus(
    eventId: string,
    status: 'processing' | 'completed' | 'failed',
    options?: {
      processingTime?: number
      errorMessage?: string
    }
  ): Promise<IChainhookEventLog | null> {
    try {
      const updateData: any = {
        status,
        processedAt: new Date()
      }

      if (options?.processingTime !== undefined) {
        updateData.processingTime = options.processingTime
      }

      if (options?.errorMessage) {
        updateData.errorMessage = options.errorMessage
      }

      const updated = await ChainhookEventLog.findOneAndUpdate(
        { eventId },
        updateData,
        { new: true }
      )

      if (updated) {
        this.logger.debug('Event status updated', { eventId, status })
      }

      return updated
    } catch (error) {
      this.logger.error('Failed to update event status', {
        eventId,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async getEventLog(eventId: string): Promise<IChainhookEventLog | null> {
    try {
      return await ChainhookEventLog.findOne({ eventId })
    } catch (error) {
      this.logger.error('Failed to retrieve event log', {
        eventId,
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  async getEventsByStatus(
    status: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IChainhookEventLog[]> {
    try {
      return await ChainhookEventLog.find({ status })
        .sort({ receivedAt: -1 })
        .limit(limit)
        .skip(offset)
    } catch (error) {
      this.logger.error('Failed to retrieve events by status', {
        status,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getEventsByType(
    eventType: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<IChainhookEventLog[]> {
    try {
      return await ChainhookEventLog.find({ eventType })
        .sort({ receivedAt: -1 })
        .limit(limit)
        .skip(offset)
    } catch (error) {
      this.logger.error('Failed to retrieve events by type', {
        eventType,
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  }

  async getFailedEvents(limit: number = 100, offset: number = 0): Promise<IChainhookEventLog[]> {
    return this.getEventsByStatus('failed', limit, offset)
  }

  async getEventCount(status?: string): Promise<number> {
    try {
      const query = status ? { status } : {}
      return await ChainhookEventLog.countDocuments(query)
    } catch (error) {
      this.logger.error('Failed to get event count', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await ChainhookEventLog.deleteMany({
        receivedAt: { $lt: cutoffDate }
      })

      this.logger.info('Old logs cleared', {
        deletedCount: result.deletedCount,
        cutoffDate
      })

      return result.deletedCount || 0
    } catch (error) {
      this.logger.error('Failed to clear old logs', {
        error: error instanceof Error ? error.message : String(error)
      })
      return 0
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default ChainhookEventLogger
