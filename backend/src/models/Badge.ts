import mongoose, { Schema } from 'mongoose'
import { IBadge } from '../types'

const badgeSchema = new Schema<IBadge>({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'BadgeTemplate',
    required: true,
    index: true
  },
  owner: {
    type: String,
    required: true,
    index: true
  },
  issuer: {
    type: String,
    required: true,
    index: true
  },
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true
  },
  tokenId: {
    type: Number,
    sparse: true
  },
  transactionId: {
    type: String,
    sparse: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    level: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
})

// Existing indexes
badgeSchema.index({ owner: 1, issuedAt: -1 })
badgeSchema.index({ community: 1, issuedAt: -1 })
badgeSchema.index({ templateId: 1 })
badgeSchema.index({ tokenId: 1 }, { sparse: true })

// Search and filter indexes
badgeSchema.index({ 'metadata.level': 1, issuedAt: -1 })
badgeSchema.index({ 'metadata.category': 1, issuedAt: -1 })
badgeSchema.index({ issuer: 1, issuedAt: -1 })
badgeSchema.index({ issuedAt: -1 })

// Compound indexes for common queries
badgeSchema.index({ 'metadata.level': 1, 'metadata.category': 1, issuedAt: -1 })
badgeSchema.index({ community: 1, 'metadata.level': 1, issuedAt: -1 })
badgeSchema.index({ owner: 1, 'metadata.category': 1, issuedAt: -1 })

export default mongoose.model<IBadge>('Badge', badgeSchema)