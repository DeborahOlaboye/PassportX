import mongoose, { Schema } from 'mongoose'
import { IBadgeTemplate } from '../types'

const badgeTemplateSchema = new Schema<IBadgeTemplate>({
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
  category: {
    type: String,
    required: true,
    enum: ['skill', 'participation', 'contribution', 'leadership', 'learning', 'achievement', 'milestone']
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  icon: {
    type: String,
    default: '🏆'
  },
  requirements: {
    type: String,
    maxlength: 1000
  },
  community: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
    index: true
  },
  creator: {
    type: String,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

badgeTemplateSchema.index({ community: 1, isActive: 1 })
badgeTemplateSchema.index({ creator: 1 })
badgeTemplateSchema.index({ category: 1, level: 1 })

export default mongoose.model<IBadgeTemplate>('BadgeTemplate', badgeTemplateSchema)