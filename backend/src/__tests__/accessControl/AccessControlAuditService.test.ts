import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AccessControlAuditService } from '../../services/AccessControlAuditService';
import { AccessControlEventType, AdminChangeEvent } from '../../types/accessControl';
import { AccessControlAuditLog } from '../../models/AccessControlAuditLog';

describe('AccessControlAuditService', () => {
  let service: AccessControlAuditService;

  beforeEach(() => {
    service = new AccessControlAuditService();
  });

  afterEach(async () => {
    await AccessControlAuditLog.deleteMany({});
  });

  describe('logEvent', () => {
    it('should create audit log entry', async () => {
      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx200',
        blockHeight: 2000,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2NEWADMIN',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: {
          communityId: 'community-1',
          role: 'admin' as any
        }
      };

      const auditLog = await service.logEvent(event);

      expect(auditLog).toBeDefined();
      expect(auditLog.eventType).toBe(AccessControlEventType.ADMIN_ADDED);
      expect(auditLog.principal).toBe('SP1PRINCIPAL');
      expect(auditLog.targetPrincipal).toBe('SP2NEWADMIN');
      expect(auditLog.communityId).toBe('community-1');
    });

    it('should prevent duplicate audit logs', async () => {
      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx201',
        blockHeight: 2001,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2NEWADMIN',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: {
          communityId: 'community-1',
          role: 'admin' as any
        }
      };

      await service.logEvent(event);
      await service.logEvent(event); // Try to log again

      const count = await AccessControlAuditLog.countDocuments({
        transactionHash: 'tx201'
      });

      expect(count).toBe(1);
    });

    it('should mark high-severity events appropriately', async () => {
      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx202',
        blockHeight: 2002,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2NEWADMIN',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: {
          communityId: 'community-1',
          role: 'admin' as any
        }
      };

      const auditLog = await service.logEvent(event);

      expect(auditLog.severity).toBe('critical');
    });
  });

  describe('queryLogs', () => {
    beforeEach(async () => {
      // Create test data
      await service.logEvent({
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx300',
        blockHeight: 3000,
        timestamp: Date.now(),
        principal: 'SP1',
        targetPrincipal: 'SP2',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: { communityId: 'comm-1', role: 'admin' as any }
      });

      await service.logEvent({
        eventType: AccessControlEventType.ROLE_ASSIGNED,
        transactionHash: 'tx301',
        blockHeight: 3001,
        timestamp: Date.now(),
        principal: 'SP1',
        targetPrincipal: 'SP3',
        contractAddress: 'SP1.access-control',
        method: 'assign-role',
        data: {},
        metadata: { communityId: 'comm-1', role: 'member' as any }
      });
    });

    it('should filter by principal', async () => {
      const logs = await service.queryLogs({ principal: 'SP1' });
      expect(logs).toHaveLength(2);
    });

    it('should filter by event type', async () => {
      const logs = await service.queryLogs({
        eventType: AccessControlEventType.ADMIN_ADDED
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].eventType).toBe(AccessControlEventType.ADMIN_ADDED);
    });

    it('should filter by community', async () => {
      const logs = await service.queryLogs({ communityId: 'comm-1' });
      expect(logs).toHaveLength(2);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await service.logEvent({
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx400',
        blockHeight: 4000,
        timestamp: Date.now(),
        principal: 'SP1',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: { communityId: 'comm-1', role: 'admin' as any }
      });

      await service.logEvent({
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx401',
        blockHeight: 4001,
        timestamp: Date.now(),
        principal: 'SP2',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: { communityId: 'comm-2', role: 'admin' as any }
      });
    });

    it('should return correct statistics', async () => {
      const stats = await service.getStatistics();

      expect(stats.totalEvents).toBe(2);
      expect(stats.eventsByType[AccessControlEventType.ADMIN_ADDED]).toBe(2);
      expect(stats.uniquePrincipals).toBe(2);
      expect(stats.affectedCommunities).toBe(2);
    });
  });
});
