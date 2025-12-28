import BadgeIssuanceAnalytics from '../../services/badgeIssuanceAnalytics'
import Badge from '../../models/Badge'

jest.mock('../../models/Badge')

describe('BadgeIssuanceAnalytics', () => {
  let analytics: BadgeIssuanceAnalytics

  beforeEach(() => {
    analytics = new BadgeIssuanceAnalytics()
    jest.clearAllMocks()
  })

  describe('getIssuanceMetrics', () => {
    it('should calculate total badges issued', async () => {
      const mockBadgeCount = 150

      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(mockBadgeCount)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'category1', count: 100 },
        { _id: 'category2', count: 50 }
      ])

      const metrics = await analytics.getIssuanceMetrics()

      expect(metrics.totalBadgesIssued).toBe(mockBadgeCount)
      expect(Badge.countDocuments).toHaveBeenCalled()
    })

    it('should return daily issuance data', async () => {
      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(0)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([])

      const metrics = await analytics.getIssuanceMetrics()

      expect(metrics.dailyIssuance).toBeDefined()
      expect(Array.isArray(metrics.dailyIssuance)).toBe(true)
      expect(metrics.dailyIssuance.length).toBeGreaterThan(0)
    })

    it('should track metrics by category', async () => {
      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(100)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'development', count: 60 },
        { _id: 'design', count: 40 }
      ])

      const metrics = await analytics.getIssuanceMetrics()

      expect(metrics.byCategory).toBeDefined()
      expect(metrics.byCategory['development']).toBe(60)
    })

    it('should invalidate cache', async () => {
      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(100)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([])

      const metrics1 = await analytics.getIssuanceMetrics()
      analytics.invalidateCache()
      const metrics2 = await analytics.getIssuanceMetrics()

      expect(Badge.countDocuments).toHaveBeenCalledTimes(2)
    })
  })

  describe('caching', () => {
    it('should cache metrics for subsequent calls', async () => {
      ;(Badge.countDocuments as jest.Mock).mockResolvedValue(100)
      ;(Badge.aggregate as jest.Mock).mockResolvedValue([])

      await analytics.getIssuanceMetrics()
      await analytics.getIssuanceMetrics()

      expect(Badge.countDocuments).toHaveBeenCalledTimes(1)
    })
  })
})
