export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  notificationId: string;
  metadata: Record<string, unknown>;
}

class NotificationAuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 10000;

  log(
    action: string,
    userId: string,
    notificationId: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      userId,
      notificationId,
      metadata,
    };

    this.logs.push(entry);
    this.enforceMaxLogs();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private enforceMaxLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(userId?: string, notificationId?: string): AuditLogEntry[] {
    let filtered = this.logs;

    if (userId) {
      filtered = filtered.filter((log) => log.userId === userId);
    }

    if (notificationId) {
      filtered = filtered.filter(
        (log) => log.notificationId === notificationId
      );
    }

    return filtered;
  }

  getLogsByAction(action: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.action === action);
  }

  getLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  clear(): void {
    this.logs = [];
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    this.enforceMaxLogs();
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

export const notificationAuditLogger = new NotificationAuditLogger();
