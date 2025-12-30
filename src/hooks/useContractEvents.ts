/**
 * React Hooks for Contract Events
 *
 * Convenient hooks for subscribing to contract events in React components
 */

import { useEffect, useCallback, useState } from 'react'
import {
  eventManager,
  EVENT_NAMES,
  type ContractEvent,
  type EventListener,
  type EventName,
  type BadgeMintedEvent,
  type BatchBadgesMintedEvent,
  type CommunityCreatedEvent,
  type TemplateCreatedEvent,
  type BadgeRevokedEvent,
  type CommunityMemberAddedEvent
} from '@/lib/utils/contractEvents'

/**
 * Subscribe to a specific contract event
 *
 * @param eventName - Name of the event to subscribe to, or '*' for all events
 * @param listener - Callback function to handle the event
 * @param deps - Dependencies array for the listener callback
 *
 * @example
 * ```tsx
 * useContractEvent(EVENT_NAMES.BADGE_MINTED, (event) => {
 *   console.log('Badge minted:', event.badgeId)
 *   refreshBadges()
 * }, [refreshBadges])
 * ```
 */
export function useContractEvent<T extends ContractEvent = ContractEvent>(
  eventName: EventName | '*',
  listener: EventListener<T>,
  deps: React.DependencyList = []
): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedListener = useCallback(listener, deps)

  useEffect(() => {
    const unsubscribe = eventManager.on(eventName, memoizedListener)
    return unsubscribe
  }, [eventName, memoizedListener])
}

/**
 * Subscribe to badge minting events
 *
 * @example
 * ```tsx
 * useBadgeMinted((event) => {
 *   toast.success(`Badge #${event.badgeId} minted!`)
 * })
 * ```
 */
export function useBadgeMinted(listener: EventListener<BadgeMintedEvent>, deps: React.DependencyList = []): void {
  useContractEvent(EVENT_NAMES.BADGE_MINTED, listener, deps)
}

/**
 * Subscribe to batch badge minting events
 *
 * @example
 * ```tsx
 * useBatchBadgesMinted((event) => {
 *   toast.success(`${event.count} badges minted in batch #${event.batchId}`)
 * })
 * ```
 */
export function useBatchBadgesMinted(
  listener: EventListener<BatchBadgesMintedEvent>,
  deps: React.DependencyList = []
): void {
  useContractEvent(EVENT_NAMES.BATCH_BADGES_MINTED, listener, deps)
}

/**
 * Subscribe to community creation events
 *
 * @example
 * ```tsx
 * useCommunityCreated((event) => {
 *   console.log('New community:', event.name)
 *   refreshCommunities()
 * }, [refreshCommunities])
 * ```
 */
export function useCommunityCreated(
  listener: EventListener<CommunityCreatedEvent>,
  deps: React.DependencyList = []
): void {
  useContractEvent(EVENT_NAMES.COMMUNITY_CREATED, listener, deps)
}

/**
 * Subscribe to template creation events
 *
 * @example
 * ```tsx
 * useTemplateCreated((event) => {
 *   console.log('New template:', event.name)
 *   refreshTemplates()
 * }, [refreshTemplates])
 * ```
 */
export function useTemplateCreated(
  listener: EventListener<TemplateCreatedEvent>,
  deps: React.DependencyList = []
): void {
  useContractEvent(EVENT_NAMES.TEMPLATE_CREATED, listener, deps)
}

/**
 * Subscribe to badge revocation events
 *
 * @example
 * ```tsx
 * useBadgeRevoked((event) => {
 *   toast.info(`Badge #${event.badgeId} was revoked`)
 *   refreshBadges()
 * }, [refreshBadges])
 * ```
 */
export function useBadgeRevoked(listener: EventListener<BadgeRevokedEvent>, deps: React.DependencyList = []): void {
  useContractEvent(EVENT_NAMES.BADGE_REVOKED, listener, deps)
}

/**
 * Subscribe to community member added events
 *
 * @example
 * ```tsx
 * useCommunityMemberAdded((event) => {
 *   if (event.communityId === currentCommunity) {
 *     refreshMembers()
 *   }
 * }, [currentCommunity, refreshMembers])
 * ```
 */
export function useCommunityMemberAdded(
  listener: EventListener<CommunityMemberAddedEvent>,
  deps: React.DependencyList = []
): void {
  useContractEvent(EVENT_NAMES.COMMUNITY_MEMBER_ADDED, listener, deps)
}

/**
 * Subscribe to all contract events
 *
 * @example
 * ```tsx
 * useAllContractEvents((event) => {
 *   console.log('Contract event:', event)
 *   logEvent(event)
 * }, [logEvent])
 * ```
 */
export function useAllContractEvents(listener: EventListener, deps: React.DependencyList = []): void {
  useContractEvent('*', listener, deps)
}

