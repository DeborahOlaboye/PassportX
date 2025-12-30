/**
 * Event System Exports
 *
 * Central export point for all event-related functionality
 */

// Event utilities
export {
  eventManager,
  EVENT_NAMES,
  parseContractEvent,
  filterEventsByType,
  filterEventsByBlockRange,
  filterEventsByPrincipal,
  sortEventsByBlock,
  groupEventsByType,
  getMostRecentEvent,
  onBadgeMinted,
  onCommunityCreated,
  onBatchBadgesMinted,
  onTemplateCreated,
  onAnyEvent,
  EventSubscriptionManager
} from '../utils/contractEvents'

// Event types
export type {
  ContractEvent,
  EventListener,
  EventName,
  BadgeMintedEvent,
  BatchBadgesMintedEvent,
  TemplateCreatedEvent,
  BadgeRevokedEvent,
  BadgeMetadataUpdatedEvent,
  CommunityCreatedEvent,
  CommunityMemberAddedEvent,
  PassportBadgeMintedEvent,
  TypedContractEvent
} from '../utils/contractEvents'

// Type definitions
export type {
  ContractEventData,
  BadgeMintedEventData,
  BatchBadgesMintedEventData,
  TemplateCreatedEventData,
  BadgeRevokedEventData,
  BadgeMetadataUpdatedEventData,
  IssuerAuthorizedEventData,
  IssuerRevokedEventData,
  CommunityCreatedEventData,
  CommunityMemberAddedEventData,
  CommunitySettingsUpdatedEventData,
  CommunityDeactivatedEventData,
  CommunityOwnershipTransferredEventData,
  GlobalPermissionsUpdatedEventData,
  CommunityPermissionsUpdatedEventData,
  UserSuspendedEventData,
  UserUnsuspendedEventData,
  PassportBadgeMintedEventData,
  EventHandler,
  EventFilterPredicate,
  EventSubscriptionOptions,
  EventTypeMap,
  EventDataForName
} from '../../types/contractEvents'

// Enums and constants
export { EventCategory, BadgeCategory, CommunityRole } from '../../types/contractEvents'

export type { BadgeLevel } from '../../types/contractEvents'
