import mongoose from 'mongoose'
import { IProcessedEvent } from '../types'

const processedEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalEvent: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  contractAddress: {
    type: String,
    index: true
  },
  method: {
    type: String,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    index: true
  },
  blockHeight: {
    type: Number,
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  processedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['processed', 'failed', 'queued'],
    required: true,
    index: true
  },
  error: String,
  replayCount: {
    type: Number,
    default: 0
  },
  lastReplayedAt: Date
}, {
  timestamps: true,
  collection: 'processed_events'
})

// Compound indexes for efficient querying
processedEventSchema.index({ eventType: 1, blockHeight: -1 })
processedEventSchema.index({ timestamp: -1, eventType: 1 })
processedEventSchema.index({ processedAt: -1 })

const ProcessedEvent = mongoose.model<IProcessedEvent>('ProcessedEvent', processedEventSchema)

export default ProcessedEvent