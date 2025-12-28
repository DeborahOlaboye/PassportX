import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'

export interface BadgeDistribution {
  byCategory: Array<{
    category: string
    count: number
    percentage: number
  }>
  byLevel: Array<{
    level: number
    count: number
    percentage: number
  }>
  topBadges: Array<{
    badgeId: string
    badgeName: string
    category: string
    issuedCount: number
    recipientCount: number
    issuanceRate: number
  }>
  trendingBadges: Array<{
    badgeId: string
    badgeName: string
    issuanceLast7Days: number
    issuanceLast30Days: number
    growth: number
  }>
  mostAwardedByCategory: Record<
    string,
    Array<{
      badgeName: string
      count: number
    }>
  >
  badgesByIssuer: Array<{
    issuer: string
    uniqueBadges: number
    totalIssued: number
  }>
}

export class BadgeDistributionAnalytics {
  private logger: any
  private cache: Map<string, { data: BadgeDistribution; timestamp: number }> = new Map()
  private readonly CACHE_TTL_MS = 120000

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[BadgeDistributionAnalytics] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[BadgeDistributionAnalytics] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[BadgeDistributionAnalytics] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[BadgeDistributionAnalytics] ${msg}`, ...args)
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS
  }

  async getDistribution(): Promise<BadgeDistribution> {
    const cacheKey = 'badge_distribution'
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.logger.debug('Cache hit for badge distribution')
      return cached.data
    }

    try {
      const [
        byCategory,
        byLevel,
        topBadges,
        trendingBadges,
        mostAwarded,
        byIssuer
      ] = await Promise.all([
        this.getBadgesByCategory(),
        this.getBadgesByLevel(),
        this.getTopBadges(15),
        this.getTrendingBadges(10),
        this.getMostAwardedByCategory(),
        this.getBadgesByIssuer()
      ])

      const distribution: BadgeDistribution = {
        byCategory,
        byLevel,
        topBadges,
        trendingBadges,
        mostAwardedByCategory: mostAwarded,
        badgesByIssuer: byIssuer
      }

      this.cache.set(cacheKey, { data: distribution, timestamp: Date.now() })
      this.logger.debug('Badge distribution calculated')

      return distribution
    } catch (error) {
      this.logger.error('Error calculating badge distribution:', error)
      throw error
    }
  }

  private async getBadgesByCategory(): Promise<BadgeDistribution['byCategory']> {
    const total = await Badge.countDocuments()

    const result = await Badge.aggregate([
      {
        $group: {
          _id: '$metadata.category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ])

    return result.map((item) => ({
      category: item._id,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }))
  }

  private async getBadgesByLevel(): Promise<BadgeDistribution['byLevel']> {
    const total = await Badge.countDocuments()

    const result = await Badge.aggregate([
      {
        $group: {
          _id: '$metadata.level',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    return result.map((item) => ({
      level: item._id,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }))
  }

  private async getTopBadges(limit: number): Promise<BadgeDistribution['topBadges']> {
    const result = await Badge.aggregate([
      {
        $group: {
          _id: '$templateId',
          count: { $sum: 1 },
          uniqueRecipients: { $addToSet: '$owner' },
          category: { $first: '$metadata.category' }
        }
      },
      {
        $lookup: {
          from: 'badgetemplates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      {
        $project: {
          templateId: '$_id',
          name: { $arrayElemAt: ['$template.name', 0] },
          count: 1,
          uniqueRecipients: { $size: '$uniqueRecipients' },
          category: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      }
    ])

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const badgesWithRate = await Promise.all(
      result.map(async (badge) => {
        const monthCount = await Badge.countDocuments({
          templateId: badge.templateId,
          issuedAt: { $gte: monthAgo }
        })

        return {
          badgeId: badge.templateId?.toString() || '',
          badgeName: badge.name || 'Unknown',
          category: badge.category,
          issuedCount: badge.count,
          recipientCount: badge.uniqueRecipients,
          issuanceRate: monthCount / 30
        }
      })
    )

    return badgesWithRate
  }

  private async getTrendingBadges(limit: number): Promise<BadgeDistribution['trendingBadges']> {
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const result = await Badge.aggregate([
      {
        $facet: {
          last7Days: [
            {
              $match: { issuedAt: { $gte: last7Days } }
            },
            {
              $group: {
                _id: '$templateId',
                count: { $sum: 1 }
              }
            }
          ],
          last30Days: [
            {
              $match: { issuedAt: { $gte: last30Days } }
            },
            {
              $group: {
                _id: '$templateId',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ])

    const merged = new Map<string, { last7: number; last30: number }>()

    for (const badge of result[0].last7Days) {
      merged.set(badge._id?.toString() || '', {
        last7: badge.count,
        last30: 0
      })
    }

    for (const badge of result[0].last30Days) {
      const key = badge._id?.toString() || ''
      const existing = merged.get(key) || { last7: 0, last30: 0 }
      merged.set(key, { ...existing, last30: badge.count })
    }

    const trending = Array.from(merged.entries())
      .map(([templateId, counts]) => ({
        templateId,
        growth:
          counts.last30 > 0 ? ((counts.last7 - counts.last30 / 4) / (counts.last30 / 4)) * 100 : 0,
        last7: counts.last7,
        last30: counts.last30
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, limit)

    const templates = await BadgeTemplate.find({
      _id: { $in: trending.map((t) => t.templateId) }
    })

    const templateMap = new Map(templates.map((t) => [t._id?.toString(), t]))

    return trending.map((badge) => {
      const template = templateMap.get(badge.templateId)
      return {
        badgeId: badge.templateId,
        badgeName: template?.name || 'Unknown',
        issuanceLast7Days: badge.last7,
        issuanceLast30Days: badge.last30,
        growth: Math.round(badge.growth * 100) / 100
      }
    })
  }

  private async getMostAwardedByCategory(): Promise<
    BadgeDistribution['mostAwardedByCategory']
  > {
    const categories = await Badge.distinct('metadata.category')
    const result: BadgeDistribution['mostAwardedByCategory'] = {}

    for (const category of categories) {
      const badges = await Badge.aggregate([
        {
          $match: { 'metadata.category': category }
        },
        {
          $group: {
            _id: '$templateId',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        },
        {
          $lookup: {
            from: 'badgetemplates',
            localField: '_id',
            foreignField: '_id',
            as: 'template'
          }
        },
        {
          $project: {
            name: { $arrayElemAt: ['$template.name', 0] },
            count: 1
          }
        }
      ])

      result[category] = badges.map((badge) => ({
        badgeName: badge.name || 'Unknown',
        count: badge.count
      }))
    }

    return result
  }

  private async getBadgesByIssuer(): Promise<BadgeDistribution['badgesByIssuer']> {
    const result = await Badge.aggregate([
      {
        $group: {
          _id: '$issuer',
          uniqueTemplates: { $addToSet: '$templateId' },
          totalIssued: { $sum: 1 }
        }
      },
      {
        $project: {
          issuer: '$_id',
          uniqueBadges: { $size: '$uniqueTemplates' },
          totalIssued: 1
        }
      },
      {
        $sort: { totalIssued: -1 }
      },
      {
        $limit: 20
      }
    ])

    return result.map((item) => ({
      issuer: item.issuer,
      uniqueBadges: item.uniqueBadges,
      totalIssued: item.totalIssued
    }))
  }

  invalidateCache(): void {
    this.cache.clear()
    this.logger.debug('Badge distribution analytics cache cleared')
  }
}

export default BadgeDistributionAnalytics
