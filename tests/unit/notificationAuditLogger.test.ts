import { notificationAuditLogger } from '../../src/services/NotificationAuditLogger';

describe('Notification Audit Logger', () => {
  beforeEach(() => {
    notificationAuditLogger.clear();
  });

  describe('log', () => {
    it('should log an entry', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      const logs = notificationAuditLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('create');
    });
  });

  describe('getLogs', () => {
    it('should return all logs', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.log('update', 'user-2', 'notif-2');
      const logs = notificationAuditLogger.getLogs();
      expect(logs).toHaveLength(2);
    });

    it('should filter by userId', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.log('update', 'user-2', 'notif-2');
      const logs = notificationAuditLogger.getLogs('user-1');
      expect(logs).toHaveLength(1);
    });

    it('should filter by notificationId', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.log('update', 'user-2', 'notif-2');
      const logs = notificationAuditLogger.getLogs(undefined, 'notif-1');
      expect(logs).toHaveLength(1);
    });
  });

  describe('getLogsByAction', () => {
    it('should return logs by action', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.log('update', 'user-2', 'notif-2');
      const logs = notificationAuditLogger.getLogsByAction('create');
      expect(logs).toHaveLength(1);
    });
  });

  describe('getLogsByDateRange', () => {
    it('should return logs by date range', () => {
      const now = new Date();
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      const logs = notificationAuditLogger.getLogsByDateRange(
        new Date(now.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );
      expect(logs).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.clear();
      expect(notificationAuditLogger.getLogCount()).toBe(0);
    });
  });

  describe('setMaxLogs', () => {
    it('should set max logs and enforce limit', () => {
      notificationAuditLogger.setMaxLogs(2);
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      notificationAuditLogger.log('update', 'user-2', 'notif-2');
      notificationAuditLogger.log('delete', 'user-3', 'notif-3');
      expect(notificationAuditLogger.getLogCount()).toBe(2);
    });
  });

  describe('getLogCount', () => {
    it('should return log count', () => {
      notificationAuditLogger.log('create', 'user-1', 'notif-1');
      expect(notificationAuditLogger.getLogCount()).toBe(1);
    });
  });
});
