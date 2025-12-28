/**
 * Access Control Event Types
 *
 * Defines types for access control events monitored via Chainhook
 */

export enum AccessControlEventType {
  GLOBAL_PERMISSION_SET = 'global-permission-set',
  COMMUNITY_PERMISSION_SET = 'community-permission-set',
  ROLE_ASSIGNED = 'role-assigned',
  ROLE_REVOKED = 'role-revoked',
  ADMIN_ADDED = 'admin-added',
  ADMIN_REMOVED = 'admin-removed',
  USER_SUSPENDED = 'user-suspended',
  USER_UNSUSPENDED = 'user-unsuspended',
  PERMISSION_GROUP_CREATED = 'permission-group-created',
  PERMISSION_GROUP_UPDATED = 'permission-group-updated',
  ISSUER_AUTHORIZED = 'issuer-authorized',
  ISSUER_REVOKED = 'issuer-revoked',
  COMMUNITY_OWNERSHIP_TRANSFERRED = 'community-ownership-transferred'
}

export enum Role {
  ADMIN = 'admin',
  ISSUER = 'issuer',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

export enum GlobalPermission {
  CAN_CREATE_COMMUNITIES = 'can-create-communities',
  CAN_ISSUE_BADGES = 'can-issue-badges',
  IS_PLATFORM_ADMIN = 'is-platform-admin',
  SUSPENDED = 'suspended'
}

export interface AccessControlEvent {
  eventType: AccessControlEventType;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
  principal: string; // User performing the action
  targetPrincipal?: string; // User being affected by the action
  contractAddress: string;
  method: string;
  data: Record<string, any>;
  metadata?: {
    communityId?: string;
    role?: Role;
    permission?: GlobalPermission;
    previousValue?: any;
    newValue?: any;
    reason?: string;
  };
}

export interface GlobalPermissionChangeEvent extends AccessControlEvent {
  eventType: AccessControlEventType.GLOBAL_PERMISSION_SET;
  metadata: {
    permission: GlobalPermission;
    previousValue: boolean;
    newValue: boolean;
  };
}

export interface CommunityPermissionChangeEvent extends AccessControlEvent {
  eventType: AccessControlEventType.COMMUNITY_PERMISSION_SET;
  metadata: {
    communityId: string;
    role: Role;
    previousValue?: Role;
    newValue: Role;
  };
}

export interface RoleAssignmentEvent extends AccessControlEvent {
  eventType: AccessControlEventType.ROLE_ASSIGNED | AccessControlEventType.ROLE_REVOKED;
  metadata: {
    communityId: string;
    role: Role;
  };
}

export interface AdminChangeEvent extends AccessControlEvent {
  eventType: AccessControlEventType.ADMIN_ADDED | AccessControlEventType.ADMIN_REMOVED;
  metadata: {
    communityId: string;
    role: Role.ADMIN;
  };
}

export interface SuspensionEvent extends AccessControlEvent {
  eventType: AccessControlEventType.USER_SUSPENDED | AccessControlEventType.USER_UNSUSPENDED;
  metadata: {
    reason?: string;
    previousValue: boolean;
    newValue: boolean;
  };
}

export interface IssuerAuthorizationEvent extends AccessControlEvent {
  eventType: AccessControlEventType.ISSUER_AUTHORIZED | AccessControlEventType.ISSUER_REVOKED;
  metadata: {
    communityId?: string;
    authorized: boolean;
  };
}

export interface OwnershipTransferEvent extends AccessControlEvent {
  eventType: AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED;
  metadata: {
    communityId: string;
    previousOwner: string;
    newOwner: string;
  };
}

export type AnyAccessControlEvent =
  | GlobalPermissionChangeEvent
  | CommunityPermissionChangeEvent
  | RoleAssignmentEvent
  | AdminChangeEvent
  | SuspensionEvent
  | IssuerAuthorizationEvent
  | OwnershipTransferEvent;
