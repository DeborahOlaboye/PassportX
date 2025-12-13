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

badgeSchema.index({ owner: 1, issuedAt: -1 })
badgeSchema.index({ community: 1, issuedAt: -1 })
badgeSchema.index({ templateId: 1 })
badgeSchema.index({ tokenId: 1 }, { sparse: true })

export default mongoose.model<IBadge>('Badge', badgeSchema)