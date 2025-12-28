import { AccessControlAuditLog } from '../models/AccessControlAuditLog';
import { AccessControlEventType } from '../types/accessControl';
import ErrorMonitoringService from './ErrorMonitoringService';

/**
 * Access Control Security Monitor
 *
 * Detects and alerts on suspicious access control activity
 */

export interface SecurityAlert {
  id: string;
  type: 'privilege_escalation' | 'mass_suspension' | 'rapid_changes' | 'unauthorized_access' | 'anomalous_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  principal: string;
  affectedUsers?: string[];
  affectedCommunities?: string[];
  evidence: Array<{
    transactionHash: string;
    timestamp: Date;
    eventType: AccessControlEventType;
  }>;
  timestamp: Date;
  acknowledged: boolean;
}

export interface SecurityMetrics {
  totalAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByType: Record<string, number>;
  suspiciousActors: Array<{
    principal: string;
    alertCount: number;
    lastAlert: Date;
  }>;
  recentPatterns: Array<{
    pattern: string;
    occurrences: number;
  }>;
}

export class AccessControlSecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private logger: any;
  private monitoringInterval?: NodeJS.Timeout;

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
   * Start security monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      this.logger.warn('Security monitoring already started');
      return;
    }

    this.logger.info('Starting access control security monitoring');
    this.monitoringInterval = setInterval(async () => {
      await this.runSecurityChecks();
    }, intervalMs);
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      this.logger.info('Security monitoring stopped');
    }
  }

  /**
   * Run all security checks
   */
  private async runSecurityChecks(): Promise<void> {
    try {
      await Promise.all([
        this.checkPrivilegeEscalation(),
        this.checkMassSuspensions(),
        this.checkRapidChanges(),
        this.checkAnomalousPatterns()
      ]);
    } catch (error) {
      this.logger.error('Error running security checks', error);
    }
  }

  /**
   * Check for privilege escalation attempts
   */
  private async checkPrivilegeEscalation(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find users who granted themselves admin rights
    const selfGrantedAdmins = await AccessControlAuditLog.find({
      eventType: AccessControlEventType.ADMIN_ADDED,
      timestamp: { $gte: oneHourAgo },
      $expr: { $eq: ['$principal', '$targetPrincipal'] }
    });

    for (const log of selfGrantedAdmins) {
      this.createAlert({
        type: 'privilege_escalation',
        severity: 'critical',
        title: 'Self-Granted Admin Privileges',
        description: `User ${log.principal} granted themselves admin privileges`,
        principal: log.principal,
        affectedCommunities: log.communityId ? [log.communityId] : [],
        evidence: [{
          transactionHash: log.transactionHash,
          timestamp: log.timestamp,
          eventType: log.eventType
        }]
      });
    }

    // Find rapid permission escalations
    const principals = await AccessControlAuditLog.distinct('principal', {
      eventType: { $in: [
        AccessControlEventType.GLOBAL_PERMISSION_SET,
        AccessControlEventType.ADMIN_ADDED
      ]},
      timestamp: { $gte: oneHourAgo }
    });

    for (const principal of principals) {
      const escalations = await AccessControlAuditLog.find({
        principal,
        eventType: { $in: [
          AccessControlEventType.GLOBAL_PERMISSION_SET,
          AccessControlEventType.ADMIN_ADDED
        ]},
        timestamp: { $gte: oneHourAgo }
      });

      if (escalations.length >= 3) {
        this.createAlert({
          type: 'privilege_escalation',
          severity: 'high',
          title: 'Rapid Privilege Escalation',
          description: `User ${principal} performed ${escalations.length} privilege escalations in the last hour`,
          principal,
          evidence: escalations.map(e => ({
            transactionHash: e.transactionHash,
            timestamp: e.timestamp,
            eventType: e.eventType
          }))
        });
      }
    }
  }

  /**
   * Check for mass user suspensions
   */
  private async checkMassSuspensions(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const suspensions = await AccessControlAuditLog.find({
      eventType: AccessControlEventType.USER_SUSPENDED,
      timestamp: { $gte: oneHourAgo }
    });

    if (suspensions.length >= 5) {
      // Group by principal
      const suspensionsByPrincipal = suspensions.reduce((acc, susp) => {
        if (!acc[susp.principal]) {
          acc[susp.principal] = [];
        }
        acc[susp.principal].push(susp);
        return acc;
      }, {} as Record<string, typeof suspensions>);

      for (const [principal, userSuspensions] of Object.entries(suspensionsByPrincipal)) {
        if (userSuspensions.length >= 3) {
          this.createAlert({
            type: 'mass_suspension',
            severity: 'critical',
            title: 'Mass User Suspensions',
            description: `User ${principal} suspended ${userSuspensions.length} accounts in the last hour`,
            principal,
            affectedUsers: userSuspensions.map(s => s.targetPrincipal!).filter(Boolean),
            evidence: userSuspensions.map(s => ({
              transactionHash: s.transactionHash,
              timestamp: s.timestamp,
              eventType: s.eventType
            }))
          });
        }
      }
    }
  }

  /**
   * Check for rapid permission changes
   */
  private async checkRapidChanges(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const principals = await AccessControlAuditLog.distinct('principal', {
      timestamp: { $gte: fiveMinutesAgo }
    });

    for (const principal of principals) {
      const changes = await AccessControlAuditLog.find({
        principal,
        timestamp: { $gte: fiveMinutesAgo }
      });

      if (changes.length > 15) {
        this.createAlert({
          type: 'rapid_changes',
          severity: 'medium',
          title: 'Excessive Permission Changes',
          description: `User ${principal} made ${changes.length} permission changes in 5 minutes`,
          principal,
          evidence: changes.slice(0, 10).map(c => ({
            transactionHash: c.transactionHash,
            timestamp: c.timestamp,
            eventType: c.eventType
          }))
        });
      }
    }
  }

  /**
   * Check for anomalous patterns
   */
  private async checkAnomalousPatterns(): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for off-hours activity (assuming business hours 9AM-5PM)
    const offHoursActivity = await AccessControlAuditLog.find({
      timestamp: { $gte: twentyFourHoursAgo },
      eventType: { $in: [
        AccessControlEventType.ADMIN_ADDED,
        AccessControlEventType.USER_SUSPENDED,
        AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED
      ]}
    });

    for (const log of offHoursActivity) {
      const hour = log.timestamp.getHours();
      if (hour < 9 || hour > 17) {
        this.createAlert({
          type: 'anomalous_pattern',
          severity: 'low',
          title: 'Off-Hours Critical Activity',
          description: `Critical permission change detected outside business hours (${hour}:00)`,
          principal: log.principal,
          evidence: [{
            transactionHash: log.transactionHash,
            timestamp: log.timestamp,
            eventType: log.eventType
          }]
        });
      }
    }
  }

  /**
   * Create security alert
   */
  private createAlert(params: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Check for duplicate alerts
    const isDuplicate = this.alerts.some(alert =>
      alert.principal === params.principal &&
      alert.type === params.type &&
      alert.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Within last hour
    );

    if (isDuplicate) {
      return;
    }

    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log to error monitoring service
    ErrorMonitoringService.recordError(
      `security_alert_${alert.type}`,
      alert.description,
      'AccessControlSecurityMonitor',
      {
        severity: alert.severity,
        principal: alert.principal,
        evidence: alert.evidence.length
      }
    );

    this.logger.warn(`[SECURITY ALERT] ${alert.title}`, {
      type: alert.type,
      severity: alert.severity,
      principal: alert.principal
    });

    // TODO: Send notification (email, Slack, etc.)
  }

  /**
   * Get all alerts
   */
  getAlerts(filters?: {
    type?: SecurityAlert['type'];
    severity?: SecurityAlert['severity'];
    acknowledged?: boolean;
    limit?: number;
  }): SecurityAlert[] {
    let filtered = [...this.alerts];

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(a => a.type === filters.type);
      }
      if (filters.severity) {
        filtered = filtered.filter(a => a.severity === filters.severity);
      }
      if (filters.acknowledged !== undefined) {
        filtered = filtered.filter(a => a.acknowledged === filters.acknowledged);
      }
      if (filters.limit) {
        filtered = filtered.slice(-filters.limit);
      }
    }

    return filtered.reverse(); // Most recent first
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get security metrics
   */
  async getMetrics(): Promise<SecurityMetrics> {
    const metrics: SecurityMetrics = {
      totalAlerts: this.alerts.length,
      alertsBySeverity: {},
      alertsByType: {},
      suspiciousActors: [],
      recentPatterns: []
    };

    // Count by severity and type
    this.alerts.forEach(alert => {
      metrics.alertsBySeverity[alert.severity] = (metrics.alertsBySeverity[alert.severity] || 0) + 1;
      metrics.alertsByType[alert.type] = (metrics.alertsByType[alert.type] || 0) + 1;
    });

    // Find suspicious actors
    const actorAlerts: Record<string, { count: number; lastAlert: Date }> = {};
    this.alerts.forEach(alert => {
      if (!actorAlerts[alert.principal]) {
        actorAlerts[alert.principal] = { count: 0, lastAlert: alert.timestamp };
      }
      actorAlerts[alert.principal].count++;
      if (alert.timestamp > actorAlerts[alert.principal].lastAlert) {
        actorAlerts[alert.principal].lastAlert = alert.timestamp;
      }
    });

    metrics.suspiciousActors = Object.entries(actorAlerts)
      .map(([principal, data]) => ({
        principal,
        alertCount: data.count,
        lastAlert: data.lastAlert
      }))
      .sort((a, b) => b.alertCount - a.alertCount)
      .slice(0, 10);

    // Recent patterns
    const patternCounts: Record<string, number> = {};
    this.alerts.forEach(alert => {
      patternCounts[alert.type] = (patternCounts[alert.type] || 0) + 1;
    });

    metrics.recentPatterns = Object.entries(patternCounts)
      .map(([pattern, occurrences]) => ({ pattern, occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences);

    return metrics;
  }
}

export default new AccessControlSecurityMonitor();
