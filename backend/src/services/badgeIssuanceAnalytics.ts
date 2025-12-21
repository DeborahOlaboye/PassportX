import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'

export interface IssuanceMetrics {
  totalBadgesIssued: number
  badgesIssuedToday: number
  badgesIssuedThisWeek: number
  badgesIssuedThisMonth: number
  dailyIssuance: Array<{
    date: string
    count: number
  }>
  weeklyIssuance: Array<{
    week: string
    count: number
  }>
  monthlyIssuance: Array<{
    month: string
    count: number
  }>
  byCategory: Record<string, number>
  byLevel: Record<number, number>
  byIssuer: Record<string, number>
}

export class BadgeIssuanceAnalytics {
  private logger: any
  private cache: Map<string, { data: IssuanceMetrics; timestamp: number }> = new Map()
  private readonly CACHE_TTL_MS = 60000

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[BadgeIssuanceAnalytics] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[BadgeIssuanceAnalytics] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[BadgeIssuanceAnalytics] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[BadgeIssuanceAnalytics] ${msg}`, ...args)
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS
  }

  async getIssuanceMetrics(): Promise<IssuanceMetrics> {
    const cacheKey = 'issuance_metrics'
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.logger.debug('Cache hit for issuance metrics')
      return cached.data
    }

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        totalBadges,
        todayBadges,
        weekBadges,
        monthBadges,
        dailyData,
        byCategory,
        byLevel,
        byIssuer
      ] = await Promise.all([
        Badge.countDocuments(),
        Badge.countDocuments({ issuedAt: { $gte: todayStart } }),
        Badge.countDocuments({ issuedAt: { $gte: weekStart } }),
        Badge.countDocuments({ issuedAt: { $gte: monthStart } }),
        this.getDailyIssuance(30),
        this.getBadgesByCategory(),
        this.getBadgesByLevel(),
        this.getBadgesByIssuer()
      ])

      const metrics: IssuanceMetrics = {
        totalBadgesIssued: totalBadges,
        badgesIssuedToday: todayBadges,
        badgesIssuedThisWeek: weekBadges,
        badgesIssuedThisMonth: monthBadges,
        dailyIssuance: dailyData,
        weeklyIssuance: await this.getWeeklyIssuance(12),
        monthlyIssuance: await this.getMonthlyIssuance(12),
        byCategory,
        byLevel,
        byIssuer
      }

      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() })
      this.logger.debug('Issuance metrics calculated', {
        total: totalBadges,
        today: todayBadges
      })

      return metrics
    } catch (error) {
      this.logger.error('Error calculating issuance metrics:', error)
      throw error
    }
  }

  private async getDailyIssuance(days: number): Promise<IssuanceMetrics['dailyIssuance']> {
    const result: IssuanceMetrics['dailyIssuance'] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const count = await Badge.countDocuments({
        issuedAt: { $gte: dayStart, $lt: dayEnd }
      })

      result.push({
        date: dayStart.toISOString().split('T')[0],
        count
      })
    }

    return result
  }

  private async getWeeklyIssuance(weeks: number): Promise<IssuanceMetrics['weeklyIssuance']> {
    const result: IssuanceMetrics['weeklyIssuance'] = []
    const now = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      const count = await Badge.countDocuments({
        issuedAt: { $gte: weekStart, $lt: weekEnd }
      })

      result.push({
        week: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
        count
      })
    }

    return result
  }

  private async getMonthlyIssuance(months: number): Promise<IssuanceMetrics['monthlyIssuance']> {
    const result: IssuanceMetrics['monthlyIssuance'] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

      const count = await Badge.countDocuments({
        issuedAt: { $gte: monthStart, $lt: monthEnd }
      })

      result.push({
        month: monthStart.toISOString().substring(0, 7),
        count
      })
    }

    return result
  }

  private async getBadgesByCategory(): Promise<Record<string, number>> {
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

    return result.reduce(
      (acc, item) => {
        acc[item._id] = item.count
        return acc
      },
      {} as Record<string, number>
    )
  }

  private async getBadgesByLevel(): Promise<Record<number, number>> {
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

    return result.reduce(
      (acc, item) => {
        acc[item._id] = item.count
        return acc
      },
      {} as Record<number, number>
    )
  }

  private async getBadgesByIssuer(): Promise<Record<string, number>> {
    const result = await Badge.aggregate([
      {
        $group: {
          _id: '$issuer',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ])

    return result.reduce(
      (acc, item) => {
        acc[item._id] = item.count
        return acc
      },
      {} as Record<string, number>
    )
  }

  invalidateCache(): void {
    this.cache.clear()
    this.logger.debug('Issuance analytics cache cleared')
  }
}

export default BadgeIssuanceAnalytics
