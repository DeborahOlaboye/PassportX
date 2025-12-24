import mongoose from 'mongoose'
import { IAlert } from '../types'

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['performance', 'connection', 'failed_event', 'anomaly'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  resolved: {
    type: Boolean,
    required: true,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  resolvedAt: Date
}, {
  timestamps: true,
  collection: 'alerts'
})

alertSchema.index({ createdAt: -1 })
alertSchema.index({ severity: 1, resolved: 1 })
alertSchema.index({ type: 1, createdAt: -1 })

export default mongoose.model<IAlert>('Alert', alertSchema)
