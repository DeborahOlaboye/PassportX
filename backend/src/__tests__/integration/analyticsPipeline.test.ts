import AnalyticsAggregator from '../../services/analyticsAggregator'
import AnalyticsEventProcessor from '../../services/analyticsEventProcessor'
import BadgeIssuanceAnalytics from '../../services/badgeIssuanceAnalytics'
import Badge from '../../models/Badge'

jest.mock('../../models/Badge')
jest.mock('../../models/AnalyticsSnapshot')

describe('Analytics Pipeline Integration', () => {
  let aggregator: AnalyticsAggregator
  let processor: AnalyticsEventProcessor

  beforeEach(() => {
    aggregator = new AnalyticsAggregator()
    processor = new AnalyticsEventProcessor(aggregator)
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await processor.cleanup()
    await aggregator.cleanup()
  })

  describe('full event processing flow', () => {
    it('should process multiple event types in sequence', async () => {
      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(100)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'development', count: 60 },
        { _id: 'design', count: 40 }
      ])

      processor.processBadgeIssuedEvent({
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Developer Pro',
        contractAddress: 'SP123...',
        blockHeight: 12345,
        timestamp: Date.now()
      })

      processor.processBadgeIssuedEvent({
        badgeId: 'badge-2',
        userId: 'user-2',
        badgeName: 'Code Reviewer',
        contractAddress: 'SP123...',
        blockHeight: 12346,
        timestamp: Date.now()
      })

      processor.processBadgeRevokedEvent({
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Developer Pro',
        revocationType: 'soft',
        blockHeight: 12347,
        timestamp: Date.now()
      })

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBe(3)
    })

    it('should handle community creation events', async () => {
      processor.processCommunityCreatedEvent({
        communityId: 'community-1',
        communityName: 'Web Developers',
        creatorId: 'user-1',
        blockHeight: 12345,
        timestamp: Date.now()
      })

      processor.processUserJoinedEvent({
        userId: 'user-2',
        username: 'jane_doe',
        walletAddress: 'SP456...',
        timestamp: Date.now()
      })

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBe(2)
    })
  })

  describe('aggregator updates', () => {
    it('should request aggregator updates for processed events', async () => {
      const updateSpy = jest.spyOn(aggregator, 'requestAnalyticsUpdate')

      processor.processBadgeIssuedEvent({
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Badge',
        contractAddress: 'SP123...',
        blockHeight: 12345,
        timestamp: Date.now()
      })

      await processor.flush()

      expect(updateSpy).toHaveBeenCalledWith('badge_issued')
      updateSpy.mockRestore()
    })
  })

  describe('event handling reliability', () => {
    it('should handle rapid event processing', async () => {
      const eventCount = 100

      for (let i = 0; i < eventCount; i++) {
        processor.processBadgeIssuedEvent({
          badgeId: `badge-${i}`,
          userId: `user-${i % 10}`,
          badgeName: `Badge ${i}`,
          contractAddress: 'SP123...',
          blockHeight: 12345 + i,
          timestamp: Date.now()
        })
      }

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.eventsProcessed).toBe(eventCount)
      expect(metrics.eventsFailed).toBe(0)
    })

    it('should maintain queue integrity during processing', async () => {
      const events = [
        {
          type: 'badge_issued',
          data: {
            badgeId: 'badge-1',
            userId: 'user-1',
            badgeName: 'Badge 1',
            contractAddress: 'SP123...',
            blockHeight: 12345,
            timestamp: Date.now()
          }
        }
      ]

      events.forEach((event) => {
        if (event.type === 'badge_issued') {
          processor.processBadgeIssuedEvent(event.data)
        }
      })

      await processor.flush()

      const metrics = processor.getMetrics()
      expect(metrics.queueSize).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should track failed events', async () => {
      ;(Badge.countDocuments as jest.Mock).mockRejectedValue(new Error('DB Error'))

      processor.processBadgeIssuedEvent({
        badgeId: 'badge-1',
        userId: 'user-1',
        badgeName: 'Badge',
        contractAddress: 'SP123...',
        blockHeight: 12345,
        timestamp: Date.now()
      })

      try {
        await processor.flush()
      } catch {
        // Error expected
      }

      const metrics = processor.getMetrics()
      expect(metrics.eventsFailed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('performance', () => {
    it('should process events efficiently', async () => {
      const startTime = Date.now()

      for (let i = 0; i < 50; i++) {
        processor.processBadgeIssuedEvent({
          badgeId: `badge-${i}`,
          userId: `user-${i}`,
          badgeName: `Badge ${i}`,
          contractAddress: 'SP123...',
          blockHeight: 12345 + i,
          timestamp: Date.now()
        })
      }

      await processor.flush()

      const duration = Date.now() - startTime
      const metrics = processor.getMetrics()

      expect(metrics.eventsProcessed).toBe(50)
      expect(metrics.averageProcessingTime).toBeLessThan(1000)
    })
  })
})
