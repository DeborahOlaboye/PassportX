import mongoose, { Schema } from 'mongoose'
import { ICommunity } from '../types'

const communitySchema = new Schema<ICommunity>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  admin: {
    type: String,
    required: true,
    index: true
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    logo: String
  },
  memberCount: {
    type: Number,
    default: 0
  },
  badgeTemplates: [{
    type: Schema.Types.ObjectId,
    ref: 'BadgeTemplate'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

communitySchema.index({ admin: 1 })
communitySchema.index({ isActive: 1 })
communitySchema.index({ name: 'text', description: 'text' })

export default mongoose.model<ICommunity>('Community', communitySchema)