import { BadgeRevocationEvent } from '../chainhook/types/handlers';

export interface RevocationRecord {
  badgeId: string;
  userId: string;
  badgeName: string;
  revocationType: 'soft' | 'hard';
  reason?: string;
  issuerId: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
  recordedAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface RevocationAuditMetrics {
  totalRevocations: number;
  softRevokeCount: number;
  hardRevokeCount: number;
  revocationsByIssuer: Map<string, number>;
  revocationsByUser: Map<string, number>;
  revocationsByBadge: Map<string, number>;
  revocationsByDate: Map<string, number>;
}

export class BadgeRevocationAuditLog {
  private revocationLog: RevocationRecord[] = [];
  private logger: any;
  private metrics: RevocationAuditMetrics = {
    totalRevocations: 0,
    softRevokeCount: 0,
    hardRevokeCount: 0,
    revocationsByIssuer: new Map(),
    revocationsByUser: new Map(),
    revocationsByBadge: new Map(),
    revocationsByDate: new Map()
  };
  private readonly MAX_LOG_SIZE = 100000;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeRevocationAuditLog] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeRevocationAuditLog] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeRevocationAuditLog] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeRevocationAuditLog] ${msg}`, ...args)
    };
  }

  recordRevocation(event: BadgeRevocationEvent, context?: { ipAddress?: string; userAgent?: string }): RevocationRecord {
    const record: RevocationRecord = {
      badgeId: event.badgeId,
      userId: event.userId,
      badgeName: event.badgeName,
      revocationType: event.revocationType,
      reason: event.reason,
      issuerId: event.issuerId,
      transactionHash: event.transactionHash,
      blockHeight: event.blockHeight,
      timestamp: event.timestamp,
      recordedAt: Date.now(),
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent
    };

    this.revocationLog.push(record);

    if (this.revocationLog.length > this.MAX_LOG_SIZE) {
      this.revocationLog.shift();
      this.logger.warn('Revocation log exceeds max size, removing oldest record');
    }

    this.updateMetrics(record);

    this.logger.info('Badge revocation recorded', {
      badgeId: event.badgeId,
      userId: event.userId,
      revocationType: event.revocationType
    });

    return record;
  }

  recordBatchRevocations(events: BadgeRevocationEvent[], context?: { ipAddress?: string; userAgent?: string }): RevocationRecord[] {
    const records: RevocationRecord[] = [];

    for (const event of events) {
      records.push(this.recordRevocation(event, context));
    }

    this.logger.info(`Batch revocation records created`, {
      count: records.length
    });

    return records;
  }

  private updateMetrics(record: RevocationRecord): void {
    this.metrics.totalRevocations++;

    if (record.revocationType === 'soft') {
      this.metrics.softRevokeCount++;
    } else {
      this.metrics.hardRevokeCount++;
    }

    const issuerCount = this.metrics.revocationsByIssuer.get(record.issuerId) || 0;
    this.metrics.revocationsByIssuer.set(record.issuerId, issuerCount + 1);

    const userCount = this.metrics.revocationsByUser.get(record.userId) || 0;
    this.metrics.revocationsByUser.set(record.userId, userCount + 1);

    const badgeCount = this.metrics.revocationsByBadge.get(record.badgeId) || 0;
    this.metrics.revocationsByBadge.set(record.badgeId, badgeCount + 1);

    const dateKey = new Date(record.timestamp).toISOString().split('T')[0];
    const dateCount = this.metrics.revocationsByDate.get(dateKey) || 0;
    this.metrics.revocationsByDate.set(dateKey, dateCount + 1);
  }

  getRevocationHistory(userId: string, limit: number = 100): RevocationRecord[] {
    return this.revocationLog
      .filter(r => r.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getRevocationsByBadge(badgeId: string, limit: number = 100): RevocationRecord[] {
    return this.revocationLog
      .filter(r => r.badgeId === badgeId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getRevocationsByIssuer(issuerId: string, limit: number = 100): RevocationRecord[] {
    return this.revocationLog
      .filter(r => r.issuerId === issuerId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getRevocationsByDateRange(startDate: number, endDate: number): RevocationRecord[] {
    return this.revocationLog
      .filter(r => r.timestamp >= startDate && r.timestamp <= endDate)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getMetrics(): RevocationAuditMetrics {
    return {
      ...this.metrics,
      revocationsByIssuer: new Map(this.metrics.revocationsByIssuer),
      revocationsByUser: new Map(this.metrics.revocationsByUser),
      revocationsByBadge: new Map(this.metrics.revocationsByBadge),
      revocationsByDate: new Map(this.metrics.revocationsByDate)
    };
  }

  getRevocationStatistics() {
    return {
      totalRevocations: this.metrics.totalRevocations,
      softRevokePercentage: this.metrics.totalRevocations > 0
        ? ((this.metrics.softRevokeCount / this.metrics.totalRevocations) * 100).toFixed(2) + '%'
        : '0%',
      hardRevokePercentage: this.metrics.totalRevocations > 0
        ? ((this.metrics.hardRevokeCount / this.metrics.totalRevocations) * 100).toFixed(2) + '%'
        : '0%',
      topIssuer: this.getTopEntry(this.metrics.revocationsByIssuer),
      mostRevokedBadge: this.getTopEntry(this.metrics.revocationsByBadge),
      mostAffectedUser: this.getTopEntry(this.metrics.revocationsByUser),
      recordCount: this.revocationLog.length
    };
  }

  private getTopEntry(map: Map<string, number>): { name: string; count: number } | null {
    let topEntry: [string, number] | null = null;
    let maxCount = 0;

    for (const [key, count] of map.entries()) {
      if (count > maxCount) {
        maxCount = count;
        topEntry = [key, count];
      }
    }

    return topEntry ? { name: topEntry[0], count: topEntry[1] } : null;
  }

  searchRevocations(query: {
    badgeId?: string;
    userId?: string;
    issuerId?: string;
    revocationType?: 'soft' | 'hard';
    startDate?: number;
    endDate?: number;
  }): RevocationRecord[] {
    let results = [...this.revocationLog];

    if (query.badgeId) {
      results = results.filter(r => r.badgeId === query.badgeId);
    }

    if (query.userId) {
      results = results.filter(r => r.userId === query.userId);
    }

    if (query.issuerId) {
      results = results.filter(r => r.issuerId === query.issuerId);
    }

    if (query.revocationType) {
      results = results.filter(r => r.revocationType === query.revocationType);
    }

    if (query.startDate && query.endDate) {
      results = results.filter(r => r.timestamp >= query.startDate! && r.timestamp <= query.endDate!);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  exportAuditLog(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalRecords: this.revocationLog.length,
        records: this.revocationLog,
        metrics: this.getMetrics()
      }, null, 2);
    }

    if (format === 'csv') {
      const headers = ['badgeId', 'userId', 'badgeName', 'revocationType', 'reason', 'issuerId', 'transactionHash', 'blockHeight', 'timestamp', 'recordedAt'];
      const rows = this.revocationLog.map(r => [
        r.badgeId,
        r.userId,
        r.badgeName,
        r.revocationType,
        r.reason || '',
        r.issuerId,
        r.transactionHash,
        r.blockHeight,
        r.timestamp,
        r.recordedAt
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      return csvContent;
    }

    return '';
  }

  resetAuditLog(): void {
    this.revocationLog = [];
    this.metrics = {
      totalRevocations: 0,
      softRevokeCount: 0,
      hardRevokeCount: 0,
      revocationsByIssuer: new Map(),
      revocationsByUser: new Map(),
      revocationsByBadge: new Map(),
      revocationsByDate: new Map()
    };
    this.logger.info('Audit log reset');
  }

  destroy(): void {
    this.revocationLog = [];
    this.logger.info('BadgeRevocationAuditLog destroyed');
  }
}

export default BadgeRevocationAuditLog;
