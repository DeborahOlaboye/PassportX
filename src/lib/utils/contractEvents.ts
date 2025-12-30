/**
 * Contract Event Utilities
 *
 * Helpers for listening to and processing smart contract events
 */

/**
 * Event names emitted by contracts
 */
export const EVENT_NAMES = {
  // Badge Issuer Events
  BADGE_MINTED: 'badge-minted',
  BATCH_BADGES_MINTED: 'batch-badges-minted',
  TEMPLATE_CREATED: 'template-created',
  BADGE_REVOKED: 'badge-revoked',
  BADGE_METADATA_UPDATED: 'badge-metadata-updated',
  ISSUER_AUTHORIZED: 'issuer-authorized',
  ISSUER_REVOKED: 'issuer-revoked',

  // Community Manager Events
  COMMUNITY_CREATED: 'community-created',
  COMMUNITY_MEMBER_ADDED: 'community-member-added',
  COMMUNITY_SETTINGS_UPDATED: 'community-settings-updated',
  COMMUNITY_DEACTIVATED: 'community-deactivated',
  COMMUNITY_OWNERSHIP_TRANSFERRED: 'community-ownership-transferred',

  // Access Control Events
  GLOBAL_PERMISSIONS_UPDATED: 'global-permissions-updated',
  COMMUNITY_PERMISSIONS_UPDATED: 'community-permissions-updated',
  USER_SUSPENDED: 'user-suspended',
  USER_UNSUSPENDED: 'user-unsuspended',

  // Passport NFT Events
  PASSPORT_BADGE_MINTED: 'passport-badge-minted'
} as const

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES]

/**
 * Base contract event interface
 */
export interface ContractEvent {
  event: EventName
  blockHeight: number
  [key: string]: any
}

/**
 * Badge Minted Event
 */
export interface BadgeMintedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.BADGE_MINTED
  badgeId: number
  recipient: string
  templateId: number
  issuer: string
  level: number
  category: number
}

/**
 * Batch Badges Minted Event
 */
export interface BatchBadgesMintedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.BATCH_BADGES_MINTED
  batchId: number
  issuer: string
  recipients: string[]
  templateIds: number[]
  badgeIds: number[]
  count: number
}

/**
 * Template Created Event
 */
export interface TemplateCreatedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.TEMPLATE_CREATED
  templateId: number
  name: string
  description: string
  category: number
  defaultLevel: number
  creator: string
}

/**
 * Badge Revoked Event
 */
export interface BadgeRevokedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.BADGE_REVOKED
  badgeId: number
  issuer: string
  revokedBy: string
}

/**
 * Badge Metadata Updated Event
 */
export interface BadgeMetadataUpdatedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.BADGE_METADATA_UPDATED
  badgeId: number
  oldLevel: number
  newLevel: number
  oldCategory: number
  newCategory: number
  updatedBy: string
}

/**
 * Community Created Event
 */
export interface CommunityCreatedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.COMMUNITY_CREATED
  communityId: number
  name: string
  description: string
  owner: string
}

/**
 * Community Member Added Event
 */
export interface CommunityMemberAddedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.COMMUNITY_MEMBER_ADDED
  communityId: number
  member: string
  role: string
  addedBy: string
}

/**
 * Passport Badge Minted Event
 */
export interface PassportBadgeMintedEvent extends ContractEvent {
  event: typeof EVENT_NAMES.PASSPORT_BADGE_MINTED
  tokenId: number
  recipient: string
  mintedBy: string
}

/**
 * Union type of all typed events
 */
export type TypedContractEvent =
  | BadgeMintedEvent
  | BatchBadgesMintedEvent
  | TemplateCreatedEvent
  | BadgeRevokedEvent
  | BadgeMetadataUpdatedEvent
  | CommunityCreatedEvent
  | CommunityMemberAddedEvent
  | PassportBadgeMintedEvent

/**
 * Event listener callback type
 */
export type EventListener<T extends ContractEvent = ContractEvent> = (event: T) => void | Promise<void>

/**
 * Event subscription manager
 */
export class EventSubscriptionManager {
  private listeners: Map<EventName | '*', Set<EventListener>> = new Map()

  /**
   * Subscribe to a specific event type
   */
  on<T extends ContractEvent = ContractEvent>(eventName: EventName | '*', listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }

    this.listeners.get(eventName)!.add(listener as EventListener)

