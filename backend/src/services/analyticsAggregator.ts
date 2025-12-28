import { EventEmitter } from 'events'
import BadgeIssuanceAnalytics, { IssuanceMetrics } from './badgeIssuanceAnalytics'
import CommunityGrowthAnalytics, { CommunityGrowthMetrics } from './communityGrowthAnalytics'
import UserAcquisitionAnalytics, { UserAcquisitionMetrics } from './userAcquisitionAnalytics'
import BadgeDistributionAnalytics, { BadgeDistribution } from './badgeDistributionAnalytics'
import AnalyticsSnapshot from '../models/AnalyticsSnapshot'

export interface AggregatedAnalytics {
  timestamp: Date
  issuance: IssuanceMetrics
  community: CommunityGrowthMetrics
  users: UserAcquisitionMetrics
  distribution: BadgeDistribution
  metrics: {
    totalBadgesIssued: number
    totalUsers: number
    totalCommunities: number
    averageBadgesPerUser: number
    engagementRate: number
  }
}

export interface AnalyticsSnapshot {
  period: 'hourly' | 'daily' | 'weekly'
  aggregatedData: AggregatedAnalytics
  savedAt: Date
}

export class AnalyticsAggregator extends EventEmitter {
  private issuanceAnalytics: BadgeIssuanceAnalytics
  private communityAnalytics: CommunityGrowthAnalytics
  private userAnalytics: UserAcquisitionAnalytics
  private distributionAnalytics: BadgeDistributionAnalytics
  private logger: any

  private pendingUpdates: Set<string> = new Set()
  private updateBatchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_TIMEOUT_MS = 5000
  private readonly MAX_PENDING_UPDATES = 100

  private cache: Map<string, { data: AggregatedAnalytics; timestamp: number }> = new Map()
  private readonly CACHE_TTL_MS = 300000

