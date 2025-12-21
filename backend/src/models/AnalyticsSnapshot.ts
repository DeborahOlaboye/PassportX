import mongoose, { Schema } from 'mongoose'

export interface IAnalyticsSnapshot {
  _id?: mongoose.Types.ObjectId
  timestamp: Date
  period: 'daily' | 'weekly' | 'monthly'
  metrics: {
    totalBadgesIssued: number
    badgesIssuedThisPeriod: number
    totalUsers: number
    newUsersThisPeriod: number
    activeUsersThisPeriod: number
    retentionRate: number
    totalCommunities: number
    newCommunitiesThisPeriod: number
    averageBadgesPerUser: number
    engagementRate: number
    avgBadgesPerCommunity: number
  }
  distribution: {
    badgesByCategory: Record<string, number>
    badgesByLevel: Record<number, number>
    badgesByIssuer: Record<string, number>
    topBadges: Array<{
      badgeId: string
      name: string
      count: number
      category: string
    }>
    topCommunities: Array<{
      communityId: string
      name: string
      badgesIssued: number
    }>
  }
  trends: {
    dailyIssuance: Array<{
      date: string
      count: number
    }>
    dailyNewUsers: Array<{
      date: string
      count: number
    }>
    dailyActiveUsers: Array<{
      date: string
      count: number
    }>
  }
  createdAt: Date
  updatedAt: Date
}

const analyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
      index: true
    },
    metrics: {
      totalBadgesIssued: {
        type: Number,
        required: true,
        default: 0
      },
      badgesIssuedThisPeriod: {
        type: Number,
        required: true,
        default: 0
      },
      totalUsers: {
        type: Number,
        required: true,
        default: 0
      },
      newUsersThisPeriod: {
        type: Number,
        required: true,
        default: 0
      },
      activeUsersThisPeriod: {
        type: Number,
        required: true,
        default: 0
      },
      retentionRate: {
        type: Number,
        required: true,
        default: 0
      },
      totalCommunities: {
        type: Number,
        required: true,
        default: 0
      },
      newCommunitiesThisPeriod: {
        type: Number,
        required: true,
        default: 0
      },
      averageBadgesPerUser: {
        type: Number,
        required: true,
        default: 0
      },
      engagementRate: {
        type: Number,
        required: true,
        default: 0
      },
      avgBadgesPerCommunity: {
        type: Number,
        required: true,
        default: 0
      }
    },
    distribution: {
      badgesByCategory: {
        type: Map,
        of: Number,
        default: new Map()
      },
      badgesByLevel: {
        type: Map,
        of: Number,
        default: new Map()
      },
      badgesByIssuer: {
        type: Map,
        of: Number,
        default: new Map()
      },
      topBadges: [
        {
          badgeId: String,
          name: String,
          count: Number,
          category: String
        }
      ],
      topCommunities: [
        {
          communityId: String,
          name: String,
          badgesIssued: Number
        }
      ]
    },
    trends: {
      dailyIssuance: [
        {
          date: String,
          count: Number
        }
      ],
      dailyNewUsers: [
        {
          date: String,
          count: Number
        }
      ],
      dailyActiveUsers: [
        {
          date: String,
          count: Number
        }
      ]
    }
  },
  {
    timestamps: true
  }
)

// Indexes for efficient querying
analyticsSnapshotSchema.index({ timestamp: -1 })
analyticsSnapshotSchema.index({ period: 1, timestamp: -1 })
analyticsSnapshotSchema.index({ 'metrics.totalBadgesIssued': -1 })

export default mongoose.model<IAnalyticsSnapshot>(
  'AnalyticsSnapshot',
  analyticsSnapshotSchema
)
