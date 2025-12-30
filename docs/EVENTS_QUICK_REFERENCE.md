# Contract Events Quick Reference

Quick lookup table for all contract events.

## Event Summary

| Contract | Events | Total |
|----------|--------|-------|
| badge-issuer | 7 events | 7 |
| community-manager | 5 events | 5 |
| access-control | 4 events | 4 |
| passport-nft | 1 event | 1 |
| **Total** | | **17** |

## Badge Issuer Events

| Event | Emitted When | Key Fields |
|-------|-------------|-----------|
| `badge-minted` | Single badge minted | badgeId, recipient, level |
| `batch-badges-minted` | Multiple badges minted | batchId, count, badgeIds[] |
| `template-created` | Badge template created | templateId, name, category |
| `badge-revoked` | Badge revoked | badgeId, revokedBy |
| `badge-metadata-updated` | Badge metadata changed | badgeId, oldLevel, newLevel |
| `issuer-authorized` | Issuer granted permissions | issuer, authorizedBy |
| `issuer-revoked` | Issuer permissions removed | issuer, revokedBy |

## Community Manager Events

| Event | Emitted When | Key Fields |
|-------|-------------|-----------|
| `community-created` | New community created | communityId, name, owner |
| `community-member-added` | Member joins community | communityId, member, role |
| `community-settings-updated` | Community settings changed | communityId, publicBadges, requireApproval |
| `community-deactivated` | Community deactivated | communityId, deactivatedBy |
| `community-ownership-transferred` | Ownership changes | communityId, oldOwner, newOwner |

## Access Control Events

| Event | Emitted When | Key Fields |
|-------|-------------|-----------|
| `global-permissions-updated` | User's global perms changed | user, canCreateCommunities, isPlatformAdmin |
| `community-permissions-updated` | Community perms changed | communityId, user, role |
| `user-suspended` | User account suspended | user, suspendedBy |
| `user-unsuspended` | User account restored | user, unsuspendedBy |

## Passport NFT Events

| Event | Emitted When | Key Fields |
|-------|-------------|-----------|
| `passport-badge-minted` | NFT token minted | tokenId, recipient |

## Events by Category

### User Activity (5 events)
- `badge-minted`
- `batch-badges-minted`
- `passport-badge-minted`
- `community-created`
- `community-member-added`

### Administrative (7 events)
- `template-created`
- `issuer-authorized`
- `issuer-revoked`
- `badge-revoked`
- `badge-metadata-updated`
- `user-suspended`
- `user-unsuspended`

### Community (5 events)
- `community-created`
- `community-member-added`
- `community-settings-updated`
- `community-deactivated`
- `community-ownership-transferred`

### Permissions (4 events)
- `global-permissions-updated`
- `community-permissions-updated`
- `user-suspended`
- `user-unsuspended`

## Common Fields

All events include:
- `event`: Event name (string)
- `block-height`: Block number (uint)

Most events also include:
- `*-by`: Principal who performed the action

## Quick Import

### TypeScript Constants

```typescript
import { EVENT_NAMES } from '@/lib/utils/contractEvents'

EVENT_NAMES.BADGE_MINTED
EVENT_NAMES.COMMUNITY_CREATED
EVENT_NAMES.TEMPLATE_CREATED
// etc.
```

### React Hooks

```typescript
import {
  useBadgeMinted,
  useCommunityCreated,
  useTemplateCreated,
  useAllContractEvents
} from '@/hooks/useContractEvents'
```

### Event Manager

```typescript
import { eventManager } from '@/lib/utils/contractEvents'

eventManager.on(EVENT_NAMES.BADGE_MINTED, handleBadge)
```

## Event Naming Convention

All events follow the pattern: `{noun}-{verb-past-tense}`

Examples:
- `badge-minted` (not `mint-badge`)
- `user-suspended` (not `suspend-user`)
- `community-created` (not `create-community`)

## Event Data Types

```typescript
import type {
  BadgeMintedEvent,
  CommunityCreatedEvent,
  TemplateCreatedEvent,
  ContractEvent
} from '@/lib/utils/contractEvents'
```

## Filtering Helpers

```typescript
import {
  filterEventsByType,
  filterEventsByBlockRange,
  filterEventsByPrincipal,
  sortEventsByBlock,
  groupEventsByType,
  getMostRecentEvent
} from '@/lib/utils/contractEvents'
```

## Common Patterns

### Listen to specific event
```typescript
useBadgeMinted((event) => {
  console.log('Badge:', event.badgeId)
})
```

### Listen to all events
```typescript
useAllContractEvents((event) => {
  console.log('Event:', event.event)
})
```

### Track event history
```typescript
const recent = useEventHistory(EVENT_NAMES.BADGE_MINTED, 10)
```

### Filter events
```typescript
const filtered = useFilteredEvents(
  EVENT_NAMES.BADGE_MINTED,
  (e) => e.level === 5
)
```

### Count events
```typescript
const count = useEventCount(EVENT_NAMES.BADGE_MINTED)
```

### Get user's events
```typescript
const myEvents = useEventsForPrincipal(
  EVENT_NAMES.BADGE_MINTED,
  userAddress
)
```

## See Also

- [Full Events Reference](./EVENTS.md)
- [Usage Examples](./EVENT_USAGE_EXAMPLES.md)
- [Error Codes](./ERROR_CODES.md)
