import mongoose, { Schema, Document } from 'mongoose';

export interface IDeadLetterQueueItem extends Document {
  itemType: 'event' | 'webhook';
  originalPayload: any;
  targetUrl?: string;
  eventType?: string;
  contractAddress?: string;
  transactionHash?: string;
  blockHeight?: number;
  totalAttempts: number;
  failureReason: string;
  errorType: 'network' | 'validation' | 'timeout' | 'rate_limit' | 'server_error' | 'unknown' | 'max_retries_exceeded';
  errorHistory: Array<{
    attemptNumber: number;
    error: string;
    timestamp: Date;
    errorType?: string;
  }>;
  status: 'dead' | 'recovered' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  recoveredAt?: Date;
  archivedAt?: Date;
  metadata?: {
    retryQueueId?: string;
    webhookId?: string;
    eventId?: string;
    priority?: number;
    alertSent?: boolean;
    manualReviewRequired?: boolean;
    [key: string]: any;
  };
}

const DeadLetterQueueSchema = new Schema<IDeadLetterQueueItem>({
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
  totalAttempts: {
    type: Number,
    required: true
  },
  failureReason: {
    type: String,
    required: true
  },
  errorType: {
    type: String,
    enum: ['network', 'validation', 'timeout', 'rate_limit', 'server_error', 'unknown', 'max_retries_exceeded'],
    required: true,
    index: true
  },
  errorHistory: [{
    attemptNumber: Number,
    error: String,
    timestamp: Date,
    errorType: String
  }],
  status: {
    type: String,
    enum: ['dead', 'recovered', 'archived'],
    default: 'dead',
    required: true,
    index: true
  },
  recoveredAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for querying by status and item type
DeadLetterQueueSchema.index({ status: 1, itemType: 1 });
DeadLetterQueueSchema.index({ errorType: 1, status: 1 });
DeadLetterQueueSchema.index({ createdAt: 1 });

// Auto-archive old dead letter items after 30 days
DeadLetterQueueSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: 'archived' }
  }
);

export const DeadLetterQueue = mongoose.model<IDeadLetterQueueItem>('DeadLetterQueue', DeadLetterQueueSchema);
