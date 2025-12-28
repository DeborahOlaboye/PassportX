import { AccessControlAuditLog, IAccessControlAuditLog } from '../models/AccessControlAuditLog';
import { AccessControlEventType, AnyAccessControlEvent } from '../types/accessControl';

/**
 * Access Control Audit Service
 *
 * Manages immutable audit trail for access control changes
 */

export interface AuditQueryFilters {
  principal?: string;
  targetPrincipal?: string;
  communityId?: string;
  eventType?: AccessControlEventType | AccessControlEventType[];
  suspicious?: boolean;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  blockHeightMin?: number;
  blockHeightMax?: number;
  limit?: number;
  skip?: number;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  suspiciousEvents: number;
  uniquePrincipals: number;
  uniqueTargets: number;
  affectedCommunities: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export class AccessControlAuditService {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    };
  }

  /**
   * Create audit log entry from access control event
   */
  async logEvent(event: AnyAccessControlEvent): Promise<IAccessControlAuditLog> {
    try {
      // Check for duplicate (idempotency)
      const existing = await AccessControlAuditLog.findOne({
        transactionHash: event.transactionHash
      });

      if (existing) {
        this.logger.debug(`Audit log already exists for transaction ${event.transactionHash}`);
        return existing;
      }

      // Determine severity
      const severity = this.calculateSeverity(event);

      // Check for suspicious activity
      const { suspicious, reasons } = await this.checkSuspiciousActivity(event);

      const auditLog = new AccessControlAuditLog({
        eventType: event.eventType,
        transactionHash: event.transactionHash,
        blockHeight: event.blockHeight,
        timestamp: new Date(event.timestamp),
        principal: event.principal,
        targetPrincipal: event.targetPrincipal,
        contractAddress: event.contractAddress,
        method: event.method,
        communityId: event.metadata?.communityId,
        role: event.metadata?.role,
        permission: event.metadata?.permission,
        previousValue: event.metadata?.previousValue,
        newValue: event.metadata?.newValue,
        reason: event.metadata?.reason,
        suspicious,
        suspiciousReasons: reasons,
        severity,
        rawEventData: event.data
      });

      await auditLog.save();

      this.logger.info(`Audit log created for ${event.eventType}`, {
        transactionHash: event.transactionHash,
        principal: event.principal,
        severity,
        suspicious
      });

      return auditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      throw error;
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: AuditQueryFilters = {}): Promise<IAccessControlAuditLog[]> {
    const query: any = {};

    if (filters.principal) {
      query.principal = filters.principal;
    }

    if (filters.targetPrincipal) {
      query.targetPrincipal = filters.targetPrincipal;
    }

    if (filters.communityId) {
      query.communityId = filters.communityId;
    }

    if (filters.eventType) {
      if (Array.isArray(filters.eventType)) {
        query.eventType = { $in: filters.eventType };
      } else {
        query.eventType = filters.eventType;
      }
    }

    if (filters.suspicious !== undefined) {
      query.suspicious = filters.suspicious;
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    if (filters.blockHeightMin || filters.blockHeightMax) {
      query.blockHeight = {};
      if (filters.blockHeightMin) {
        query.blockHeight.$gte = filters.blockHeightMin;
      }
      if (filters.blockHeightMax) {
        query.blockHeight.$lte = filters.blockHeightMax;
      }
    }

    return await AccessControlAuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0);
  }

  /**
   * Get audit statistics
   */
  async getStatistics(filters: Omit<AuditQueryFilters, 'limit' | 'skip'> = {}): Promise<AuditStatistics> {
    const logs = await this.queryLogs({ ...filters, limit: 10000 });

    const stats: AuditStatistics = {
      totalEvents: logs.length,
      eventsByType: {},
      eventsBySeverity: {},
      suspiciousEvents: 0,
      uniquePrincipals: 0,
      uniqueTargets: 0,
      affectedCommunities: 0,
      recentActivity: []
    };

    const principals = new Set<string>();
    const targets = new Set<string>();
    const communities = new Set<string>();
    const activityByDate: Record<string, number> = {};

    logs.forEach(log => {
      // Count by type
      stats.eventsByType[log.eventType] = (stats.eventsByType[log.eventType] || 0) + 1;

      // Count by severity
      stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;

      // Count suspicious
      if (log.suspicious) {
        stats.suspiciousEvents++;
      }

      // Track unique principals and targets
      principals.add(log.principal);
      if (log.targetPrincipal) {
        targets.add(log.targetPrincipal);
      }
      if (log.communityId) {
        communities.add(log.communityId);
      }

      // Activity by date
      const dateKey = log.timestamp.toISOString().split('T')[0];
      activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
    });

    stats.uniquePrincipals = principals.size;
    stats.uniqueTargets = targets.size;
    stats.affectedCommunities = communities.size;

    // Convert activity map to array
    stats.recentActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30); // Last 30 days

    return stats;
  }

  /**
   * Get suspicious activity logs
   */
  async getSuspiciousActivity(limit: number = 50): Promise<IAccessControlAuditLog[]> {
    return await AccessControlAuditLog.find({ suspicious: true })
      .sort({ timestamp: -1, severity: -1 })
      .limit(limit);
  }

  /**
   * Get user's access control history
   */
  async getUserHistory(principal: string, limit: number = 100): Promise<IAccessControlAuditLog[]> {
    return await AccessControlAuditLog.find({
      $or: [
        { principal },
        { targetPrincipal: principal }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Get community access control history
   */
  async getCommunityHistory(communityId: string, limit: number = 100): Promise<IAccessControlAuditLog[]> {
    return await AccessControlAuditLog.find({ communityId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  /**
   * Calculate severity for event
   */
  private calculateSeverity(event: AnyAccessControlEvent): 'info' | 'low' | 'medium' | 'high' | 'critical' {
    switch (event.eventType) {
      case AccessControlEventType.USER_SUSPENDED:
        return 'high';

      case AccessControlEventType.ADMIN_ADDED:
      case AccessControlEventType.ADMIN_REMOVED:
      case AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED:
        return 'critical';

      case AccessControlEventType.GLOBAL_PERMISSION_SET:
        return 'high';

      case AccessControlEventType.ISSUER_AUTHORIZED:
      case AccessControlEventType.ISSUER_REVOKED:
        return 'medium';

      case AccessControlEventType.ROLE_ASSIGNED:
      case AccessControlEventType.ROLE_REVOKED:
      case AccessControlEventType.COMMUNITY_PERMISSION_SET:
        return 'medium';

      case AccessControlEventType.USER_UNSUSPENDED:
      case AccessControlEventType.PERMISSION_GROUP_CREATED:
      case AccessControlEventType.PERMISSION_GROUP_UPDATED:
        return 'low';

      default:
        return 'info';
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(event: AnyAccessControlEvent): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check for rapid permission changes
    if (event.principal) {
      const recentEvents = await AccessControlAuditLog.find({
        principal: event.principal,
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      });

      if (recentEvents.length > 10) {
        reasons.push('Excessive permission changes in short time period');
      }
    }

    // Check for self-granting admin rights
    if (
      event.eventType === AccessControlEventType.ADMIN_ADDED &&
      event.principal === event.targetPrincipal
    ) {
      reasons.push('Self-granting admin privileges');
    }

    // Check for mass suspensions
    if (event.eventType === AccessControlEventType.USER_SUSPENDED) {
      const recentSuspensions = await AccessControlAuditLog.countDocuments({
        eventType: AccessControlEventType.USER_SUSPENDED,
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });

      if (recentSuspensions > 5) {
        reasons.push('Multiple user suspensions in short period');
      }
    }

    // Check for permission escalation patterns
    if (event.eventType === AccessControlEventType.GLOBAL_PERMISSION_SET) {
      const previousElevations = await AccessControlAuditLog.countDocuments({
        principal: event.principal,
        eventType: AccessControlEventType.GLOBAL_PERMISSION_SET,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (previousElevations > 3) {
        reasons.push('Multiple permission elevations in 24 hours');
      }
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }

  /**
   * Export audit logs to JSON
   */
  async exportLogs(filters: AuditQueryFilters = {}): Promise<string> {
    const logs = await this.queryLogs({ ...filters, limit: 10000 });
    const stats = await this.getStatistics(filters);

    const exportData = {
      timestamp: new Date().toISOString(),
      filters,
      statistics: stats,
      logs: logs.map(log => log.toObject())
    };

    return JSON.stringify(exportData, null, 2);
  }
}

export default new AccessControlAuditService();
