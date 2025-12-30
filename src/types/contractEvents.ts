/**
 * Contract Event Type Definitions
 *
 * Centralized type definitions for all smart contract events
 */

/**
 * Event categories for grouping related events
 */
export enum EventCategory {
  USER_ACTIVITY = 'USER_ACTIVITY',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  COMMUNITY = 'COMMUNITY',
  PERMISSIONS = 'PERMISSIONS',
  NFT = 'NFT'
}

/**
 * Badge categories matching contract definitions
 */
export enum BadgeCategory {
  ACHIEVEMENT = 1,
  PARTICIPATION = 2,
  CONTRIBUTION = 3,
  LEADERSHIP = 4,
  SKILL = 5,
  RECOGNITION = 6
}

/**
 * Badge levels (1-5)
 */
export type BadgeLevel = 1 | 2 | 3 | 4 | 5

/**
 * Community member roles
 */
export enum CommunityRole {
  ADMIN = 'admin',
  ISSUER = 'issuer',
  MODERATOR = 'moderator',
  MEMBER = 'member'
}

/**
 * Base event metadata present in all events
 */
export interface BaseEventMetadata {
  /** Event name identifier */
  event: string
  /** Block number when event was emitted */
  blockHeight: number
  /** Transaction ID that triggered the event */
  txId?: string
  /** Contract that emitted the event */
  contractId?: string
}

/**
 * Badge minting event data
 */
export interface BadgeMintedEventData extends BaseEventMetadata {
  event: 'badge-minted'
  badgeId: number
  recipient: string
  templateId: number
  issuer: string
  level: BadgeLevel
  category: BadgeCategory
}

/**
 * Batch badge minting event data
 */
export interface BatchBadgesMintedEventData extends BaseEventMetadata {
  event: 'batch-badges-minted'
  batchId: number
  issuer: string
  recipients: string[]
  templateIds: number[]
  badgeIds: number[]
  count: number
}

/**
 * Template creation event data
 */
export interface TemplateCreatedEventData extends BaseEventMetadata {
  event: 'template-created'
  templateId: number
  name: string
  description: string
  category: BadgeCategory
  defaultLevel: BadgeLevel
  creator: string
}

/**
 * Badge revocation event data
 */
export interface BadgeRevokedEventData extends BaseEventMetadata {
  event: 'badge-revoked'
  badgeId: number
  issuer: string
  revokedBy: string
}

/**
 * Badge metadata update event data
 */
export interface BadgeMetadataUpdatedEventData extends BaseEventMetadata {
  event: 'badge-metadata-updated'
  badgeId: number
  oldLevel: BadgeLevel
  newLevel: BadgeLevel
  oldCategory: BadgeCategory
  newCategory: BadgeCategory
  updatedBy: string
}

/**
 * Issuer authorization event data
 */
export interface IssuerAuthorizedEventData extends BaseEventMetadata {
  event: 'issuer-authorized'
  issuer: string
  authorizedBy: string
}

/**
 * Issuer revocation event data
 */
export interface IssuerRevokedEventData extends BaseEventMetadata {
  event: 'issuer-revoked'
  issuer: string
  revokedBy: string
}

/**
 * Community creation event data
 */
export interface CommunityCreatedEventData extends BaseEventMetadata {
  event: 'community-created'
  communityId: number
  name: string
  description: string
  owner: string
}

/**
 * Community member added event data
 */
export interface CommunityMemberAddedEventData extends BaseEventMetadata {
  event: 'community-member-added'
  communityId: number
  member: string
  role: CommunityRole
  addedBy: string
}

/**
 * Community settings update event data
 */
export interface CommunitySettingsUpdatedEventData extends BaseEventMetadata {
  event: 'community-settings-updated'
  communityId: number
  publicBadges: boolean
  allowMemberRequests: boolean
  requireApproval: boolean
  updatedBy: string
}

/**
 * Community deactivation event data
 */
export interface CommunityDeactivatedEventData extends BaseEventMetadata {
  event: 'community-deactivated'
  communityId: number
  deactivatedBy: string
}

