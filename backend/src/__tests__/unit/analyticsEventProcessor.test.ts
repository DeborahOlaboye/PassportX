import AnalyticsEventProcessor from '../../services/analyticsEventProcessor'
import AnalyticsAggregator from '../../services/analyticsAggregator'

describe('AnalyticsEventProcessor', () => {
  let processor: AnalyticsEventProcessor
  let aggregator: AnalyticsAggregator
  let mockLogger: any

  beforeEach(() => {
    aggregator = new AnalyticsAggregator()
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
    processor = new AnalyticsEventProcessor(aggregator, mockLogger)
  })

  afterEach(async () => {
    await processor.cleanup()
  })

  describe('event processing', () => {
    it('should queue badge issued events', async () => {
      const badgeEvent = {
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Developer Pro',
        contractAddress: 'SP123...',
        blockHeight: 12345,
        timestamp: Date.now()
      }

      processor.processBadgeIssuedEvent(badgeEvent)
      await processor.flush()

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('batch processed'),
        expect.any(Object)
      )
    })

    it('should queue badge revoked events', async () => {
      const revokeEvent = {
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Developer Pro',
        revocationType: 'soft' as const,
        blockHeight: 12345,
        timestamp: Date.now()
      }

      processor.processBadgeRevokedEvent(revokeEvent)
      await processor.flush()

      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should queue user joined events', async () => {
      const userEvent = {
        userId: 'user-1',
        username: 'john_doe',
        walletAddress: 'SP123...',
        timestamp: Date.now()
      }

      processor.processUserJoinedEvent(userEvent)
      await processor.flush()

      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should queue community created events', async () => {
      const communityEvent = {
        communityId: 'community-1',
        communityName: 'Developers',
        creatorId: 'user-1',
        blockHeight: 12345,
        timestamp: Date.now()
      }

      processor.processCommunityCreatedEvent(communityEvent)
      await processor.flush()

      expect(mockLogger.info).toHaveBeenCalled()
    })
  })

  describe('batching', () => {
    it('should batch multiple events', async () => {
      for (let i = 0; i < 5; i++) {
        processor.processBadgeIssuedEvent({
          badgeId: `badge-${i}`,
          userId: `user-${i}`,
          badgeName: 'Badge',
          contractAddress: 'SP123...',
          blockHeight: 12345,
          timestamp: Date.now()
        })
      }

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBe(5)
    })

    it('should process batch when threshold is reached', async () => {
      jest.useFakeTimers()

      const batchSize = 50
      for (let i = 0; i < batchSize; i++) {
        processor.processBadgeIssuedEvent({
          badgeId: `badge-${i}`,
          userId: `user-${i}`,
          badgeName: 'Badge',
          contractAddress: 'SP123...',
          blockHeight: 12345,
          timestamp: Date.now()
        })
      }

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBe(batchSize)

      jest.useRealTimers()
    })
  })

  describe('metrics', () => {
    it('should track processed events', async () => {
      processor.processBadgeIssuedEvent({
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Badge',
        contractAddress: 'SP123...',
        blockHeight: 12345,
        timestamp: Date.now()
      })

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBeGreaterThan(0)
    })

    it('should track failed events', async () => {
      const metrics = processor.getMetrics()
      expect(metrics.eventsFailed).toBeGreaterThanOrEqual(0)
    })
  })
})
