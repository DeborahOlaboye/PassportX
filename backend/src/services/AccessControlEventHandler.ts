import {
  AccessControlEventType,
  AnyAccessControlEvent,
  GlobalPermissionChangeEvent,
  CommunityPermissionChangeEvent,
  RoleAssignmentEvent,
  AdminChangeEvent,
  SuspensionEvent,
  IssuerAuthorizationEvent,
  OwnershipTransferEvent,
} from '../types/accessControl';
import AccessControlAuditService from './AccessControlAuditService';
import { Community } from '../models/Community';
import { User } from '../models/User';

/**
 * Access Control Event Handler
 *
 * Processes access control events from Chainhook webhooks
 */

export class AccessControlEventHandler {
  private auditService: typeof AccessControlAuditService;
  private logger: any;

  constructor(logger?: any) {
    this.auditService = AccessControlAuditService;
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) =>
        console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) =>
        console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) =>
        console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) =>
        console.error(`[ERROR] ${msg}`, ...args),
    };
  }

  /**
   * Process any access control event
   */
  async handleEvent(event: AnyAccessControlEvent): Promise<void> {
    try {
      this.logger.info(`Processing access control event: ${event.eventType}`, {
        transactionHash: event.transactionHash,
        principal: event.principal,
      });

      // Log to audit trail
      await this.auditService.logEvent(event);

      // Process based on event type
      switch (event.eventType) {
        case AccessControlEventType.GLOBAL_PERMISSION_SET:
          await this.handleGlobalPermissionSet(
            event as GlobalPermissionChangeEvent
          );
          break;

        case AccessControlEventType.COMMUNITY_PERMISSION_SET:
          await this.handleCommunityPermissionSet(
            event as CommunityPermissionChangeEvent
          );
          break;

        case AccessControlEventType.ROLE_ASSIGNED:
          await this.handleRoleAssigned(event as RoleAssignmentEvent);
          break;

        case AccessControlEventType.ROLE_REVOKED:
          await this.handleRoleRevoked(event as RoleAssignmentEvent);
          break;

        case AccessControlEventType.ADMIN_ADDED:
          await this.handleAdminAdded(event as AdminChangeEvent);
          break;

        case AccessControlEventType.ADMIN_REMOVED:
          await this.handleAdminRemoved(event as AdminChangeEvent);
          break;

        case AccessControlEventType.USER_SUSPENDED:
          await this.handleUserSuspended(event as SuspensionEvent);
          break;

        case AccessControlEventType.USER_UNSUSPENDED:
          await this.handleUserUnsuspended(event as SuspensionEvent);
          break;

        case AccessControlEventType.ISSUER_AUTHORIZED:
        case AccessControlEventType.ISSUER_REVOKED:
          await this.handleIssuerAuthorization(
            event as IssuerAuthorizationEvent
          );
          break;

        case AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED:
          await this.handleOwnershipTransfer(event as OwnershipTransferEvent);
          break;

        default:
          this.logger.warn(`Unknown event type: ${event.eventType}`);
      }

      this.logger.info(
        `Successfully processed access control event: ${event.eventType}`
      );
    } catch (error) {
      this.logger.error('Error handling access control event', error);
      throw error;
    }
  }

  /**
   * Handle global permission changes
   */
  private async handleGlobalPermissionSet(
    event: GlobalPermissionChangeEvent
  ): Promise<void> {
    this.logger.debug(`Global permission set: ${event.metadata.permission}`, {
      previous: event.metadata.previousValue,
      new: event.metadata.newValue,
      principal: event.principal,
    });

    try {
      const User = (await import('../models/User')).default;
      const user = await User.findOne({ stacksAddress: event.principal });

      if (user) {
        if (!user.permissions) {
          user.permissions = new Map();
        }
        user.permissions.set(
          event.metadata.permission,
          event.metadata.newValue
        );
        user.lastActive = new Date();
        await user.save();

        this.logger.info('User global permissions updated in database', {
          stacksAddress: event.principal,
          permission: event.metadata.permission,
          value: event.metadata.newValue,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error updating user global permissions in database',
        error
      );
    }
  }

  /**
   * Handle community-specific permission changes
   */
  private async handleCommunityPermissionSet(
    event: CommunityPermissionChangeEvent
  ): Promise<void> {
    const { communityId, role } = event.metadata;

    this.logger.debug(`Community permission set for ${communityId}`, {
      role,
      targetPrincipal: event.targetPrincipal,
    });

    try {
      const community = await Community.findOne({ communityId });
      if (!community) {
        this.logger.warn(`Community not found: ${communityId}`);
        return;
      }

      // Update community member role if needed
      // This logic depends on how Community model stores member roles
    } catch (error) {
      this.logger.error(
        `Error updating community permissions for ${communityId}`,
        error
      );
    }
  }

  /**
   * Handle role assignments
   */
  private async handleRoleAssigned(event: RoleAssignmentEvent): Promise<void> {
    const { communityId, role } = event.metadata;

    this.logger.info(`Role assigned: ${role} in community ${communityId}`, {
      targetPrincipal: event.targetPrincipal,
    });

    try {
      const Community = (await import('../models/Community')).default;
      const community = await Community.findOne({ contractId: communityId });

      if (community && event.targetPrincipal) {
        const memberIndex = community.members.findIndex(
          (m: any) => m.address === event.targetPrincipal
        );

        if (memberIndex !== -1) {
          community.members[memberIndex].role = role;
          community.members[memberIndex].roleAssignedAt = new Date();
        } else {
          community.members.push({
            address: event.targetPrincipal,
            role,
            joinedAt: new Date(),
            roleAssignedAt: new Date(),
          });
        }

        await community.save();

        this.logger.info('Community member role updated in database', {
          communityId,
          member: event.targetPrincipal,
          role,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error updating community member role in database',
        error
      );
    }
  }

  /**
   * Handle role revocations
   */
  private async handleRoleRevoked(event: RoleAssignmentEvent): Promise<void> {
    const { communityId, role } = event.metadata;

    this.logger.info(`Role revoked: ${role} in community ${communityId}`, {
      targetPrincipal: event.targetPrincipal,
    });

    try {
      const Community = (await import('../models/Community')).default;
      const community = await Community.findOne({ contractId: communityId });

      if (community && event.targetPrincipal) {
        const memberIndex = community.members.findIndex(
          (m: any) => m.address === event.targetPrincipal
        );

        if (memberIndex !== -1) {
          community.members[memberIndex].role = null;
          community.members[memberIndex].roleRevokedAt = new Date();
        }

        await community.save();

        this.logger.info('Community member role revoked in database', {
          communityId,
          member: event.targetPrincipal,
          role,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error revoking community member role in database',
        error
      );
    }
  }

  /**
   * Handle admin additions
   */
  private async handleAdminAdded(event: AdminChangeEvent): Promise<void> {
    const { communityId } = event.metadata;
    const newAdmin = event.targetPrincipal;

    if (!newAdmin) {
      this.logger.error('No target principal for admin addition');
      return;
    }

    this.logger.info(`Admin added to community ${communityId}`, {
      newAdmin,
      addedBy: event.principal,
    });

    try {
      // Update Community model
      const community = await Community.findOne({ communityId });
      if (community) {
        if (!community.admins.includes(newAdmin)) {
          community.admins.push(newAdmin);
          await community.save();
          this.logger.debug(`Added ${newAdmin} to community admins`);
        }
      }

      // Update User model
      const user = await User.findOne({ stacksAddress: newAdmin });
      if (user) {
        if (!user.adminCommunities.includes(community._id)) {
          user.adminCommunities.push(community._id);
          await user.save();
          this.logger.debug(`Added community to user's admin communities`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error adding admin to community ${communityId}`,
        error
      );
    }
  }

  /**
   * Handle admin removals
   */
  private async handleAdminRemoved(event: AdminChangeEvent): Promise<void> {
    const { communityId } = event.metadata;
    const removedAdmin = event.targetPrincipal;

    if (!removedAdmin) {
      this.logger.error('No target principal for admin removal');
      return;
    }

    this.logger.info(`Admin removed from community ${communityId}`, {
      removedAdmin,
      removedBy: event.principal,
    });

    try {
      // Update Community model
      const community = await Community.findOne({ communityId });
      if (community) {
        community.admins = community.admins.filter(
          (admin) => admin !== removedAdmin
        );
        await community.save();
        this.logger.debug(`Removed ${removedAdmin} from community admins`);

        // Update User model
        const user = await User.findOne({ stacksAddress: removedAdmin });
        if (user) {
          user.adminCommunities = user.adminCommunities.filter(
            (id: any) => !id.equals(community._id)
          );
          await user.save();
          this.logger.debug(`Removed community from user's admin communities`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error removing admin from community ${communityId}`,
        error
      );
    }
  }

  /**
   * Handle user suspensions
   */
  private async handleUserSuspended(event: SuspensionEvent): Promise<void> {
    const suspendedUser = event.targetPrincipal;

    if (!suspendedUser) {
      this.logger.error('No target principal for suspension');
      return;
    }

    this.logger.warn(`User suspended: ${suspendedUser}`, {
      reason: event.metadata.reason,
      suspendedBy: event.principal,
    });

    try {
      const User = (await import('../models/User')).default;
      const user = await User.findOne({ stacksAddress: suspendedUser });

      if (user) {
        (user as any).status = 'suspended';
        (user as any).suspendedAt = new Date();
        (user as any).suspendedBy = event.principal;
        (user as any).suspensionReason = event.metadata.reason;
        user.lastActive = new Date();
        await user.save();

        this.logger.info('User suspension status updated in database', {
          stacksAddress: suspendedUser,
          suspendedBy: event.principal,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error updating user suspension status in database',
        error
      );
    }
  }

  /**
   * Handle user unsuspensions
   */
  private async handleUserUnsuspended(event: SuspensionEvent): Promise<void> {
    const unsuspendedUser = event.targetPrincipal;

    if (!unsuspendedUser) {
      this.logger.error('No target principal for unsuspension');
      return;
    }

    this.logger.info(`User unsuspended: ${unsuspendedUser}`, {
      unsuspendedBy: event.principal,
    });

    try {
      const User = (await import('../models/User')).default;
      const user = await User.findOne({ stacksAddress: unsuspendedUser });

      if (user) {
        (user as any).status = 'active';
        (user as any).unsuspendedAt = new Date();
        (user as any).unsuspendedBy = event.principal;
        (user as any).suspensionReason = null;
        user.lastActive = new Date();
        await user.save();

        this.logger.info('User unsuspension status updated in database', {
          stacksAddress: unsuspendedUser,
          unsuspendedBy: event.principal,
        });
      }
    } catch (error) {
      this.logger.error(
        'Error updating user unsuspension status in database',
        error
      );
    }
  }

  /**
   * Handle issuer authorization changes
   */
  private async handleIssuerAuthorization(
    event: IssuerAuthorizationEvent
  ): Promise<void> {
    const { authorized, communityId } = event.metadata;
    const issuer = event.targetPrincipal;

    this.logger.info(`Issuer ${authorized ? 'authorized' : 'revoked'}`, {
      issuer,
      communityId,
      authorizedBy: event.principal,
    });

    try {
      const Community = (await import('../models/Community')).default;
      const community = await Community.findOne({ contractId: communityId });

      if (community && issuer) {
        if (!community.issuers) {
          community.issuers = [];
        }

        if (authorized) {
          if (!community.issuers.includes(issuer)) {
            community.issuers.push(issuer);
          }
        } else {
          community.issuers = community.issuers.filter(
            (addr: string) => addr !== issuer
          );
        }

        await community.save();

        this.logger.info('Issuer permissions updated in database', {
          communityId,
          issuer,
          authorized,
        });
      }
    } catch (error) {
      this.logger.error('Error updating issuer permissions in database', error);
    }
  }

  /**
   * Handle community ownership transfers
   */
  private async handleOwnershipTransfer(
    event: OwnershipTransferEvent
  ): Promise<void> {
    const { communityId, previousOwner, newOwner } = event.metadata;

    this.logger.info(`Community ownership transferred for ${communityId}`, {
      from: previousOwner,
      to: newOwner,
    });

    try {
      const community = await Community.findOne({ communityId });
      if (community) {
        // Remove previous owner from admins if exists
        community.admins = community.admins.filter(
          (admin) => admin !== previousOwner
        );

        // Add new owner to admins if not already present
        if (!community.admins.includes(newOwner)) {
          community.admins.push(newOwner);
        }

        // Update creator field if exists
        if (community.creator) {
          community.creator = newOwner;
        }

        await community.save();
        this.logger.debug(`Updated community ownership`);
      }
    } catch (error) {
      this.logger.error(
        `Error transferring ownership for community ${communityId}`,
        error
      );
    }
  }
}

export default new AccessControlEventHandler();
