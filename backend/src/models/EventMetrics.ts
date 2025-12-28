import mongoose from 'mongoose'
import { IEventMetrics } from '../types'

const eventMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  eventsReceived: {
    type: Number,
    required: true,
    default: 0
  },
  eventsProcessed: {
    type: Number,
    required: true,
    default: 0
  },
  eventsFailed: {
    type: Number,
    required: true,
    default: 0
  },
  averageProcessingTime: {
    type: Number,
    required: true,
    default: 0
  },
  minProcessingTime: {
    type: Number,
    required: true,
    default: 0
  },
  maxProcessingTime: {
    type: Number,
    required: true,
    default: 0
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected'],
    required: true,
    default: 'disconnected'
  },
  lastConnectionCheck: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'event_metrics'
})

eventMetricsSchema.index({ timestamp: -1 })

export default mongoose.model<IEventMetrics>('EventMetrics', eventMetricsSchema)