/**
 * Community ownership transfer event data
 */
export interface CommunityOwnershipTransferredEventData extends BaseEventMetadata {
  event: 'community-ownership-transferred'
  communityId: number
  oldOwner: string
  newOwner: string
}

/**
 * Global permissions update event data
 */
export interface GlobalPermissionsUpdatedEventData extends BaseEventMetadata {
  event: 'global-permissions-updated'
  user: string
  canCreateCommunities: boolean
  canIssueBadges: boolean
  isPlatformAdmin: boolean
  suspended: boolean
  updatedBy: string
}

/**
 * Community permissions update event data
 */
export interface CommunityPermissionsUpdatedEventData extends BaseEventMetadata {
  event: 'community-permissions-updated'
  communityId: number
  user: string
  canIssueBadges: boolean
  canManageMembers: boolean
  canCreateTemplates: boolean
  canRevokeBadges: boolean
  role: CommunityRole
  updatedBy: string
}

/**
 * User suspension event data
 */
export interface UserSuspendedEventData extends BaseEventMetadata {
  event: 'user-suspended'
  user: string
  suspendedBy: string
}

/**
 * User unsuspension event data
 */
export interface UserUnsuspendedEventData extends BaseEventMetadata {
  event: 'user-unsuspended'
  user: string
  unsuspendedBy: string
}

/**
 * Passport badge NFT minting event data
 */
export interface PassportBadgeMintedEventData extends BaseEventMetadata {
  event: 'passport-badge-minted'
  tokenId: number
  recipient: string
  mintedBy: string
}

/**
 * Union type of all event data types
 */
export type ContractEventData =
  | BadgeMintedEventData
  | BatchBadgesMintedEventData
  | TemplateCreatedEventData
  | BadgeRevokedEventData
  | BadgeMetadataUpdatedEventData
  | IssuerAuthorizedEventData
  | IssuerRevokedEventData
  | CommunityCreatedEventData
  | CommunityMemberAddedEventData
  | CommunitySettingsUpdatedEventData
  | CommunityDeactivatedEventData
  | CommunityOwnershipTransferredEventData
  | GlobalPermissionsUpdatedEventData
  | CommunityPermissionsUpdatedEventData
  | UserSuspendedEventData
  | UserUnsuspendedEventData
  | PassportBadgeMintedEventData

/**
 * Event handler function type
 */
export type EventHandler<T extends ContractEventData = ContractEventData> = (
  event: T
) => void | Promise<void>

/**
 * Event filter predicate type
 */
export type EventFilterPredicate<T extends ContractEventData = ContractEventData> = (event: T) => boolean

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /** Filter to apply to events */
  filter?: EventFilterPredicate
  /** Maximum number of events to buffer */
  bufferSize?: number
  /** Whether to catch up on missed events */
  catchUp?: boolean
}

/**
 * Map of event names to their data types
 */
export interface EventTypeMap {
  'badge-minted': BadgeMintedEventData
  'batch-badges-minted': BatchBadgesMintedEventData
  'template-created': TemplateCreatedEventData
  'badge-revoked': BadgeRevokedEventData
  'badge-metadata-updated': BadgeMetadataUpdatedEventData
  'issuer-authorized': IssuerAuthorizedEventData
  'issuer-revoked': IssuerRevokedEventData
  'community-created': CommunityCreatedEventData
  'community-member-added': CommunityMemberAddedEventData
  'community-settings-updated': CommunitySettingsUpdatedEventData
  'community-deactivated': CommunityDeactivatedEventData
  'community-ownership-transferred': CommunityOwnershipTransferredEventData
  'global-permissions-updated': GlobalPermissionsUpdatedEventData
  'community-permissions-updated': CommunityPermissionsUpdatedEventData
  'user-suspended': UserSuspendedEventData
  'user-unsuspended': UserUnsuspendedEventData
  'passport-badge-minted': PassportBadgeMintedEventData
}

/**
 * Helper type to get event data type from event name
 */
export type EventDataForName<T extends keyof EventTypeMap> = EventTypeMap[T]
