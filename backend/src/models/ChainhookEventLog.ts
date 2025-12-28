import mongoose from 'mongoose'
import { IChainhookEventLog } from '../types'

const chainhookEventLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['received', 'processing', 'completed', 'failed'],
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  processingTime: {
    type: Number,
    index: true
  },
  errorMessage: String,
  handler: String,
  receivedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  transactionHash: {
    type: String,
    index: true
  },
  blockHeight: {
    type: Number,
    index: true
  }
}, {
  timestamps: true,
  collection: 'chainhook_event_logs'
})

chainhookEventLogSchema.index({ receivedAt: -1 })
chainhookEventLogSchema.index({ status: 1, receivedAt: -1 })
chainhookEventLogSchema.index({ eventType: 1, receivedAt: -1 })
chainhookEventLogSchema.index({ 'payload.transactions.transaction_hash': 1 })

export default mongoose.model<IChainhookEventLog>('ChainhookEventLog', chainhookEventLogSchema)
