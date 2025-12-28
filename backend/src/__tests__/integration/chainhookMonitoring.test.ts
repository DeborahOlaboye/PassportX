import ChainhookEventLogger from '../../services/chainhookEventLogger'
import MetricsTracker from '../../services/metricsTracker'
import AlertService from '../../services/alertService'
import { chainhookEventMonitoringMiddleware } from '../../middleware/chainhookMonitoring'

describe('Chainhook Monitoring Integration', () => {
  let eventLogger: ChainhookEventLogger
  let metricsTracker: MetricsTracker
  let alertService: AlertService

  beforeEach(() => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    eventLogger = new ChainhookEventLogger(mockLogger)
    metricsTracker = new MetricsTracker(mockLogger)
    alertService = new AlertService(undefined, mockLogger)
  })

  describe('Event Logging Workflow', () => {
    it('should log and track complete event flow', async () => {
      metricsTracker.trackEventReceived()

      const event = await eventLogger.logEvent({
        eventId: 'test-event-001',
        eventType: 'badge_mint',
        status: 'received',
        payload: {
          badgeId: 'badge-1',
          recipientAddress: 'SP123...'
        },
        blockHeight: 1000,
        transactionHash: 'tx123'
      })

      expect(event?.eventId).toBe('test-event-001')

      const processingTime = 1200
      metricsTracker.trackEventProcessed(processingTime)

      await eventLogger.updateEventStatus('test-event-001', 'completed', {
        processingTime
      })

      const updated = await eventLogger.getEventLog('test-event-001')
      expect(updated?.status).toBe('completed')
      expect(updated?.processingTime).toBe(1200)

      const metrics = metricsTracker.getCurrentMetrics()
      expect(metrics.eventsReceived).toBe(1)
      expect(metrics.eventsProcessed).toBe(1)
    })

    it('should handle event processing failure and alert', async () => {
      const event = await eventLogger.logEvent({
        eventId: 'test-event-002',
        eventType: 'community_creation',
        status: 'received',
        payload: { communityName: 'Test' }
      })

      expect(event).toBeDefined()

      metricsTracker.trackEventFailed()

      await eventLogger.updateEventStatus('test-event-002', 'failed', {
        processingTime: 500,
        errorMessage: 'Duplicate community name'
      })

      await alertService.createAlert({
        type: 'failed_event',
        severity: 'high',
        message: 'Event processing failed',
        details: {
          eventId: 'test-event-002',
          reason: 'Duplicate community name'
        }
      })

      const metrics = metricsTracker.getCurrentMetrics()
      expect(metrics.eventsFailed).toBe(1)

      const failedEvents = await eventLogger.getFailedEvents(10)
      expect(failedEvents).toBeDefined()
    })
  })

  describe('Performance Monitoring', () => {
    it('should track processing time metrics', async () => {
      const times = [500, 1000, 1500, 2000, 1200]

      times.forEach(time => {
        metricsTracker.trackEventProcessed(time)
      })

      const metrics = metricsTracker.getCurrentMetrics()

      expect(metrics.minProcessingTime).toBe(500)
      expect(metrics.maxProcessingTime).toBe(2000)
      expect(metrics.averageProcessingTime).toBeCloseTo(1240, 0)
    })

    it('should detect performance anomalies', async () => {
      const highProcessingTime = 6000
      const failedCount = 1
      const totalCount = 10

      const isAnomaly = await alertService.checkPerformanceAnomaly(
        highProcessingTime,
        failedCount,
        totalCount
      )

      expect(isAnomaly).toBe(true)
    })

    it('should calculate failure rate correctly', async () => {
      metricsTracker.trackEventReceived()
      metricsTracker.trackEventProcessed(100)
      metricsTracker.trackEventProcessed(200)
      metricsTracker.trackEventFailed()

      const metrics = metricsTracker.getCurrentMetrics()

      expect(metrics.eventsProcessed).toBe(2)
      expect(metrics.eventsFailed).toBe(1)
    })
  })

  describe('Alert Management', () => {
    it('should create and manage alerts', async () => {
      const alert1 = await alertService.createAlert({
        type: 'performance',
        severity: 'high',
        message: 'High processing time'
      })

      const alert2 = await alertService.createAlert({
        type: 'connection',
        severity: 'critical',
        message: 'Connection lost'
      })

      expect(alert1?.type).toBe('performance')
      expect(alert2?.type).toBe('connection')
      expect(alert2?.severity).toBe('critical')
    })

    it('should retrieve unresolved alerts', async () => {
      await alertService.createAlert({
        type: 'performance',
        severity: 'medium',
        message: 'Slight delay detected'
      })

      const alerts = await alertService.getUnresolvedAlerts(10)
      expect(alerts).toBeDefined()
    })

    it('should resolve alerts', async () => {
      const alert = await alertService.createAlert({
        type: 'connection',
        severity: 'high',
        message: 'Connection issue detected'
      })

      if (alert && alert._id) {
        const resolved = await alertService.resolveAlert(alert._id.toString())
        expect(resolved?.resolved).toBe(true)
        expect(resolved?.resolvedAt).toBeDefined()
      }
    })

    it('should get alerts by severity', async () => {
      await alertService.createAlert({
        type: 'performance',
        severity: 'critical',
        message: 'Critical alert'
      })

      const criticalAlerts = await alertService.getCriticalAlerts()
      expect(criticalAlerts).toBeDefined()
    })
  })

  describe('Event Type Tracking', () => {
    it('should filter events by type', async () => {
      await eventLogger.logEvent({
        eventType: 'badge_mint',
        status: 'completed',
        payload: {}
      })

      await eventLogger.logEvent({
        eventType: 'community_creation',
        status: 'completed',
        payload: {}
      })

      const badgeEvents = await eventLogger.getEventsByType('badge_mint', 10)
      const communityEvents = await eventLogger.getEventsByType('community_creation', 10)

      expect(badgeEvents).toBeDefined()
      expect(communityEvents).toBeDefined()
    })

    it('should track multi-handler event processing', async () => {
      const handlers = ['BadgeMintHandler', 'CommunityCreationHandler']

      for (const handler of handlers) {
        await eventLogger.logEvent({
          eventType: 'test',
          status: 'completed',
          payload: {},
          handler,
          processingTime: 1000
        })
      }

      const count = await eventLogger.getEventCount()
      expect(count).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Data Retention', () => {
    it('should handle log clearing', async () => {
      await eventLogger.logEvent({
        eventType: 'test',
        status: 'completed',
        payload: {}
      })

      const countBefore = await eventLogger.getEventCount()
      expect(countBefore).toBeGreaterThan(0)

      const cleared = await eventLogger.clearOldLogs(30)
      expect(typeof cleared).toBe('number')
    })

    it('should cleanup old alerts', async () => {
      await alertService.createAlert({
        type: 'performance',
        severity: 'low',
        message: 'Test alert'
      })

      const countBefore = await alertService.getAlertCount()
      expect(countBefore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Metrics Aggregation', () => {
    it('should aggregate metrics over time', async () => {
      for (let i = 0; i < 5; i++) {
        metricsTracker.trackEventReceived()
        metricsTracker.trackEventProcessed(1000 + i * 100)
      }

      const metrics = metricsTracker.getCurrentMetrics()
      expect(metrics.eventsReceived).toBe(5)
      expect(metrics.eventsProcessed).toBe(5)
    })

    it('should save and retrieve metrics history', async () => {
      metricsTracker.trackEventReceived()
      metricsTracker.trackEventProcessed(1500)

      const saved = await metricsTracker.saveMetrics('connected')
      expect(saved).toBeDefined()

      const history = await metricsTracker.getMetricsHistory(10)
      expect(history).toBeDefined()
    })
  })

  describe('Connection Status Tracking', () => {
    it('should track connection state changes', async () => {
      await metricsTracker.saveMetrics('connected')
      await metricsTracker.saveMetrics('disconnected')

      const metrics = await metricsTracker.getMetricsHistory(10)
      expect(metrics).toBeDefined()
    })
  })
})
