# Event Testing Guide

Guide for testing contract events in both smart contracts and frontend applications.

## Table of Contents

- [Contract Testing](#contract-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)

## Contract Testing

### Testing Event Emission in Clarity

#### Basic Event Test

```clarity
;; Test that badge-minted event is emitted
(define-public (test-badge-minted-event)
  (let
    (
      (result (contract-call? .badge-issuer mint-badge
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
        u1))
    )
    (asserts! (is-ok result) (err u1))
    ;; Event should be emitted with correct data
    (ok true)
  )
)
```

#### Testing Event Data

Verify event contains expected fields:

```typescript
import { describe, it, expect } from '@jest/globals'

describe('Badge Minting Events', () => {
  it('should emit badge-minted event with correct data', async () => {
    const receipt = await contract.mintBadge({
      sender: issuer,
      args: [recipient, templateId]
    })

    expect(receipt.events).toHaveLength(1)

    const event = receipt.events[0]
    expect(event.event).toBe('badge-minted')
    expect(event.badgeId).toBeDefined()
    expect(event.recipient).toBe(recipient)
    expect(event.templateId).toBe(templateId)
  })
})
```

### Testing Multiple Events

```typescript
it('should emit multiple events in batch mint', async () => {
  const recipients = [user1, user2, user3]
  const templateIds = [1, 1, 2]

  const receipt = await contract.batchMintBadges({
    sender: issuer,
    args: [recipients, templateIds]
  })

  // Should emit one batch-badges-minted event
  const batchEvent = receipt.events.find(e => e.event === 'batch-badges-minted')
  expect(batchEvent).toBeDefined()
  expect(batchEvent.count).toBe(3)
  expect(batchEvent.recipients).toEqual(recipients)
})
```

### Testing Event Order

```typescript
it('should emit events in correct order', async () => {
  await contract.authorizeIssuer({ sender: owner, args: [newIssuer] })
  await contract.createTemplate({ sender: newIssuer, args: [name, desc, cat, lvl] })
  await contract.mintBadge({ sender: newIssuer, args: [recipient, templateId] })

  const events = await getRecentEvents()

  expect(events[0].event).toBe('issuer-authorized')
  expect(events[1].event).toBe('template-created')
  expect(events[2].event).toBe('badge-minted')
})
```

## Frontend Testing

### Testing React Hooks

#### Testing useContractEvent Hook

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useContractEvent, EVENT_NAMES } from '@/hooks/useContractEvents'
import { eventManager } from '@/lib/utils/contractEvents'