    // Return unsubscribe function
    return () => {
      this.off(eventName, listener)
    }
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends ContractEvent = ContractEvent>(eventName: EventName | '*', listener: EventListener<T>): void {
    const listeners = this.listeners.get(eventName)
    if (listeners) {
      listeners.delete(listener as EventListener)
      if (listeners.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(event: ContractEvent): Promise<void> {
    // Call specific event listeners
    const specificListeners = this.listeners.get(event.event as EventName)
    if (specificListeners) {
      for (const listener of specificListeners) {
        await listener(event)
      }
    }

    // Call wildcard listeners
    const wildcardListeners = this.listeners.get('*')
    if (wildcardListeners) {
      for (const listener of wildcardListeners) {
        await listener(event)
      }
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear()
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventName: EventName | '*'): number {
    return this.listeners.get(eventName)?.size || 0
  }
}

/**
 * Parse raw contract event data
 */
export function parseContractEvent(rawEvent: any): ContractEvent | null {
  try {
    // Handle Stacks.js event format
    if (rawEvent?.contract_event?.value) {
      const value = rawEvent.contract_event.value

      // Extract event name
      const eventName = value.event?.value || value.event

      // Parse all fields from the event
      const parsedEvent: any = {
        event: eventName,
        blockHeight: rawEvent.block_height || 0
      }

      // Parse each field in the event
      for (const [key, val] of Object.entries(value)) {
        if (key === 'event') continue

        // Convert kebab-case to camelCase
        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

        // Parse Clarity values to JavaScript types
        parsedEvent[camelKey] = parseClarityValue(val)
      }

      return parsedEvent as ContractEvent
    }

    return null
  } catch (error) {
    console.error('Failed to parse contract event:', error)
    return null
  }
}

/**
 * Parse Clarity value to JavaScript type
 */
function parseClarityValue(value: any): any {
  if (value === null || value === undefined) {
    return null
  }

  // Handle primitive Clarity types
  if (typeof value === 'object') {
    if ('value' in value) {
      // Handle Clarity value wrappers
      if (value.type === 'uint' || value.type === 'int') {
        return parseInt(value.value, 10)
      }
      if (value.type === 'bool') {
        return value.value === true || value.value === 'true'
      }
      if (value.type === 'principal') {
        return value.value
      }
      if (value.type === 'string' || value.type === 'string-ascii' || value.type === 'string-utf8') {
        return value.value
      }
      if (value.type === 'list') {
        return value.value.map(parseClarityValue)
      }

      return value.value
    }
  }

  return value
}

/**
 * Filter events by type
 */
export function filterEventsByType<T extends ContractEvent>(
  events: ContractEvent[],
  eventType: EventName
): T[] {
  return events.filter((e) => e.event === eventType) as T[]
}

/**
 * Filter events by block range
 */
export function filterEventsByBlockRange(
  events: ContractEvent[],
  startBlock: number,
  endBlock: number
): ContractEvent[] {
  return events.filter((e) => e.blockHeight >= startBlock && e.blockHeight <= endBlock)
}

/**
 * Filter events by principal (user/issuer/etc)
 */
export function filterEventsByPrincipal(events: ContractEvent[], principal: string): ContractEvent[] {
  return events.filter((e) => {
    // Check common principal fields
    return (
      e.issuer === principal ||
      e.recipient === principal ||
      e.owner === principal ||
      e.member === principal ||
      e.user === principal ||
      e.creator === principal ||
      e.mintedBy === principal ||
      e.addedBy === principal ||
      e.updatedBy === principal ||
      e.revokedBy === principal ||
      e.suspendedBy === principal ||
      e.unsuspendedBy === principal
    )
  })
}

/**
 * Sort events by block height
 */
export function sortEventsByBlock(events: ContractEvent[], descending = false): ContractEvent[] {
  return [...events].sort((a, b) => {
    return descending ? b.blockHeight - a.blockHeight : a.blockHeight - b.blockHeight
  })
}

/**
 * Group events by type
 */
export function groupEventsByType(events: ContractEvent[]): Map<EventName, ContractEvent[]> {
  const grouped = new Map<EventName, ContractEvent[]>()

  for (const event of events) {
    const eventName = event.event as EventName
    if (!grouped.has(eventName)) {
      grouped.set(eventName, [])
    }
    grouped.get(eventName)!.push(event)
  }

  return grouped
}

/**
 * Get the most recent event of a specific type
 */
export function getMostRecentEvent<T extends ContractEvent>(
  events: ContractEvent[],
  eventType: EventName
): T | null {
  const filtered = filterEventsByType<T>(events, eventType)
  const sorted = sortEventsByBlock(filtered, true)
  return sorted[0] || null
}

/**
 * Create a singleton event manager instance
 */
export const eventManager = new EventSubscriptionManager()

/**
 * Helper to subscribe to badge minting events
 */
export function onBadgeMinted(listener: EventListener<BadgeMintedEvent>): () => void {
  return eventManager.on(EVENT_NAMES.BADGE_MINTED, listener)
}

/**
 * Helper to subscribe to community creation events
 */
export function onCommunityCreated(listener: EventListener<CommunityCreatedEvent>): () => void {
  return eventManager.on(EVENT_NAMES.COMMUNITY_CREATED, listener)
}

/**
 * Helper to subscribe to batch minting events
 */
export function onBatchBadgesMinted(listener: EventListener<BatchBadgesMintedEvent>): () => void {
  return eventManager.on(EVENT_NAMES.BATCH_BADGES_MINTED, listener)
}

/**
 * Helper to subscribe to template creation events
 */
export function onTemplateCreated(listener: EventListener<TemplateCreatedEvent>): () => void {
  return eventManager.on(EVENT_NAMES.TEMPLATE_CREATED, listener)
}

/**
 * Helper to subscribe to all events
 */
export function onAnyEvent(listener: EventListener): () => void {
  return eventManager.on('*', listener)
}