/**
 * Track the latest event of a specific type
 *
 * @param eventName - Name of the event to track
 * @returns The most recent event of this type, or null
 *
 * @example
 * ```tsx
 * const latestBadge = useLatestEvent<BadgeMintedEvent>(EVENT_NAMES.BADGE_MINTED)
 *
 * return (
 *   <div>
 *     {latestBadge && (
 *       <p>Latest badge: #{latestBadge.badgeId} minted at block {latestBadge.blockHeight}</p>
 *     )}
 *   </div>
 * )
 * ```
 */
export function useLatestEvent<T extends ContractEvent>(eventName: EventName): T | null {
  const [latestEvent, setLatestEvent] = useState<T | null>(null)

  useContractEvent(
    eventName,
    (event) => {
      setLatestEvent(event as T)
    },
    []
  )

  return latestEvent
}

/**
 * Track all events of a specific type
 *
 * @param eventName - Name of the event to track
 * @param maxEvents - Maximum number of events to keep in memory (default: 100)
 * @returns Array of events, newest first
 *
 * @example
 * ```tsx
 * const recentBadges = useEventHistory<BadgeMintedEvent>(EVENT_NAMES.BADGE_MINTED, 10)
 *
 * return (
 *   <ul>
 *     {recentBadges.map(event => (
 *       <li key={event.badgeId}>Badge #{event.badgeId}</li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function useEventHistory<T extends ContractEvent>(eventName: EventName, maxEvents = 100): T[] {
  const [events, setEvents] = useState<T[]>([])

  useContractEvent(
    eventName,
    (event) => {
      setEvents((prev) => {
        const newEvents = [event as T, ...prev]
        return newEvents.slice(0, maxEvents)
      })
    },
    [maxEvents]
  )

  return events
}

/**
 * Track event count for a specific event type
 *
 * @param eventName - Name of the event to count
 * @returns Current count of events received
 *
 * @example
 * ```tsx
 * const badgeCount = useEventCount(EVENT_NAMES.BADGE_MINTED)
 *
 * return <p>Total badges minted: {badgeCount}</p>
 * ```
 */
export function useEventCount(eventName: EventName): number {
  const [count, setCount] = useState(0)

  useContractEvent(
    eventName,
    () => {
      setCount((prev) => prev + 1)
    },
    []
  )

  return count
}

/**
 * Filter events by a predicate function
 *
 * @param eventName - Name of the event to track
 * @param predicate - Function to filter events
 * @param maxEvents - Maximum number of events to keep in memory (default: 100)
 * @returns Filtered array of events
 *
 * @example
 * ```tsx
 * // Track only badges minted to the current user
 * const myBadges = useFilteredEvents<BadgeMintedEvent>(
 *   EVENT_NAMES.BADGE_MINTED,
 *   (event) => event.recipient === currentUserAddress,
 *   50
 * )
 * ```
 */
export function useFilteredEvents<T extends ContractEvent>(
  eventName: EventName,
  predicate: (event: T) => boolean,
  maxEvents = 100
): T[] {
  const [events, setEvents] = useState<T[]>([])

  useContractEvent(
    eventName,
    (event) => {
      if (predicate(event as T)) {
        setEvents((prev) => {
          const newEvents = [event as T, ...prev]
          return newEvents.slice(0, maxEvents)
        })
      }
    },
    [predicate, maxEvents]
  )

  return events
}

/**
 * Hook for handling events with loading and error states
 *
 * @param eventName - Name of the event to handle
 * @param handler - Async handler function for the event
 * @returns Object with loading and error state
 *
 * @example
 * ```tsx
 * const { loading, error } = useEventHandler(
 *   EVENT_NAMES.BADGE_MINTED,
 *   async (event) => {
 *     await saveBadgeToDatabase(event)
 *   }
 * )
 *
 * if (loading) return <Spinner />
 * if (error) return <Error message={error} />
 * ```
 */
export function useEventHandler<T extends ContractEvent>(
  eventName: EventName,
  handler: (event: T) => Promise<void>
): {
  loading: boolean
  error: string | null
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useContractEvent(
    eventName,
    async (event) => {
      setLoading(true)
      setError(null)
      try {
        await handler(event as T)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    },
    [handler]
  )

  return { loading, error }
}

/**
 * Hook to track events for a specific user/principal
 *
 * @param eventName - Name of the event to track
 * @param principal - Principal address to filter by
 * @param maxEvents - Maximum number of events to keep
 * @returns Array of events involving the specified principal
 *
 * @example
 * ```tsx
 * const userBadges = useEventsForPrincipal<BadgeMintedEvent>(
 *   EVENT_NAMES.BADGE_MINTED,
 *   currentUserAddress,
 *   20
 * )
 * ```
 */
export function useEventsForPrincipal<T extends ContractEvent>(
  eventName: EventName,
  principal: string,
  maxEvents = 100
): T[] {
  return useFilteredEvents<T>(
    eventName,
    (event) => {
      // Check common principal fields
      return (
        (event as any).issuer === principal ||
        (event as any).recipient === principal ||
        (event as any).owner === principal ||
        (event as any).member === principal ||
        (event as any).user === principal ||
        (event as any).creator === principal
      )
    },
    maxEvents
  )
}
