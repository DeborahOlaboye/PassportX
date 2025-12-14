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

export default mongoose.model<IUser>('User', userSchema)