describe('useContractEvent', () => {
  it('should call listener when event is emitted', async () => {
    const listener = jest.fn()

    renderHook(() => useContractEvent(EVENT_NAMES.BADGE_MINTED, listener))

    // Emit test event
    await eventManager.emit({
      event: 'badge-minted',
      badgeId: 123,
      recipient: 'ST1...',
      templateId: 1,
      issuer: 'ST2...',
      level: 3,
      category: 1,
      blockHeight: 1000
    })

    await waitFor(() => {
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          badgeId: 123,
          recipient: 'ST1...'
        })
      )
    })
  })

  it('should clean up subscription on unmount', () => {
    const listener = jest.fn()
    const { unmount } = renderHook(() =>
      useContractEvent(EVENT_NAMES.BADGE_MINTED, listener)
    )

    unmount()

    // Emit event after unmount
    eventManager.emit({
      event: 'badge-minted',
      badgeId: 456,
      blockHeight: 1001
    })

    expect(listener).not.toHaveBeenCalled()
  })
})
```

#### Testing useBadgeMinted Hook

```typescript
describe('useBadgeMinted', () => {
  it('should update component state when badge is minted', async () => {
    const { result } = renderHook(() => {
      const [badges, setBadges] = useState([])
      useBadgeMinted((event) => {
        setBadges(prev => [...prev, event.badgeId])
      })
      return badges
    })

    // Emit badge minted event
    await eventManager.emit({
      event: 'badge-minted',
      badgeId: 100,
      blockHeight: 1000
    })

    await waitFor(() => {
      expect(result.current).toEqual([100])
    })
  })
})
```

### Testing Event Manager

```typescript
describe('EventSubscriptionManager', () => {
  let manager: EventSubscriptionManager

  beforeEach(() => {
    manager = new EventSubscriptionManager()
  })

  afterEach(() => {
    manager.removeAllListeners()
  })

  it('should subscribe and emit events', async () => {
    const listener = jest.fn()
    manager.on(EVENT_NAMES.BADGE_MINTED, listener)

    await manager.emit({
      event: 'badge-minted',
      badgeId: 1,
      blockHeight: 100
    })

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should unsubscribe listeners', async () => {
    const listener = jest.fn()
    const unsubscribe = manager.on(EVENT_NAMES.BADGE_MINTED, listener)

    unsubscribe()

    await manager.emit({
      event: 'badge-minted',
      badgeId: 2,
      blockHeight: 101
    })

    expect(listener).not.toHaveBeenCalled()
  })

  it('should support wildcard listeners', async () => {
    const listener = jest.fn()
    manager.on('*', listener)

    await manager.emit({ event: 'badge-minted', blockHeight: 100 })
    await manager.emit({ event: 'community-created', blockHeight: 101 })

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
```

### Testing Event Parsing

```typescript
describe('parseContractEvent', () => {
  it('should parse raw Stacks event correctly', () => {
    const rawEvent = {
      contract_event: {
        value: {
          event: 'badge-minted',
          'badge-id': { type: 'uint', value: '123' },
          recipient: { type: 'principal', value: 'ST1...' },
          level: { type: 'uint', value: '3' }
        }
      },
      block_height: 1000
    }

    const parsed = parseContractEvent(rawEvent)

    expect(parsed).toEqual({
      event: 'badge-minted',
      badgeId: 123,
      recipient: 'ST1...',
      level: 3,
      blockHeight: 1000
    })
  })

  it('should handle invalid events gracefully', () => {
    const result = parseContractEvent(null)
    expect(result).toBeNull()
  })
})
```

### Testing Event Filtering

```typescript
describe('Event Filtering', () => {
  const events = [
    { event: 'badge-minted', badgeId: 1, level: 3, blockHeight: 100 },
    { event: 'badge-minted', badgeId: 2, level: 5, blockHeight: 101 },
    { event: 'community-created', communityId: 1, blockHeight: 102 }
  ]

  it('should filter events by type', () => {
    const badges = filterEventsByType(events, EVENT_NAMES.BADGE_MINTED)
    expect(badges).toHaveLength(2)
    expect(badges[0].badgeId).toBe(1)
  })

  it('should filter events by block range', () => {
    const filtered = filterEventsByBlockRange(events, 100, 101)
    expect(filtered).toHaveLength(2)
  })

  it('should filter events by custom predicate', () => {
    const goldBadges = events.filter(e =>
      e.event === 'badge-minted' && e.level === 5
    )
    expect(goldBadges).toHaveLength(1)
    expect(goldBadges[0].badgeId).toBe(2)
  })
})
```

## Integration Testing

### End-to-End Event Flow

```typescript
describe('Badge Minting Flow', () => {
  it('should emit events throughout the minting process', async () => {
    const events = []
    const unsubscribe = eventManager.on('*', (event) => {
      events.push(event)
    })

    // Create template
    await createTemplate({
      name: 'Test Badge',
      description: 'A test badge',
      category: 1,
      defaultLevel: 3
    })

    // Mint badge
    await mintBadge({
      recipient: userAddress,
      templateId: 1
    })

    // Verify events
    expect(events).toHaveLength(2)
    expect(events[0].event).toBe('template-created')
    expect(events[1].event).toBe('badge-minted')

    unsubscribe()
  })
})
```

### Testing Event-Driven UI Updates

```typescript
import { render, screen, waitFor } from '@testing-library/react'

describe('BadgeList Component', () => {
  it('should update when badge is minted', async () => {
    render(<BadgeList userId={testUser} />)

    expect(screen.getByText('No badges yet')).toBeInTheDocument()

    // Simulate badge minting event
    await eventManager.emit({
      event: 'badge-minted',
      badgeId: 1,
      recipient: testUser,
      blockHeight: 1000
    })

    await waitFor(() => {
      expect(screen.queryByText('No badges yet')).not.toBeInTheDocument()
      expect(screen.getByText('Badge #1')).toBeInTheDocument()
    })
  })
})
```

## Test Utilities

### Mock Event Generator

```typescript
export function createMockBadgeEvent(overrides = {}) {
  return {
    event: 'badge-minted',
    badgeId: 1,
    recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    templateId: 1,
    issuer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    level: 3,
    category: 1,
    blockHeight: 1000,
    ...overrides
  }
}

// Usage
const event = createMockBadgeEvent({ badgeId: 42, level: 5 })
```

### Event Test Helper

```typescript
export class EventTestHelper {
  private events: ContractEvent[] = []
  private unsubscribe: (() => void) | null = null

  startRecording() {
    this.events = []
    this.unsubscribe = eventManager.on('*', (event) => {
      this.events.push(event)
    })
  }

  stopRecording() {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
  }

  getEvents() {
    return [...this.events]
  }

  getEventsByType(eventName: EventName) {
    return this.events.filter(e => e.event === eventName)
  }

  clearEvents() {
    this.events = []
  }
}

// Usage
const helper = new EventTestHelper()
helper.startRecording()
await performAction()
expect(helper.getEventsByType('badge-minted')).toHaveLength(1)
helper.stopRecording()
```

## Best Practices

### 1. Test Event Emission

Always verify that events are emitted when expected:

```typescript
it('should emit event on success', async () => {
  const listener = jest.fn()
  eventManager.on(EVENT_NAMES.BADGE_MINTED, listener)

  await mintBadge(recipient, templateId)

  expect(listener).toHaveBeenCalled()
})
```

### 2. Test Event Data

Verify event data is correct:

```typescript
it('should emit correct event data', async () => {
  const listener = jest.fn()
  eventManager.on(EVENT_NAMES.BADGE_MINTED, listener)

  await mintBadge(recipient, templateId)

  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({
      recipient,
      templateId
    })
  )
})
```

### 3. Test Cleanup

Ensure subscriptions are cleaned up:

```typescript
it('should cleanup on unmount', () => {
  const { unmount } = renderHook(() => useBadgeMinted(listener))

  const initialCount = eventManager.listenerCount('badge-minted')
  unmount()
  const finalCount = eventManager.listenerCount('badge-minted')

  expect(finalCount).toBeLessThan(initialCount)
})
```

### 4. Test Error Cases

Handle event errors gracefully:

```typescript
it('should handle event parsing errors', () => {
  const invalidEvent = { invalid: 'data' }
  const result = parseContractEvent(invalidEvent)

  expect(result).toBeNull()
})
```

### 5. Use Async Testing

Events are often async, use proper async testing:

```typescript
it('should process event asynchronously', async () => {
  const result = await waitForEvent(EVENT_NAMES.BADGE_MINTED, () => {
    mintBadge(recipient, templateId)
  })

  expect(result.badgeId).toBeDefined()
})
```

## See Also

- [Events Reference](./EVENTS.md)
- [Usage Examples](./EVENT_USAGE_EXAMPLES.md)
- [Error Handling](../.github/ERROR_HANDLING.md)
