import { Predicate } from '../services/chainhookPredicateManager';

/**
 * Access Control Chainhook Predicates
 *
 * Monitors the access-control contract for permission changes, role assignments, and admin updates
 * Contract: SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control
 */

const ACCESS_CONTROL_CONTRACT = 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control';
const WEBHOOK_BASE_URL = process.env.CHAINHOOK_WEBHOOK_URL || 'http://localhost:3010/api';
const AUTH_TOKEN = process.env.CHAINHOOK_AUTH_TOKEN || '';

export interface AccessControlPredicates {
  globalPermissionSet: Predicate;
  communityPermissionSet: Predicate;
  userSuspension: Predicate;
  userUnsuspension: Predicate;
  issuerAuthorization: Predicate;
  issuerRevocation: Predicate;
  permissionGroupCreated: Predicate;
}

/**
 * Predicate for global permission changes
 * Monitors: set-global-permissions
 */
export function buildGlobalPermissionPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  return {
    uuid: 'pred_access_control_global_permission',
    name: 'Global Permission Changes',
    description: 'Monitors global permission changes in the access control contract',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: ACCESS_CONTROL_CONTRACT,
      method: 'set-global-permissions'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/global-permission`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for community-specific permission changes
 * Monitors: set-community-permissions
 */
export function buildCommunityPermissionPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  return {
    uuid: 'pred_access_control_community_permission',
    name: 'Community Permission Changes',
    description: 'Monitors community-specific permission changes',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: ACCESS_CONTROL_CONTRACT,
      method: 'set-community-permissions'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/community-permission`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for user suspension events
 * Monitors: suspend-user
 */
export function buildUserSuspensionPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  return {
    uuid: 'pred_access_control_user_suspension',
    name: 'User Suspension',
    description: 'Monitors user suspension events for security tracking',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: ACCESS_CONTROL_CONTRACT,
      method: 'suspend-user'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/user-suspended`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for user unsuspension events
 * Monitors: unsuspend-user
 */
export function buildUserUnsuspensionPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  return {
    uuid: 'pred_access_control_user_unsuspension',
    name: 'User Unsuspension',
    description: 'Monitors user unsuspension events',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: ACCESS_CONTROL_CONTRACT,
      method: 'unsuspend-user'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/user-unsuspended`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for issuer authorization events
 * Monitors: authorize-issuer (from badge-issuer contract)
 */
export function buildIssuerAuthorizationPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const BADGE_ISSUER_CONTRACT = 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer';

  return {
    uuid: 'pred_access_control_issuer_authorized',
    name: 'Issuer Authorization',
    description: 'Monitors issuer authorization events',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: BADGE_ISSUER_CONTRACT,
      method: 'authorize-issuer'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/issuer-authorized`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for issuer revocation events
 * Monitors: revoke-issuer (from badge-issuer contract)
 */
export function buildIssuerRevocationPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const BADGE_ISSUER_CONTRACT = 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer';

  return {
    uuid: 'pred_access_control_issuer_revoked',
    name: 'Issuer Revocation',
    description: 'Monitors issuer revocation events',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: BADGE_ISSUER_CONTRACT,
      method: 'revoke-issuer'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/issuer-revoked`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for permission group creation
 * Monitors: create-permission-group
 */
export function buildPermissionGroupCreatedPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  return {
    uuid: 'pred_access_control_permission_group_created',
    name: 'Permission Group Created',
    description: 'Monitors creation of new permission groups',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: ACCESS_CONTROL_CONTRACT,
      method: 'create-permission-group'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/permission-group-created`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for community member role changes
 * Monitors: add-community-member (from community-manager contract)
 */
export function buildCommunityMemberRolePredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const COMMUNITY_MANAGER_CONTRACT = process.env.COMMUNITY_MANAGER_CONTRACT || 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager';

  return {
    uuid: 'pred_access_control_member_role_change',
    name: 'Community Member Role Change',
    description: 'Monitors role assignments and changes in communities',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: COMMUNITY_MANAGER_CONTRACT,
      method: 'add-community-member'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/member-role-changed`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Predicate for community ownership transfer
 * Monitors: transfer-community-ownership
 */
export function buildOwnershipTransferPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const COMMUNITY_MANAGER_CONTRACT = process.env.COMMUNITY_MANAGER_CONTRACT || 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager';

  return {
    uuid: 'pred_access_control_ownership_transfer',
    name: 'Community Ownership Transfer',
    description: 'Monitors community ownership transfers',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract_call',
      contract_identifier: COMMUNITY_MANAGER_CONTRACT,
      method: 'transfer-community-ownership'
    },
    then_that: {
      http_post: {
        url: `${WEBHOOK_BASE_URL}/access-control/webhook/ownership-transferred`,
        authorization_header: `Bearer ${AUTH_TOKEN}`
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Get all access control predicates
 */
export function getAccessControlPredicates(network: 'mainnet' | 'testnet' | 'devnet' = 'devnet'): AccessControlPredicates {
  return {
    globalPermissionSet: buildGlobalPermissionPredicate(network),
    communityPermissionSet: buildCommunityPermissionPredicate(network),
    userSuspension: buildUserSuspensionPredicate(network),
    userUnsuspension: buildUserUnsuspensionPredicate(network),
    issuerAuthorization: buildIssuerAuthorizationPredicate(network),
    issuerRevocation: buildIssuerRevocationPredicate(network),
    permissionGroupCreated: buildPermissionGroupCreatedPredicate(network)
  };
}

export default getAccessControlPredicates;
