import mongoose, { Schema } from 'mongoose'
import { IUser } from '../types'

const userSchema = new Schema<IUser>({
  stacksAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String
  },
  customUrl: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    minlength: 3,
    maxlength: 30
  },
  socialLinks: {
    twitter: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    discord: { type: String, trim: true },
    website: { type: String, trim: true }
  },
  themePreferences: {
    mode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    accentColor: { type: String, trim: true }
  },
  notificationPreferences: {
    badgeReceived: { type: Boolean, default: true },
    communityUpdates: { type: Boolean, default: true },
    systemAnnouncements: { type: Boolean, default: true },
    badgeIssued: { type: Boolean, default: true },
    communityInvite: { type: Boolean, default: true },
    badgeVerified: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  communities: [{
    type: Schema.Types.ObjectId,
    ref: 'Community'
  }],
  adminCommunities: [{
    type: Schema.Types.ObjectId,
    ref: 'Community'
  }]
}, {
  timestamps: true
})

userSchema.index({ stacksAddress: 1 })
userSchema.index({ isPublic: 1 })
userSchema.index({ customUrl: 1 })

export default mongoose.model<IUser>('User', userSchema)