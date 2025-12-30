# Event Usage Examples

This guide provides practical examples for integrating contract events into your application.

## Table of Contents

- [Basic Event Listening](#basic-event-listening)
- [React Component Examples](#react-component-examples)
- [Event Filtering](#event-filtering)
- [Real-time UI Updates](#real-time-ui-updates)
- [Analytics and Logging](#analytics-and-logging)
- [Advanced Patterns](#advanced-patterns)

## Basic Event Listening

### Subscribe to a Single Event Type

```typescript
import { eventManager, EVENT_NAMES } from '@/lib/utils/contractEvents'

// Subscribe to badge minting events
const unsubscribe = eventManager.on(EVENT_NAMES.BADGE_MINTED, (event) => {
  console.log('Badge minted:', event.badgeId)
  console.log('Recipient:', event.recipient)
  console.log('Level:', event.level)
})

// Later, unsubscribe
unsubscribe()
```

### Subscribe to All Events

```typescript
import { eventManager } from '@/lib/utils/contractEvents'

// Listen to all contract events
const unsubscribe = eventManager.on('*', (event) => {
  console.log('Event received:', event.event)
  console.log('Block height:', event.blockHeight)
})
```

## React Component Examples

### Badge Notification Component

```typescript
'use client'

import { useBadgeMinted } from '@/hooks/useContractEvents'
import { toast } from 'sonner'

export function BadgeNotifications() {
  useBadgeMinted((event) => {
    toast.success(`Badge #${event.badgeId} minted!`, {
      description: `Awarded to ${event.recipient}`
    })
  })

  return null // This component only handles side effects
}
```

### Recent Badges List

```typescript
'use client'

import { useEventHistory, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

export function RecentBadgesList() {
  // Track the last 10 badge minting events
  const recentBadges = useEventHistory<BadgeMintedEvent>(
    EVENT_NAMES.BADGE_MINTED,
    10
  )

  return (
    <div>
      <h2>Recently Minted Badges</h2>
      <ul>
        {recentBadges.map((event) => (
          <li key={event.badgeId}>
            Badge #{event.badgeId} - Level {event.level}
            <small>Block {event.blockHeight}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Live Badge Counter

```typescript
'use client'

import { useEventCount, EVENT_NAMES } from '@/hooks/useContractEvents'

export function BadgeCounter() {
  const count = useEventCount(EVENT_NAMES.BADGE_MINTED)

  return (
    <div className="badge-counter">
      <h3>Total Badges Minted</h3>
      <div className="count">{count}</div>
    </div>
  )
}
```

### User Badge Dashboard

```typescript
'use client'

import { useEventsForPrincipal, EVENT_NAMES } from '@/hooks/useContractEvents'
import { useWallet } from '@/hooks/useWallet'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

export function UserBadgeDashboard() {
  const { address } = useWallet()

  // Get all badges minted to the current user
  const userBadges = useEventsForPrincipal<BadgeMintedEvent>(
    EVENT_NAMES.BADGE_MINTED,
    address,
    50
  )

  return (
    <div>
      <h2>Your Badges ({userBadges.length})</h2>
      <div className="badge-grid">
        {userBadges.map((event) => (
          <BadgeCard
            key={event.badgeId}
            badgeId={event.badgeId}
            level={event.level}
            category={event.category}
          />
        ))}
      </div>
    </div>
  )
}
```

## Event Filtering

### Filter by Badge Level

```typescript
import { useFilteredEvents, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

export function GoldBadges() {
  // Only show level 5 (gold) badges
  const goldBadges = useFilteredEvents<BadgeMintedEvent>(
    EVENT_NAMES.BADGE_MINTED,
    (event) => event.level === 5,
    100
  )

  return (
    <div>
      <h2>Gold Badges ({goldBadges.length})</h2>
      {goldBadges.map((event) => (
        <div key={event.badgeId}>
          Badge #{event.badgeId} awarded to {event.recipient}
        </div>
      ))}
    </div>
  )
}
```

### Filter by Category

```typescript
import { useFilteredEvents, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'
import { BadgeCategory } from '@/types/contractEvents'

export function AchievementBadges() {
  const achievementBadges = useFilteredEvents<BadgeMintedEvent>(
    EVENT_NAMES.BADGE_MINTED,
    (event) => event.category === BadgeCategory.ACHIEVEMENT,
    50
  )

  return <div>{/* Render achievement badges */}</div>
}
```

### Filter by Community

```typescript
import { useFilteredEvents, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { CommunityMemberAddedEvent } from '@/lib/utils/contractEvents'

export function CommunityMembers({ communityId }: { communityId: number }) {
  const members = useFilteredEvents<CommunityMemberAddedEvent>(
    EVENT_NAMES.COMMUNITY_MEMBER_ADDED,
    (event) => event.communityId === communityId,
    100
  )

  return (
    <div>
      <h3>Members ({members.length})</h3>
      <ul>
        {members.map((event, index) => (
          <li key={index}>
            {event.member} - {event.role}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

## Real-time UI Updates

### Auto-refresh Badge List

```typescript
'use client'

import { useState } from 'react'
import { useBadgeMinted } from '@/hooks/useContractEvents'

export function BadgeList() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Refresh badge list when new badge is minted
  useBadgeMinted(
    () => {
      setRefreshTrigger((prev) => prev + 1)
    },
    [setRefreshTrigger]
  )

  useEffect(() => {
    loadBadges().then(setBadges)
  }, [refreshTrigger])

  return <div>{/* Render badges */}</div>
}
```

### Live Activity Feed

```typescript
'use client'

import { useAllContractEvents } from '@/hooks/useContractEvents'
import { useState } from 'react'
import type { ContractEvent } from '@/lib/utils/contractEvents'

export function ActivityFeed() {
  const [activities, setActivities] = useState<ContractEvent[]>([])

  useAllContractEvents(
    (event) => {
      setActivities((prev) => [event, ...prev].slice(0, 20))
    },
    [setActivities]
  )

  return (
    <div className="activity-feed">
      <h2>Recent Activity</h2>
      {activities.map((event, index) => (
        <ActivityItem key={index} event={event} />
      ))}
    </div>
  )
}

function ActivityItem({ event }: { event: ContractEvent }) {
  switch (event.event) {
    case 'badge-minted':
      return <div>🏆 Badge #{event.badgeId} minted</div>
    case 'community-created':
      return <div>👥 Community "{event.name}" created</div>
    case 'template-created':
      return <div>📋 Template "{event.name}" created</div>
    default:
      return <div>📌 {event.event}</div>
  }
}
```

### Toast Notifications

```typescript
'use client'

import { useContractEvent, EVENT_NAMES } from '@/hooks/useContractEvents'
import { toast } from 'sonner'

export function EventNotifications() {
  // Badge minted notifications
  useContractEvent(EVENT_NAMES.BADGE_MINTED, (event) => {
    toast.success('Badge Minted', {
      description: `Badge #${event.badgeId} awarded!`
    })
  })

  // Badge revoked notifications
  useContractEvent(EVENT_NAMES.BADGE_REVOKED, (event) => {
    toast.warning('Badge Revoked', {
      description: `Badge #${event.badgeId} has been revoked`
    })
  })

  // Community created notifications
  useContractEvent(EVENT_NAMES.COMMUNITY_CREATED, (event) => {
    toast.info('New Community', {
      description: `${event.name} was created`
    })
  })

  return null
}
```

## Analytics and Logging

### Event Logger

```typescript
import { useAllContractEvents } from '@/hooks/useContractEvents'
import { useCallback } from 'react'

export function EventLogger() {
  const logEvent = useCallback(async (event: ContractEvent) => {
    // Send to analytics service
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: event.event,
        blockHeight: event.blockHeight,
        timestamp: Date.now(),
        data: event
      })
    })
  }, [])

  useAllContractEvents(logEvent, [logEvent])

  return null
}
```

### Badge Statistics

```typescript
'use client'

import { useEventHistory, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'
import { useMemo } from 'react'

export function BadgeStatistics() {
  const badges = useEventHistory<BadgeMintedEvent>(
    EVENT_NAMES.BADGE_MINTED,
    1000
  )

  const stats = useMemo(() => {
    const levelCounts = badges.reduce(
      (acc, event) => {
        acc[event.level] = (acc[event.level] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    const categoryCounts = badges.reduce(
      (acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    return { levelCounts, categoryCounts }
  }, [badges])

  return (
    <div>
      <h2>Badge Statistics</h2>
      <div>
        <h3>By Level</h3>
        {Object.entries(stats.levelCounts).map(([level, count]) => (
          <div key={level}>
            Level {level}: {count} badges
          </div>
        ))}
      </div>
      <div>
        <h3>By Category</h3>
        {Object.entries(stats.categoryCounts).map(([category, count]) => (
          <div key={category}>
            Category {category}: {count} badges
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Advanced Patterns

### Event Queue with Processing

```typescript
import { eventManager, EVENT_NAMES } from '@/lib/utils/contractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

class BadgeProcessor {
  private queue: BadgeMintedEvent[] = []
  private processing = false

  constructor() {
    eventManager.on(EVENT_NAMES.BADGE_MINTED, (event) => {
      this.enqueue(event)
    })
  }

  private enqueue(event: BadgeMintedEvent) {
    this.queue.push(event)
    this.processQueue()
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const event = this.queue.shift()!
      await this.processBadge(event)
    }

    this.processing = false
  }

  private async processBadge(event: BadgeMintedEvent) {
    // Process badge (e.g., update database, send notification)
    console.log('Processing badge:', event.badgeId)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export const badgeProcessor = new BadgeProcessor()
```

### Event Replay for Missed Events

```typescript
import { eventManager, parseContractEvent } from '@/lib/utils/contractEvents'

async function replayEvents(fromBlock: number, toBlock: number) {
  // Fetch events from blockchain API
  const response = await fetch(
    `/api/events?from=${fromBlock}&to=${toBlock}`
  )
  const rawEvents = await response.json()

  // Parse and emit events
  for (const rawEvent of rawEvents) {
    const event = parseContractEvent(rawEvent)
    if (event) {
      await eventManager.emit(event)
    }
  }
}

// Usage: replay events from block 1000 to current
replayEvents(1000, currentBlockHeight)
```

### Conditional Event Handlers

```typescript
import { useContractEvent, EVENT_NAMES } from '@/hooks/useContractEvents'
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

export function ConditionalBadgeHandler({ userAddress }: { userAddress: string }) {
  useContractEvent(
    EVENT_NAMES.BADGE_MINTED,
    (event: BadgeMintedEvent) => {
      // Only handle events for the current user
      if (event.recipient === userAddress) {
        // Update user's badge collection
        updateUserBadges(event.badgeId)

        // Show notification
        showNotification(`You received badge #${event.badgeId}!`)
      }
    },
    [userAddress]
  )

  return null
}
```

## Best Practices

### 1. Clean Up Subscriptions

Always unsubscribe from events when components unmount:

```typescript
useEffect(() => {
  const unsubscribe = eventManager.on(EVENT_NAMES.BADGE_MINTED, handleBadge)

  return () => {
    unsubscribe() // Clean up on unmount
  }
}, [])
```

### 2. Use Typed Events

Leverage TypeScript for type safety:

```typescript
import type { BadgeMintedEvent } from '@/lib/utils/contractEvents'

useBadgeMinted((event: BadgeMintedEvent) => {
  // TypeScript knows about event.badgeId, event.level, etc.
  console.log(event.badgeId)
})
```

### 3. Debounce High-Frequency Updates

For UI updates, consider debouncing:

```typescript
import { useBadgeMinted } from '@/hooks/useContractEvents'
import { useDebouncedCallback } from 'use-debounce'

const refreshBadges = useDebouncedCallback(() => {
  loadBadges()
}, 1000)

useBadgeMinted(() => {
  refreshBadges()
})
```

### 4. Handle Errors Gracefully

```typescript
useEventHandler(EVENT_NAMES.BADGE_MINTED, async (event) => {
  try {
    await saveBadge(event)
  } catch (error) {
    console.error('Failed to save badge:', error)
    toast.error('Failed to process badge event')
  }
})
```

## See Also

- [Events Reference](./EVENTS.md)
- [Error Handling](../.github/ERROR_HANDLING.md)
- [Frontend Integration](./FRONTEND_INTEGRATION.md)
