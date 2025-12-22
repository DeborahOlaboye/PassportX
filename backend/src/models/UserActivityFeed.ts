import mongoose, { Schema } from 'mongoose'

export type ActivityEventType = 
  | 'badge_received' 
  | 'badge_revoked' 
  | 'community_joined' 
  | 'community_created'
  | 'badge_metadata_updated'
  | 'passport_created'

export interface IUserActivityFeed {
  _id?: mongoose.Types.ObjectId
  userId: string
  eventType: ActivityEventType
  title: string
  description: string
  icon?: string
  metadata: {
    badgeId?: string
    badgeName?: string
    communityId?: string
    communityName?: string
    level?: number
    category?: string
    revocationType?: 'soft' | 'hard'
    blockHeight?: number
    transactionHash?: string
    contractAddress?: string
  }
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

const userActivityFeedSchema = new Schema<IUserActivityFeed>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: [
        'badge_received',
        'badge_revoked',
        'community_joined',
        'community_created',
        'badge_metadata_updated',
        'passport_created'
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String
    },
    metadata: {
      badgeId: String,
      badgeName: String,
      communityId: String,
      communityName: String,
      level: Number,
      category: String,
      revocationType: {
        type: String,
        enum: ['soft', 'hard']
      },
      blockHeight: Number,
      transactionHash: String,
      contractAddress: String
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes for efficient querying
userActivityFeedSchema.index({ userId: 1, createdAt: -1 })
userActivityFeedSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
userActivityFeedSchema.index({ userId: 1, eventType: 1, createdAt: -1 })
userActivityFeedSchema.index({ userId: 1, 'metadata.badgeId': 1 })
userActivityFeedSchema.index({ userId: 1, 'metadata.communityId': 1 })

// TTL index to auto-delete old activity after 90 days
userActivityFeedSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
)

export default mongoose.model<IUserActivityFeed>('UserActivityFeed', userActivityFeedSchema)
