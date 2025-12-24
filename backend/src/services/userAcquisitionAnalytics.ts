import User from '../models/User'
import Badge from '../models/Badge'

export interface UserAcquisitionMetrics {
  totalUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  dailyNewUsers: Array<{
    date: string
    count: number
  }>
  weeklyNewUsers: Array<{
    week: string
    count: number
  }>
  monthlyNewUsers: Array<{
    month: string
    count: number
  }>
  activeUsersToday: number
  activeUsersThisWeek: number
  activeUsersThisMonth: number
  dailyActiveUsers: Array<{
    date: string
    count: number
  }>
  retentionRate: number
  userRetentionCohorts: Array<{
    cohort: string
    retained: number
    percentage: number
  }>
  averageBadgesPerUser: number
  userEngagement: {
    usersWithBadges: number
    usersWithMultipleBadges: number
    usersWithNoBadges: number
  }
}

export class UserAcquisitionAnalytics {
  private logger: any
  private cache: Map<string, { data: UserAcquisitionMetrics; timestamp: number }> =
    new Map()
  private readonly CACHE_TTL_MS = 60000

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[UserAcquisitionAnalytics] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[UserAcquisitionAnalytics] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[UserAcquisitionAnalytics] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[UserAcquisitionAnalytics] ${msg}`, ...args)
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS
  }

  async getAcquisitionMetrics(): Promise<UserAcquisitionMetrics> {
    const cacheKey = 'user_acquisition_metrics'
    const cached = this.cache.get(cacheKey)

    if (cached && this.isCacheValid(cached.timestamp)) {
      this.logger.debug('Cache hit for user acquisition metrics')
      return cached.data
    }

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        totalUsers,
        todayUsers,
        weekUsers,
        monthUsers,
        dailyNewUsers,
        weeklyNewUsers,
        monthlyNewUsers,
        activeToday,
        activeWeek,
        activeMonth,
        dailyActive,
        retentionRate,
        retentionCohorts,
        engagement
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: todayStart } }),
        User.countDocuments({ createdAt: { $gte: weekStart } }),
        User.countDocuments({ createdAt: { $gte: monthStart } }),
        this.getDailyNewUsers(30),
        this.getWeeklyNewUsers(12),
        this.getMonthlyNewUsers(12),
        this.getActiveUsersInRange(todayStart, new Date()),
        this.getActiveUsersInRange(weekStart, new Date()),
        this.getActiveUsersInRange(monthStart, new Date()),
        this.getDailyActiveUsers(30),
        this.calculateRetentionRate(),
        this.getRetentionCohorts(),
        this.getUserEngagementMetrics()
      ])

      const totalBadges = await Badge.countDocuments()
      const avgBadgesPerUser = totalUsers > 0 ? Math.round(totalBadges / totalUsers) : 0

      const metrics: UserAcquisitionMetrics = {
        totalUsers,
        newUsersToday: todayUsers,
        newUsersThisWeek: weekUsers,
        newUsersThisMonth: monthUsers,
        dailyNewUsers,
        weeklyNewUsers,
        monthlyNewUsers,
        activeUsersToday: activeToday,
        activeUsersThisWeek: activeWeek,
        activeUsersThisMonth: activeMonth,
        dailyActiveUsers: dailyActive,
        retentionRate,
        userRetentionCohorts: retentionCohorts,
        averageBadgesPerUser: avgBadgesPerUser,
        userEngagement: engagement
      }

      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() })
      this.logger.debug('User acquisition metrics calculated', {
        total: totalUsers,
        newToday: todayUsers
      })

      return metrics
    } catch (error) {
      this.logger.error('Error calculating user acquisition metrics:', error)
      throw error
    }
  }

  private async getDailyNewUsers(days: number): Promise<UserAcquisitionMetrics['dailyNewUsers']> {
    const result: UserAcquisitionMetrics['dailyNewUsers'] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const count = await User.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      })

      result.push({
        date: dayStart.toISOString().split('T')[0],
        count
      })
    }

    return result
  }

  private async getWeeklyNewUsers(weeks: number): Promise<UserAcquisitionMetrics['weeklyNewUsers']> {
    const result: UserAcquisitionMetrics['weeklyNewUsers'] = []
    const now = new Date()

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      const count = await User.countDocuments({
        createdAt: { $gte: weekStart, $lt: weekEnd }
      })

      result.push({
        week: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
        count
      })
    }

    return result
  }

  private async getMonthlyNewUsers(months: number): Promise<UserAcquisitionMetrics['monthlyNewUsers']> {
    const result: UserAcquisitionMetrics['monthlyNewUsers'] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)

      const count = await User.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      })

      result.push({
        month: monthStart.toISOString().substring(0, 7),
        count
      })
    }

    return result
  }

  private async getActiveUsersInRange(startDate: Date, endDate: Date): Promise<number> {
    const distinctUsers = await Badge.distinct('owner', {
      issuedAt: { $gte: startDate, $lte: endDate }
    })

    return distinctUsers.length
  }

  private async getDailyActiveUsers(days: number): Promise<UserAcquisitionMetrics['dailyActiveUsers']> {
    const result: UserAcquisitionMetrics['dailyActiveUsers'] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const distinctUsers = await Badge.distinct('owner', {
        issuedAt: { $gte: dayStart, $lt: dayEnd }
      })

      result.push({
        date: dayStart.toISOString().split('T')[0],
        count: distinctUsers.length
      })
    }

    return result
  }

  private async calculateRetentionRate(): Promise<number> {
    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const usersInFirstMonth = await User.countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: monthAgo }
    })

    if (usersInFirstMonth === 0) return 0

    const retainedUsers = await Badge.distinct('owner', {
      issuedAt: { $gte: monthAgo }
    })

    const originalUsers = await User.find({
      createdAt: { $gte: twoMonthsAgo, $lt: monthAgo }
    }).select('owner')

    const originalOwners = new Set(originalUsers.map((u) => u.owner || u._id?.toString()))
    const retainedSet = new Set(retainedUsers)

    const retained = Array.from(originalOwners).filter((owner) =>
      retainedSet.has(owner)
    ).length

    return Math.round((retained / usersInFirstMonth) * 100)
  }

  private async getRetentionCohorts(): Promise<UserAcquisitionMetrics['userRetentionCohorts']> {
    const result: UserAcquisitionMetrics['userRetentionCohorts'] = []
    const now = new Date()

    for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
      const cohortStart = new Date(
        now.getFullYear(),
        now.getMonth() - monthOffset - 1,
        1
      )
      const cohortEnd = new Date(
        cohortStart.getFullYear(),
        cohortStart.getMonth() + 1,
        1
      )

      const cohortUsers = await User.find({
        createdAt: { $gte: cohortStart, $lt: cohortEnd }
      }).select('owner')

      if (cohortUsers.length === 0) continue

      const owners = new Set(cohortUsers.map((u) => u.owner || u._id?.toString()))
      const retainedUsers = await Badge.distinct('owner', {
        issuedAt: { $gte: cohortStart }
      })

      const retained = Array.from(owners).filter((owner) =>
        retainedUsers.includes(owner)
      ).length

      result.push({
        cohort: cohortStart.toISOString().substring(0, 7),
        retained,
        percentage: Math.round((retained / cohortUsers.length) * 100)
      })
    }

    return result
  }

  private async getUserEngagementMetrics(): Promise<UserAcquisitionMetrics['userEngagement']> {
    const [usersWithBadges, allUsers] = await Promise.all([
      Badge.distinct('owner'),
      User.countDocuments()
    ])

    const usersWithBadgesCount = usersWithBadges.length
    const usersWithNoBadgesCount = allUsers - usersWithBadgesCount

    const multipleAchievements = await Badge.aggregate([
      {
        $group: {
          _id: '$owner',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $count: 'total'
      }
    ])

    const usersWithMultiple =
      multipleAchievements.length > 0 ? multipleAchievements[0].total : 0

    return {
      usersWithBadges: usersWithBadgesCount,
      usersWithMultipleBadges: usersWithMultiple,
      usersWithNoBadges: usersWithNoBadgesCount
    }
  }

  invalidateCache(): void {
    this.cache.clear()
    this.logger.debug('User acquisition analytics cache cleared')
  }
}

export default UserAcquisitionAnalytics
