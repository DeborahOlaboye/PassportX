import { api } from '../api'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

export interface AnalyticsMetrics {
  totalBadges: number
  badgesChange: number
  activeUsers: number
  activeUsersChange: number
  engagementRate: number
  engagementChange: number
  avgSessionDuration: number
  sessionDurationChange: number
}

export interface TimeSeriesData {
  date: string
  newUsers: number
  activeUsers: number
}

export interface BadgeData {
  badgeId: string
  name: string
  count: number
  category?: string
}

export interface ActivityData {
  id: string
  type: 'badge_issued' | 'user_joined' | 'community_created' | 'badge_revoked'
  message: string
  timestamp: Date
  user?: string
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics
  timeSeries: TimeSeriesData[]
  topBadges: BadgeData[]
  badgeDistribution: Array<{
    name: string
    value: number
    category: string
  }>
  engagementMetrics: {
    totalInteractions: number
    avgInteractionPerUser: number
    peakTime: string
  }
  growthMetrics: {
    weeklyGrowth: number
    monthlyGrowth: number
    retentionRate: number
  }
  recentActivities: ActivityData[]
}

export async function fetchAnalyticsData(options: {
  startDate: Date
  endDate: Date
  timeRange: TimeRange
}): Promise<AnalyticsData> {
  try {
    const params = new URLSearchParams({
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      timeRange: options.timeRange
    })

    const response = await fetch(`/api/analytics/aggregated?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch analytics data')
    }

    return transformAnalyticsResponse(result.data)
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    throw error
  }
}

function transformAnalyticsResponse(data: any): AnalyticsData {
  const issuance = data.issuance || {}
  const community = data.community || {}
  const users = data.users || {}
  const distribution = data.distribution || {}

  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const totalBadgesLastMonth = issuance.badgesIssuedThisMonth || 0
  const totalBadgesBeforeMonth =
    (issuance.totalBadgesIssued || 0) - totalBadgesLastMonth

  const badgesChange =
    totalBadgesBeforeMonth > 0
      ? Math.round(((totalBadgesLastMonth - totalBadgesBeforeMonth) /
          totalBadgesBeforeMonth) *
          100)
      : 0

  const activeUsersChange = Math.round(
    ((users.activeUsersThisMonth - users.activeUsersThisWeek) /
      Math.max(users.activeUsersThisWeek, 1)) *
      100
  )

  const engagementRate = data.metrics?.engagementRate || 0
  const retentionRate = users.retentionRate || 0
  const engagementChange = Math.round(retentionRate - engagementRate)

  const dailyIssuance = issuance.dailyIssuance || []
  const dailyActiveUsers = users.dailyActiveUsers || []
  const dailyNewUsers = users.dailyNewUsers || []

  const timeSeries = dailyIssuance.map((item: any, index: number) => ({
    date: item.date,
    newUsers: dailyNewUsers[index]?.count || 0,
    activeUsers: dailyActiveUsers[index]?.count || 0
  }))

  const topBadges =
    distribution.topBadges?.map((badge: any) => ({
      badgeId: badge.badgeId,
      name: badge.badgeName,
      count: badge.issuedCount,
      category: badge.category
    })) || []

  const badgeDistributionByCategory =
    distribution.byCategory?.map((item: any) => ({
      name: item.category,
      value: item.count,
      category: item.category
    })) || []

  const totalInteractions =
    timeSeries.reduce((sum: number, item: any) => sum + item.activeUsers, 0) || 0

  const avgInteractionPerUser =
    users.totalUsers > 0
      ? Math.round(totalInteractions / users.totalUsers)
      : 0

  const peakTime = getPeakTime(dailyActiveUsers)

  const weeklyGrowth = calculateGrowthRate(
    dailyNewUsers.slice(-7)
  )
  const monthlyGrowth = calculateGrowthRate(
    dailyNewUsers.slice(-30)
  )

  return {
    metrics: {
      totalBadges: issuance.totalBadgesIssued || 0,
      badgesChange,
      activeUsers: users.activeUsersThisMonth || 0,
      activeUsersChange,
      engagementRate,
      engagementChange,
      avgSessionDuration: 45,
      sessionDurationChange: 12
    },
    timeSeries,
    topBadges,
    badgeDistribution: badgeDistributionByCategory,
    engagementMetrics: {
      totalInteractions,
      avgInteractionPerUser,
      peakTime
    },
    growthMetrics: {
      weeklyGrowth,
      monthlyGrowth,
      retentionRate: users.retentionRate || 0
    },
    recentActivities: generateMockRecentActivities()
  }
}

function getPeakTime(dailyData: any[]): string {
  if (!Array.isArray(dailyData) || dailyData.length === 0) {
    return '2 PM'
  }

  const maxIndex = dailyData.reduce((maxIdx, item, idx, arr) => {
    return item.count > (arr[maxIdx]?.count || 0) ? idx : maxIdx
  }, 0)

  const hours = Math.round((maxIndex / dailyData.length) * 24)
  return `${hours % 12 || 12} ${hours < 12 ? 'AM' : 'PM'}`
}

function calculateGrowthRate(data: any[]): number {
  if (!Array.isArray(data) || data.length < 2) {
    return 0
  }

  const first = data[0]?.count || 0
  const last = data[data.length - 1]?.count || 0

  if (first === 0) {
    return last > 0 ? 100 : 0
  }

  return Math.round(((last - first) / first) * 100)
}

function generateMockRecentActivities(): ActivityData[] {
  const activities: ActivityData[] = [
    {
      id: '1',
      type: 'badge_issued',
      message: 'Achievement badge "Developer Pro" awarded to 5 users',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'System'
    },
    {
      id: '2',
      type: 'user_joined',
      message: '12 new users joined the platform',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      user: 'System'
    },
    {
      id: '3',
      type: 'community_created',
      message: 'New community "Web Developers" created',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      user: 'System'
    },
    {
      id: '4',
      type: 'badge_issued',
      message: 'Achievement badge "Code Reviewer" awarded to 3 users',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      user: 'System'
    },
    {
      id: '5',
      type: 'user_joined',
      message: '8 new users joined the platform',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      user: 'System'
    }
  ]

  return activities
}

export async function getAnalyticsSnapshot(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  try {
    const response = await fetch(
      `/api/analytics/snapshots?period=${period}&limit=30`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch snapshots: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error fetching analytics snapshots:', error)
    return []
  }
}

export async function getMetricsTrend(metric: string, days: number = 30) {
  try {
    const response = await fetch(
      `/api/analytics/trends/${metric}?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics trend: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data?.trend || []
  } catch (error) {
    console.error('Error fetching metrics trend:', error)
    return []
  }
}

export async function recordAnalyticsSnapshot(
  period: 'hourly' | 'daily' | 'weekly' = 'daily'
) {
  try {
    const response = await fetch('/api/analytics/snapshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ period })
    })

    if (!response.ok) {
      throw new Error(`Failed to record snapshot: ${response.statusText}`)
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Error recording analytics snapshot:', error)
    return false
  }
}
