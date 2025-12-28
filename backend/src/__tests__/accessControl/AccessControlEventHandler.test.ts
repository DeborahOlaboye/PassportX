import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AccessControlEventHandler } from '../../services/AccessControlEventHandler';
import { AccessControlEventType, AdminChangeEvent } from '../../types/accessControl';
import { Community } from '../../models/Community';
import { AccessControlAuditLog } from '../../models/AccessControlAuditLog';

describe('AccessControlEventHandler', () => {
  let handler: AccessControlEventHandler;

  beforeEach(() => {
    handler = new AccessControlEventHandler();
  });

  afterEach(async () => {
    await AccessControlAuditLog.deleteMany({});
    await Community.deleteMany({});
  });

  describe('handleAdminAdded', () => {
    it('should add admin to community', async () => {
      const community = await Community.create({
        name: 'Test Community',
        communityId: 'test-community-1',
        creator: 'SP1PRINCIPAL',
        admins: ['SP1PRINCIPAL']
      });

      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx123',
        blockHeight: 1000,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2NEWADMIN',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: {
          communityId: 'test-community-1',
          role: 'admin' as any
        }
      };

      await handler.handleEvent(event);

      const updated = await Community.findById(community._id);
      expect(updated?.admins).toContain('SP2NEWADMIN');
    });
  });

  describe('handleAdminRemoved', () => {
    it('should remove admin from community', async () => {
      const community = await Community.create({
        name: 'Test Community',
        communityId: 'test-community-2',
        creator: 'SP1PRINCIPAL',
        admins: ['SP1PRINCIPAL', 'SP2ADMIN']
      });

      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_REMOVED,
        transactionHash: 'tx124',
        blockHeight: 1001,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2ADMIN',
        contractAddress: 'SP1.access-control',
        method: 'remove-admin',
        data: {},
        metadata: {
          communityId: 'test-community-2',
          role: 'admin' as any
        }
      };

      await handler.handleEvent(event);

      const updated = await Community.findById(community._id);
      expect(updated?.admins).not.toContain('SP2ADMIN');
      expect(updated?.admins).toContain('SP1PRINCIPAL');
    });
  });

  describe('handleEvent', () => {
    it('should create audit log entry', async () => {
      const event: AdminChangeEvent = {
        eventType: AccessControlEventType.ADMIN_ADDED,
        transactionHash: 'tx125',
        blockHeight: 1002,
        timestamp: Date.now(),
        principal: 'SP1PRINCIPAL',
        targetPrincipal: 'SP2NEWADMIN',
        contractAddress: 'SP1.access-control',
        method: 'add-admin',
        data: {},
        metadata: {
          communityId: 'test-community-3',
          role: 'admin' as any
        }
      };

      await handler.handleEvent(event);

      const auditLog = await AccessControlAuditLog.findOne({
        transactionHash: 'tx125'
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.eventType).toBe(AccessControlEventType.ADMIN_ADDED);
      expect(auditLog?.principal).toBe('SP1PRINCIPAL');
    });
  });
});
