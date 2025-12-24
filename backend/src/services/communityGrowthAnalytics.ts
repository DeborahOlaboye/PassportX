import Community from '../models/Community'
import User from '../models/User'
import Badge from '../models/Badge'

export interface CommunityGrowthMetrics {
  totalCommunities: number
  newCommunitiesToday: number
  newCommunitiesThisWeek: number
  newCommunitiesThisMonth: number
  dailyNewCommunities: Array<{
    date: string
    count: number
  }>
  totalCommunityMembers: number
  avgMembersPerCommunity: number
  mostActiveCommunities: Array<{
    id: string
    name: string
    memberCount: number
    badgesIssued: number
    createdAt: string
  }>
  communityGrowthTrend: Array<{
    date: string
    totalCommunities: number
    totalMembers: number
  }>
  badgesByTopCommunities: Array<{
    communityId: string
    communityName: string
    badgeCount: number
    uniqueRecipients: number
  }>
}

export class CommunityGrowthAnalytics {
  private logger: any
  private cache: Map<string, { data: CommunityGrowthMetrics; timestamp: number }> =
    new Map()
  private readonly CACHE_TTL_MS = 60000

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[CommunityGrowthAnalytics] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[CommunityGrowthAnalytics] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[CommunityGrowthAnalytics] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[CommunityGrowthAnalytics] ${msg}`, ...args)
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS
  }

  async getGrowthMetrics(): Promise<CommunityGrowthMetrics> {
    const cacheKey = 'community_growth_metrics'
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.logger.debug('Cache hit for community growth metrics')
      return cached.data
    }

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        totalCommunities,
        todayCommunities,
        weekCommunities,
        monthCommunities,
        dailyNewCommunities,
        mostActive,
        growthTrend,
        topCommunityBadges
      ] = await Promise.all([
        Community.countDocuments(),
        Community.countDocuments({ createdAt: { $gte: todayStart } }),
        Community.countDocuments({ createdAt: { $gte: weekStart } }),
        Community.countDocuments({ createdAt: { $gte: monthStart } }),
        this.getDailyNewCommunities(30),
        this.getMostActiveCommunities(10),
        this.getGrowthTrend(30),
        this.getBadgesByTopCommunities(10)
      ])

      const allMembers = await this.getTotalCommunityMembers()
      const avgMembers =
        totalCommunities > 0 ? Math.round(allMembers / totalCommunities) : 0

      const metrics: CommunityGrowthMetrics = {
        totalCommunities,
        newCommunitiesToday: todayCommunities,
        newCommunitiesThisWeek: weekCommunities,
        newCommunitiesThisMonth: monthCommunities,
        dailyNewCommunities,
        totalCommunityMembers: allMembers,
        avgMembersPerCommunity: avgMembers,
        mostActiveCommunities: mostActive,
        communityGrowthTrend: growthTrend,
        badgesByTopCommunities: topCommunityBadges
      }

      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() })
      this.logger.debug('Community growth metrics calculated', {
        total: totalCommunities,
        newToday: todayCommunities
      })

      return metrics
    } catch (error) {
      this.logger.error('Error calculating community growth metrics:', error)
      throw error
    }
  }

  private async getDailyNewCommunities(
    days: number
  ): Promise<CommunityGrowthMetrics['dailyNewCommunities']> {
    const result: CommunityGrowthMetrics['dailyNewCommunities'] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const count = await Community.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      })

      result.push({
        date: dayStart.toISOString().split('T')[0],
        count
      })
    }

    return result
  }

  private async getMostActiveCommunities(
    limit: number
  ): Promise<CommunityGrowthMetrics['mostActiveCommunities']> {
    const communities = await Community.find()
      .sort({ createdAt: -1 })
      .limit(limit)

    const result: CommunityGrowthMetrics['mostActiveCommunities'] = []

    for (const community of communities) {
      const memberCount = community.members?.length || 0
      const badgeCount = await Badge.countDocuments({ community: community._id })

      result.push({
        id: community._id?.toString() || '',
        name: community.name,
        memberCount,
        badgesIssued: badgeCount,
        createdAt: community.createdAt?.toISOString() || ''
      })
    }

    return result.sort((a, b) => b.badgesIssued - a.badgesIssued)
  }

  private async getGrowthTrend(
    days: number
  ): Promise<CommunityGrowthMetrics['communityGrowthTrend']> {
    const result: CommunityGrowthMetrics['communityGrowthTrend'] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const totalCommunities = await Community.countDocuments({
        createdAt: { $lt: dayEnd }
      })

      const totalMembers = await User.countDocuments()

      result.push({
        date: dayStart.toISOString().split('T')[0],
        totalCommunities,
        totalMembers
      })
    }

    return result
  }

  private async getBadgesByTopCommunities(
    limit: number
  ): Promise<CommunityGrowthMetrics['badgesByTopCommunities']> {
    const result = await Community.aggregate([
      {
        $lookup: {
          from: 'badges',
          localField: '_id',
          foreignField: 'community',
          as: 'badges'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          badgeCount: { $size: '$badges' },
          uniqueRecipients: {
            $size: { $setUnion: [{ $map: { input: '$badges', as: 'b', in: '$$b.owner' } }] }
          }
        }
      },
      {
        $sort: { badgeCount: -1 }
      },
      {
        $limit: limit
      }
    ])

    return result.map((item) => ({
      communityId: item._id?.toString() || '',
      communityName: item.name,
      badgeCount: item.badgeCount,
      uniqueRecipients: item.uniqueRecipients
    }))
  }

  private async getTotalCommunityMembers(): Promise<number> {
    const result = await Community.aggregate([
      {
        $group: {
          _id: null,
          totalMembers: { $sum: { $size: '$members' } }
        }
      }
    ])

    return result.length > 0 ? result[0].totalMembers : 0
  }

  invalidateCache(): void {
    this.cache.clear()
    this.logger.debug('Community growth analytics cache cleared')
  }
}

export default CommunityGrowthAnalytics
