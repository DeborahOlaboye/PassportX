import { Router, Request, Response } from 'express'
import ChainhookEventLogger from '../services/chainhookEventLogger'
import MetricsTracker from '../services/metricsTracker'
import HealthMonitor from '../services/healthMonitor'
import AlertService from '../services/alertService'
import { authenticateToken } from '../middleware/auth'

const router = Router()

let eventLogger: ChainhookEventLogger | null = null
let metricsTracker: MetricsTracker | null = null
let healthMonitor: HealthMonitor | null = null
let alertService: AlertService | null = null

export function initializeMonitoringRoutes(
  _eventLogger: ChainhookEventLogger,
  _metricsTracker: MetricsTracker,
  _healthMonitor: HealthMonitor,
  _alertService: AlertService
) {
  eventLogger = _eventLogger
  metricsTracker = _metricsTracker
  healthMonitor = _healthMonitor
  alertService = _alertService
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    if (!healthMonitor) {
      return res.status(503).json({ error: 'Health monitor not initialized' })
    }

    const allHealth = await healthMonitor.getAllHealthStatus()

    res.json({
      status: allHealth.some(h => h.isConnected) ? 'healthy' : 'unhealthy',
      nodes: allHealth
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve health status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/metrics', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!metricsTracker) {
      return res.status(503).json({ error: 'Metrics tracker not initialized' })
    }

    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const history = await metricsTracker.getMetricsHistory(limit, offset)
    const current = metricsTracker.getCurrentMetrics()

    res.json({
      current,
      history
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/metrics/average', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!metricsTracker) {
      return res.status(503).json({ error: 'Metrics tracker not initialized' })
    }

    const hours = parseInt(req.query.hours as string) || 1
    const avgTime = await metricsTracker.getAverageProcessingTime(hours)
    const totalReceived = await metricsTracker.getTotalEventsReceived(hours)
    const failureRate = await metricsTracker.getFailureRate(hours)

    res.json({
      hours,
      averageProcessingTime: avgTime,
      totalEventsReceived: totalReceived,
      failureRate: failureRate.toFixed(2) + '%'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve average metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/events', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!eventLogger) {
      return res.status(503).json({ error: 'Event logger not initialized' })
    }

    const status = req.query.status as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    let events

    if (status) {
      events = await eventLogger.getEventsByStatus(status, limit, offset)
    } else {
      const count = await eventLogger.getEventCount()
      events = await eventLogger.getEventsByStatus('completed', limit, offset)
    }

    const totalCount = await eventLogger.getEventCount()

    res.json({
      events,
      total: totalCount,
      limit,
      offset
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve events',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/events/failed', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!eventLogger) {
      return res.status(503).json({ error: 'Event logger not initialized' })
    }

    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const failedEvents = await eventLogger.getFailedEvents(limit, offset)
    const totalFailed = await eventLogger.getEventCount('failed')

    res.json({
      events: failedEvents,
      total: totalFailed,
      limit,
      offset
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve failed events',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/events/:eventId', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!eventLogger) {
      return res.status(503).json({ error: 'Event logger not initialized' })
    }

    const { eventId } = req.params
    const event = await eventLogger.getEventLog(eventId)

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json(event)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve event',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/alerts', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!alertService) {
      return res.status(503).json({ error: 'Alert service not initialized' })
    }

    const severity = req.query.severity as string | undefined
    const resolved = req.query.resolved === 'true'

    let alerts

    if (severity) {
      alerts = await alertService.getAlertsBySeverity(
        severity as 'low' | 'medium' | 'high' | 'critical',
        100
      )
    } else {
      alerts = await alertService.getUnresolvedAlerts(100)
    }

    res.json({
      alerts,
      total: alerts.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/alerts/critical', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!alertService) {
      return res.status(503).json({ error: 'Alert service not initialized' })
    }

    const criticalAlerts = await alertService.getCriticalAlerts()

    res.json({
      alerts: criticalAlerts,
      total: criticalAlerts.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve critical alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/alerts/:alertId/resolve', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!alertService) {
      return res.status(503).json({ error: 'Alert service not initialized' })
    }

    const { alertId } = req.params
    const alert = await alertService.resolveAlert(alertId)

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' })
    }

    res.json({
      message: 'Alert resolved',
      alert
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!metricsTracker || !eventLogger || !healthMonitor || !alertService) {
      return res.status(503).json({ error: 'Monitoring services not fully initialized' })
    }

    const [
      currentMetrics,
      unresolved,
      criticalAlerts,
      failedEvents,
      allHealth
    ] = await Promise.all([
      Promise.resolve(metricsTracker.getCurrentMetrics()),
      alertService.getUnresolvedAlerts(10),
      alertService.getCriticalAlerts(),
      eventLogger.getFailedEvents(10),
      healthMonitor.getAllHealthStatus()
    ])

    const failureRate = await metricsTracker.getFailureRate(1)
    const avgProcessingTime = await metricsTracker.getAverageProcessingTime(1)

    res.json({
      summary: {
        status: allHealth.some(h => h.isConnected) ? 'healthy' : 'degraded',
        eventsReceived: currentMetrics.eventsReceived,
        eventsProcessed: currentMetrics.eventsProcessed,
        eventsFailed: currentMetrics.eventsFailed,
        failureRate: failureRate.toFixed(2),
        avgProcessingTime: avgProcessingTime.toFixed(2),
        unresolvedAlerts: unresolved.length,
        criticalAlerts: criticalAlerts.length
      },
      recentAlerts: unresolved,
      failedEvents,
      nodeHealth: allHealth
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
