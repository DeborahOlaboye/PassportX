import ChainhookEventLogger from '../../services/chainhookEventLogger'
import MetricsTracker from '../../services/metricsTracker'
import HealthMonitor from '../../services/healthMonitor'
import AlertService from '../../services/alertService'

describe('Chainhook Logging Services', () => {
  let logger: ChainhookEventLogger
  let metricsTracker: MetricsTracker
  let healthMonitor: HealthMonitor
  let alertService: AlertService

  beforeEach(() => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    logger = new ChainhookEventLogger(mockLogger)
    metricsTracker = new MetricsTracker(mockLogger)
    healthMonitor = new HealthMonitor(mockLogger)
    alertService = new AlertService(undefined, mockLogger)
  })

  describe('ChainhookEventLogger', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined()
    })

    it('should have required methods', () => {
      expect(logger).toHaveProperty('logEvent')
      expect(logger).toHaveProperty('updateEventStatus')
      expect(logger).toHaveProperty('getEventLog')
      expect(logger).toHaveProperty('getEventsByStatus')
      expect(logger).toHaveProperty('getFailedEvents')
      expect(logger).toHaveProperty('getEventCount')
      expect(logger).toHaveProperty('clearOldLogs')
    })

    it('should log events with required fields', async () => {
      const event = await logger.logEvent({
        eventType: 'badge_mint',
        status: 'completed',
        payload: { test: 'data' },
        handler: 'BadgeMintHandler',
        transactionHash: 'abc123',
        blockHeight: 100
      })

      expect(event).toBeDefined()
      expect(event?.eventType).toBe('badge_mint')
      expect(event?.status).toBe('completed')
    })

    it('should track processing time', async () => {
      const event = await logger.logEvent({
        eventType: 'test_event',
        status: 'completed',
        payload: {},
        processingTime: 1500
      })

      expect(event?.processingTime).toBe(1500)
    })

    it('should update event status', async () => {
      const event = await logger.logEvent({
        eventType: 'test_event',
        status: 'received',
        payload: {}
      })

      if (event) {
        const updated = await logger.updateEventStatus(event.eventId, 'completed', {
          processingTime: 2000
        })

        expect(updated?.status).toBe('completed')
        expect(updated?.processingTime).toBe(2000)
      }
    })
  })

  describe('MetricsTracker', () => {
    it('should create metrics tracker instance', () => {
      expect(metricsTracker).toBeDefined()
    })

    it('should have required methods', () => {
      expect(metricsTracker).toHaveProperty('trackEventReceived')
      expect(metricsTracker).toHaveProperty('trackEventProcessed')
      expect(metricsTracker).toHaveProperty('trackEventFailed')
      expect(metricsTracker).toHaveProperty('getCurrentMetrics')
      expect(metricsTracker).toHaveProperty('getMetricsHistory')
      expect(metricsTracker).toHaveProperty('getAverageProcessingTime')
    })

    it('should track event metrics', () => {
      metricsTracker.trackEventReceived()
      metricsTracker.trackEventProcessed(1500)
      metricsTracker.trackEventFailed()

      const metrics = metricsTracker.getCurrentMetrics()

      expect(metrics.eventsReceived).toBe(1)
      expect(metrics.eventsProcessed).toBe(1)
      expect(metrics.eventsFailed).toBe(1)
      expect(metrics.averageProcessingTime).toBe(1500)
    })

    it('should calculate min and max processing times', () => {
      metricsTracker.trackEventProcessed(1000)
      metricsTracker.trackEventProcessed(2000)
      metricsTracker.trackEventProcessed(1500)

      const metrics = metricsTracker.getCurrentMetrics()

      expect(metrics.minProcessingTime).toBe(1000)
      expect(metrics.maxProcessingTime).toBe(2000)
      expect(metrics.averageProcessingTime).toBeCloseTo(1500, 0)
    })

    it('should reset metrics', () => {
      metricsTracker.trackEventReceived()
      metricsTracker.trackEventProcessed(1000)

      metricsTracker.resetCurrentMetrics()

      const metrics = metricsTracker.getCurrentMetrics()

      expect(metrics.eventsReceived).toBe(0)
      expect(metrics.eventsProcessed).toBe(0)
    })
  })

  describe('HealthMonitor', () => {
    it('should create health monitor instance', () => {
      expect(healthMonitor).toBeDefined()
    })

    it('should have required methods', () => {
      expect(healthMonitor).toHaveProperty('checkHealth')
      expect(healthMonitor).toHaveProperty('getHealthStatus')
      expect(healthMonitor).toHaveProperty('getAllHealthStatus')
      expect(healthMonitor).toHaveProperty('getUptime')
    })

    it('should check health with valid structure', async () => {
      const result = await healthMonitor.checkHealth({
        nodeUrl: 'http://localhost:20456',
        timeout: 5000
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('isConnected')
      expect(result).toHaveProperty('responseTime')
    })
  })

  describe('AlertService', () => {
    it('should create alert service instance', () => {
      expect(alertService).toBeDefined()
    })

    it('should have required methods', () => {
      expect(alertService).toHaveProperty('createAlert')
      expect(alertService).toHaveProperty('checkPerformanceAnomaly')
      expect(alertService).toHaveProperty('checkConnectionAnomaly')
      expect(alertService).toHaveProperty('resolveAlert')
      expect(alertService).toHaveProperty('getUnresolvedAlerts')
    })

    it('should create alert with required fields', async () => {
      const alert = await alertService.createAlert({
        type: 'performance',
        severity: 'high',
        message: 'High processing time detected',
        details: { time: 5000 }
      })

      expect(alert).toBeDefined()
      expect(alert?.type).toBe('performance')
      expect(alert?.severity).toBe('high')
    })

    it('should detect performance anomalies', async () => {
      const isAnomaly = await alertService.checkPerformanceAnomaly(
        6000,
        2,
        10
      )

      expect(isAnomaly).toBe(true)
    })

    it('should detect connection anomalies', async () => {
      const isAnomaly = await alertService.checkConnectionAnomaly(
        false,
        5
      )

      expect(isAnomaly).toBe(true)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete event lifecycle', async () => {
      metricsTracker.trackEventReceived()

      const loggedEvent = await logger.logEvent({
        eventType: 'badge_mint',
        status: 'received',
        payload: { badgeId: 'badge1' }
      })

      if (loggedEvent) {
        const processingTime = 2500
        metricsTracker.trackEventProcessed(processingTime)

        await logger.updateEventStatus(loggedEvent.eventId, 'completed', {
          processingTime
        })

        const updated = await logger.getEventLog(loggedEvent.eventId)
        expect(updated?.status).toBe('completed')
        expect(updated?.processingTime).toBe(processingTime)
      }

      const metrics = metricsTracker.getCurrentMetrics()
      expect(metrics.eventsReceived).toBe(1)
      expect(metrics.eventsProcessed).toBe(1)
    })

    it('should track failed events and trigger alerts', async () => {
      const loggedEvent = await logger.logEvent({
        eventType: 'community_creation',
        status: 'failed',
        payload: {},
        errorMessage: 'Database connection failed'
      })

      if (loggedEvent) {
        metricsTracker.trackEventFailed()

        await alertService.createAlert({
          type: 'failed_event',
          severity: 'high',
          message: 'Event processing failed',
          details: { eventId: loggedEvent.eventId }
        })
      }

      const metrics = metricsTracker.getCurrentMetrics()
      expect(metrics.eventsFailed).toBe(1)
    })
  })
})
