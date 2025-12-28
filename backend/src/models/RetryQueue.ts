import mongoose, { Schema, Document } from 'mongoose';

export interface IRetryQueueItem extends Document {
  itemType: 'event' | 'webhook';
  originalPayload: any;
  targetUrl?: string;
  eventType?: string;
  contractAddress?: string;
  transactionHash?: string;
  blockHeight?: number;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: Date;
  lastAttemptAt?: Date;
  lastError?: string;
  errorType?: 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown';
  status: 'pending' | 'retrying' | 'failed' | 'succeeded';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    webhookId?: string;
    eventId?: string;
    priority?: number;
    [key: string]: any;
  };
}

const RetryQueueSchema = new Schema<IRetryQueueItem>({
  itemType: {
    type: String,
    enum: ['event', 'webhook'],
    required: true,
    index: true
  },
  originalPayload: {
    type: Schema.Types.Mixed,
    required: true
  },
  targetUrl: {
    type: String
  },
  eventType: {
    type: String,
    index: true
  },
  contractAddress: {
    type: String,
    index: true
  },
  transactionHash: {
    type: String,
    index: true
  },
  blockHeight: {
    type: Number,
    index: true
  },
  attemptCount: {
    type: Number,
    default: 0,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 5,
    required: true
  },
  nextRetryAt: {
    type: Date,
    required: true,
    index: true
  },
  lastAttemptAt: {
    type: Date
  },
  lastError: {
    type: String
  },
  errorType: {
    type: String,
    enum: ['network', 'validation', 'timeout', 'rate_limit', 'server_error', 'unknown']
  },
  status: {
    type: String,
    enum: ['pending', 'retrying', 'failed', 'succeeded'],
    default: 'pending',
    required: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient retry scheduling
RetryQueueSchema.index({ status: 1, nextRetryAt: 1 });
RetryQueueSchema.index({ itemType: 1, status: 1 });
RetryQueueSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 }); // Auto-delete after 7 days

export const RetryQueue = mongoose.model<IRetryQueueItem>('RetryQueue', RetryQueueSchema);
