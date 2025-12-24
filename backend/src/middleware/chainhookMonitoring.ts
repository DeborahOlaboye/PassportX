import { Request, Response, NextFunction } from 'express'
import ChainhookEventLogger from '../services/chainhookEventLogger'
import MetricsTracker from '../services/metricsTracker'
import AlertService from '../services/alertService'

let eventLogger: ChainhookEventLogger | null = null
let metricsTracker: MetricsTracker | null = null
let alertService: AlertService | null = null

export function initializeChainhookMonitoring(
  _eventLogger: ChainhookEventLogger,
  _metricsTracker: MetricsTracker,
  _alertService: AlertService
) {
  eventLogger = _eventLogger
  metricsTracker = _metricsTracker
  alertService = _alertService
}

export async function chainhookEventMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!eventLogger || !metricsTracker) {
    return next()
  }

  const startTime = Date.now()
  const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    await eventLogger.logEvent({
      eventId,
      eventType: req.body?.type || 'unknown',
      status: 'received',
      payload: req.body,
      transactionHash: req.body?.transactions?.[0]?.transaction_hash,
      blockHeight: req.body?.block_identifier?.index
    })

    metricsTracker.trackEventReceived()

    res.on('finish', async () => {
      const processingTime = Date.now() - startTime

      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await eventLogger.updateEventStatus(eventId, 'completed', {
            processingTime
          })
          metricsTracker.trackEventProcessed(processingTime)

          if (processingTime > 5000 && alertService) {
            await alertService.createAlert({
              type: 'performance',
              severity: 'medium',
              message: `Slow event processing detected: ${processingTime}ms`,
              details: {
                eventId,
                processingTime,
                eventType: req.body?.type
              }
            })
          }
        } else {
          await eventLogger.updateEventStatus(eventId, 'failed', {
            processingTime,
            errorMessage: `HTTP ${res.statusCode}`
          })
          metricsTracker.trackEventFailed()

          if (alertService) {
            await alertService.createAlert({
              type: 'failed_event',
              severity: 'high',
              message: `Event processing failed with status ${res.statusCode}`,
              details: {
                eventId,
                status: res.statusCode,
                eventType: req.body?.type
              }
            })
          }
        }
      } catch (error) {
        console.error('Error in chainhook monitoring middleware:', error)
      }
    })
  } catch (error) {
    console.error('Error logging chainhook event:', error)
  }

  next()
}

export function logEventProcessingStatus(
  eventId: string,
  status: 'processing' | 'completed' | 'failed',
  options?: { processingTime?: number; errorMessage?: string }
) {
  if (!eventLogger) return

  eventLogger.updateEventStatus(eventId, status, options)
}
