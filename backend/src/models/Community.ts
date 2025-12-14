import mongoose, { Schema } from 'mongoose'
import { ICommunity } from '../types'

const communitySchema = new Schema<ICommunity>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  about: {
    type: String,
    maxlength: 5000
  },
  website: {
    type: String,
    match: /^https?:\/\/[\w\d-]+(\.[\w\d-]+)+[/#?]?.*$/
  },
  admins: [{
    type: String,
    required: true,
    index: true
  }],
  theme: {
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    secondaryColor: {
      type: String,
      default: '#10b981'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    textColor: {
      type: String,
      default: '#1f2937'
    },
    borderRadius: {
      type: String,
      default: '0.5rem'
    },
    logo: {
      url: String,
      width: Number,
      height: Number
    },
    bannerImage: {
      url: String,
      width: Number,
      height: Number
    }
  },
  socialLinks: {
    twitter: String,
    discord: String,
    telegram: String,
    github: String,
    linkedin: String
  },
  memberCount: {
    type: Number,
    default: 0,
    min: 0
  },
  badgeTemplates: [{
    type: Schema.Types.ObjectId,
    ref: 'BadgeTemplate'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowBadgeIssuance: {
      type: Boolean,
      default: true
    },
    allowCustomBadges: {
      type: Boolean,
      default: false
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

communitySchema.index({ admin: 1 })
communitySchema.index({ isActive: 1 })
communitySchema.index({ name: 'text', description: 'text' })

export default mongoose.model<ICommunity>('Community', communitySchema)