  constructor(logger?: any) {
    super()
    this.logger = logger || this.getDefaultLogger()
    this.issuanceAnalytics = new BadgeIssuanceAnalytics(logger)
    this.communityAnalytics = new CommunityGrowthAnalytics(logger)
    this.userAnalytics = new UserAcquisitionAnalytics(logger)
    this.distributionAnalytics = new BadgeDistributionAnalytics(logger)
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[AnalyticsAggregator] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[AnalyticsAggregator] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[AnalyticsAggregator] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[AnalyticsAggregator] ${msg}`, ...args)
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS
  }

  async getAggregatedAnalytics(): Promise<AggregatedAnalytics> {
    const cacheKey = 'aggregated_analytics'
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.logger.debug('Cache hit for aggregated analytics')
      return cached.data
    }

    try {
      this.logger.info('Aggregating analytics data')

      const [issuance, community, users, distribution] = await Promise.all([
        this.issuanceAnalytics.getIssuanceMetrics(),
        this.communityAnalytics.getGrowthMetrics(),
        this.userAnalytics.getAcquisitionMetrics(),
        this.distributionAnalytics.getDistribution()
      ])

      const aggregated: AggregatedAnalytics = {
        timestamp: new Date(),
        issuance,
        community,
        users,
        distribution,
        metrics: {
          totalBadgesIssued: issuance.totalBadgesIssued,
          totalUsers: users.totalUsers,
          totalCommunities: community.totalCommunities,
          averageBadgesPerUser: users.averageBadgesPerUser,
          engagementRate:
            users.totalUsers > 0
              ? Math.round((users.userEngagement.usersWithBadges / users.totalUsers) * 100)
              : 0
        }
      }

      this.cache.set(cacheKey, { data: aggregated, timestamp: Date.now() })
      this.emit('analytics:aggregated', aggregated)

      return aggregated
    } catch (error) {
      this.logger.error('Error aggregating analytics:', error)
      throw error
    }
  }

  async recordAnalyticsSnapshot(period: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    try {
      const aggregated = await this.getAggregatedAnalytics()

      const snapshot = await AnalyticsSnapshot.create({
        timestamp: new Date(),
        period,
        metrics: {
          totalBadgesIssued: aggregated.metrics.totalBadgesIssued,
          badgesIssuedThisPeriod: aggregated.issuance.badgesIssuedToday,
          totalUsers: aggregated.metrics.totalUsers,
          newUsersThisPeriod: aggregated.users.newUsersToday,
          activeUsersThisPeriod: aggregated.users.activeUsersToday,
          retentionRate: aggregated.users.retentionRate,
          totalCommunities: aggregated.metrics.totalCommunities,
          newCommunitiesThisPeriod: aggregated.community.newCommunitiesToday,
          averageBadgesPerUser: aggregated.metrics.averageBadgesPerUser,
          engagementRate: aggregated.metrics.engagementRate,
          avgBadgesPerCommunity:
            aggregated.community.totalCommunities > 0
              ? Math.round(
                  aggregated.issuance.totalBadgesIssued / aggregated.community.totalCommunities
                )
              : 0
        },
        distribution: {
          badgesByCategory: Object.fromEntries(
            aggregated.distribution.byCategory.map((c) => [c.category, c.count])
          ),
          badgesByLevel: Object.fromEntries(
            aggregated.distribution.byLevel.map((l) => [l.level.toString(), l.count])
          ),
          badgesByIssuer: Object.fromEntries(
            aggregated.distribution.badgesByIssuer
              .slice(0, 10)
              .map((i) => [i.issuer, i.totalIssued])
          ),
          topBadges: aggregated.distribution.topBadges.slice(0, 10),
          topCommunities: aggregated.community.mostActiveCommunities.slice(0, 10)
        },
        trends: {
          dailyIssuance: aggregated.issuance.dailyIssuance.slice(-30),
          dailyNewUsers: aggregated.users.dailyNewUsers.slice(-30),
          dailyActiveUsers: aggregated.users.dailyActiveUsers.slice(-30)
        }
      })

      this.logger.info('Analytics snapshot recorded', {
        period,
        snapshotId: snapshot._id
      })

      this.emit('analytics:snapshot-recorded', {
        period,
        snapshotId: snapshot._id,
        timestamp: snapshot.timestamp
      })
    } catch (error) {
      this.logger.error('Error recording analytics snapshot:', error)
      throw error
    }
  }

  requestAnalyticsUpdate(eventType: string): void {
    this.pendingUpdates.add(eventType)

    if (this.pendingUpdates.size >= this.MAX_PENDING_UPDATES) {
      this.processPendingUpdates()
    } else if (!this.updateBatchTimeout) {
      this.updateBatchTimeout = setTimeout(() => {
        this.processPendingUpdates()
      }, this.BATCH_TIMEOUT_MS)
    }
  }

  private processPendingUpdates(): void {
    if (this.updateBatchTimeout) {
      clearTimeout(this.updateBatchTimeout)
      this.updateBatchTimeout = null
    }

    if (this.pendingUpdates.size === 0) {
      return
    }

    const events = Array.from(this.pendingUpdates)
    this.pendingUpdates.clear()

    this.logger.debug('Processing batch analytics update', {
      eventCount: events.length,
      eventTypes: events
    })

    this.invalidateCache()
    this.emit('analytics:batch-update', {
      events,
      timestamp: Date.now()
    })
  }

  private invalidateCache(): void {
    this.cache.clear()
    this.issuanceAnalytics.invalidateCache()
    this.communityAnalytics.invalidateCache()
    this.userAnalytics.invalidateCache()
    this.distributionAnalytics.invalidateCache()
    this.logger.debug('All analytics caches invalidated')
  }

  async getAnalyticsSnapshot(period: string, limit: number = 100): Promise<any[]> {
    try {
      return await AnalyticsSnapshot.find({ period })
        .sort({ timestamp: -1 })
        .limit(limit)
    } catch (error) {
      this.logger.error('Error retrieving analytics snapshots:', error)
      throw error
    }
  }

  async getMetricsTrend(
    metric: string,
    days: number = 30
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const snapshots = await AnalyticsSnapshot.find({
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 })

      return snapshots.map((snapshot) => ({
        date: snapshot.timestamp.toISOString().split('T')[0],
        value: (snapshot.metrics as any)[metric] || 0
      }))
    } catch (error) {
      this.logger.error('Error retrieving metrics trend:', error)
      throw error
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.updateBatchTimeout) {
        clearTimeout(this.updateBatchTimeout)
        this.updateBatchTimeout = null
      }

      this.processPendingUpdates()
      this.removeAllListeners()

      this.logger.info('Analytics aggregator cleaned up')
    } catch (error) {
      this.logger.error('Error during cleanup:', error)
    }
  }
}

export default AnalyticsAggregator
