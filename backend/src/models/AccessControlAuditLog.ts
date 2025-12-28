import mongoose, { Schema, Document } from 'mongoose';
import { AccessControlEventType, Role, GlobalPermission } from '../types/accessControl';

/**
 * Access Control Audit Log Model
 *
 * Immutable audit trail for all access control changes
 */

export interface IAccessControlAuditLog extends Document {
  eventType: AccessControlEventType;
  transactionHash: string;
  blockHeight: number;
  timestamp: Date;
  principal: string; // Address performing the action
  targetPrincipal?: string; // Address being affected
  contractAddress: string;
  method: string;

  // Event-specific data
  communityId?: string;
  role?: Role;
  permission?: GlobalPermission;
  previousValue?: any;
  newValue?: any;
  reason?: string;

  // Security tracking
  suspicious: boolean;
  suspiciousReasons?: string[];
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';

  // Metadata
  ipAddress?: string;
  userAgent?: string;
  rawEventData: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const AccessControlAuditLogSchema = new Schema<IAccessControlAuditLog>({
  eventType: {
    type: String,
    enum: Object.values(AccessControlEventType),
    required: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    index: true,
    unique: true // Prevent duplicate audit entries
  },
  blockHeight: {
    type: Number,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  principal: {
    type: String,
    required: true,
    index: true
  },
  targetPrincipal: {
    type: String,
    index: true
  },
  contractAddress: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true,
    index: true
  },

  // Event-specific data
  communityId: {
    type: String,
    index: true
  },
  role: {
    type: String,
    enum: Object.values(Role)
  },
  permission: {
    type: String,
    enum: Object.values(GlobalPermission)
  },
  previousValue: {
    type: Schema.Types.Mixed
  },
  newValue: {
    type: Schema.Types.Mixed
  },
  reason: {
    type: String
  },

  // Security tracking
  suspicious: {
    type: Boolean,
    default: false,
    index: true
  },
  suspiciousReasons: [{
    type: String
  }],
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info',
    index: true
  },

  // Metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  rawEventData: {
    type: Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
AccessControlAuditLogSchema.index({ principal: 1, timestamp: -1 });
AccessControlAuditLogSchema.index({ targetPrincipal: 1, timestamp: -1 });
AccessControlAuditLogSchema.index({ communityId: 1, timestamp: -1 });
AccessControlAuditLogSchema.index({ eventType: 1, timestamp: -1 });
AccessControlAuditLogSchema.index({ suspicious: 1, severity: -1, timestamp: -1 });

// TTL index to auto-delete old logs after 2 years (optional, can be disabled)
// AccessControlAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

export const AccessControlAuditLog = mongoose.model<IAccessControlAuditLog>('AccessControlAuditLog', AccessControlAuditLogSchema);

export default AccessControlAuditLog;
