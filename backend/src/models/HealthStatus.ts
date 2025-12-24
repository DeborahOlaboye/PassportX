import mongoose from 'mongoose'
import { IHealthStatus } from '../types'

const healthStatusSchema = new mongoose.Schema({
  nodeUrl: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isConnected: {
    type: Boolean,
    required: true,
    default: false
  },
  lastCheckTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  uptime: {
    type: Number,
    required: true,
    default: 0
  },
  failedAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  successfulAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'health_status'
})

healthStatusSchema.index({ lastCheckTime: -1 })

export default mongoose.model<IHealthStatus>('HealthStatus', healthStatusSchema)
