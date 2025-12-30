# Contract Events Reference

## Overview

PassportX smart contracts emit events for all critical actions to enable real-time monitoring, analytics, and frontend state synchronization. All events use Clarity's `print` function with structured data objects.

## Event Structure

All events follow a consistent structure:

```clarity
(print {
  event: "event-name",
  [relevant-fields]: values,
  block-height: block-height
})
```

### Common Fields

- `event`: String identifier for the event type
- `block-height`: Block number when the event was emitted (used as timestamp)
- `*-by`: Principal who initiated the action (e.g., `minted-by`, `updated-by`)

## Badge Issuer Events

### badge-minted

Emitted when a new badge is minted to a recipient.

**Fields:**
- `event`: "badge-minted"
- `badge-id`: uint - ID of the newly minted badge
- `recipient`: principal - Address receiving the badge
- `template-id`: uint - Template used for the badge
- `issuer`: principal - Address that issued the badge
- `level`: uint - Badge level (1-5)
- `category`: uint - Badge category
- `block-height`: uint

**Example:**
```clarity
{
  event: "badge-minted",
  badge-id: u42,
  recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  template-id: u5,
  issuer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  level: u3,
  category: u2,
  block-height: u12345
}
```

### batch-badges-minted

Emitted when multiple badges are minted in a single batch operation.

**Fields:**
- `event`: "batch-badges-minted"
- `batch-id`: uint - Sequential batch identifier
- `issuer`: principal - Address that issued the batch
- `recipients`: (list 50 principal) - List of badge recipients
- `template-ids`: (list 50 uint) - List of template IDs used
- `badge-ids`: (list 50 uint) - List of newly created badge IDs
- `count`: uint - Number of badges in the batch
- `block-height`: uint

**Example:**
```clarity
{
  event: "batch-badges-minted",
  batch-id: u1,
  issuer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  recipients: ['ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM, ...],
  template-ids: [u5, u7, ...],
  badge-ids: [u100, u101, ...],
  count: u10,
  block-height: u12346
}
```

### template-created

Emitted when a new badge template is created.

**Fields:**
- `event`: "template-created"
- `template-id`: uint - ID of the new template
- `name`: (string-ascii 64) - Template name
- `description`: (string-ascii 256) - Template description
- `category`: uint - Badge category
- `default-level`: uint - Default level for badges from this template
- `creator`: principal - Address that created the template
- `block-height`: uint

**Example:**
```clarity
{
  event: "template-created",
  template-id: u10,
  name: "Code Contributor",
  description: "Awarded for contributing code to the project",
  category: u1,
  default-level: u3,
  creator: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12340
}
```

### badge-revoked

Emitted when a badge is revoked by its issuer or contract owner.

**Fields:**
- `event`: "badge-revoked"
- `badge-id`: uint - ID of the revoked badge
- `issuer`: principal - Original issuer of the badge
- `revoked-by`: principal - Address that revoked the badge
- `block-height`: uint

**Example:**
```clarity
{
  event: "badge-revoked",
  badge-id: u42,
  issuer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  revoked-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12350
}
```

### badge-metadata-updated

Emitted when badge metadata (level, category, timestamp) is updated.

**Fields:**
- `event`: "badge-metadata-updated"
- `badge-id`: uint - ID of the badge
- `old-level`: uint - Previous level
- `new-level`: uint - New level
- `old-category`: uint - Previous category
- `new-category`: uint - New category
- `updated-by`: principal - Address that updated the metadata
- `block-height`: uint

**Example:**
```clarity
{
  event: "badge-metadata-updated",
  badge-id: u42,
  old-level: u2,
  new-level: u4,
  old-category: u1,
  new-category: u1,
  updated-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12355
}
```

### issuer-authorized

Emitted when a new issuer is authorized to mint badges.

**Fields:**
- `event`: "issuer-authorized"
- `issuer`: principal - Address that was authorized
- `authorized-by`: principal - Contract owner who granted authorization
- `block-height`: uint

**Example:**
```clarity
{
  event: "issuer-authorized",
  issuer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  authorized-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12300
}
```

### issuer-revoked

Emitted when an issuer's authorization is revoked.

**Fields:**
- `event`: "issuer-revoked"
- `issuer`: principal - Address that lost authorization
- `revoked-by`: principal - Contract owner who revoked authorization
- `block-height`: uint

**Example:**
```clarity
{
  event: "issuer-revoked",
  issuer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  revoked-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12400
}
```

## Community Manager Events

### community-created

Emitted when a new community is created.

**Fields:**
- `event`: "community-created"
- `community-id`: uint - ID of the new community
- `name`: (string-ascii 64) - Community name
- `description`: (string-ascii 256) - Community description
- `owner`: principal - Community owner
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-created",
  community-id: u5,
  name: "Open Source Contributors",
  description: "A community for open source developers",
  owner: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12500
}
```

### community-member-added

Emitted when a new member is added to a community.

**Fields:**
- `event`: "community-member-added"
- `community-id`: uint - Community ID
- `member`: principal - Address of the new member
- `role`: (string-ascii 32) - Member's role
- `added-by`: principal - Address that added the member
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-member-added",
  community-id: u5,
  member: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  role: "moderator",
  added-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12510
}
```

### community-settings-updated

Emitted when community settings are changed.

**Fields:**
- `event`: "community-settings-updated"
- `community-id`: uint - Community ID
- `public-badges`: bool - Whether badges are public
- `allow-member-requests`: bool - Whether member requests are allowed
- `require-approval`: bool - Whether approval is required
- `updated-by`: principal - Address that updated settings
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-settings-updated",
  community-id: u5,
  public-badges: true,
  allow-member-requests: true,
  require-approval: false,
  updated-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12520
}
```

### community-deactivated

Emitted when a community is deactivated by its owner.

**Fields:**
- `event`: "community-deactivated"
- `community-id`: uint - Community ID
- `deactivated-by`: principal - Community owner who deactivated it
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-deactivated",
  community-id: u5,
  deactivated-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12600
}
```

### community-ownership-transferred

Emitted when community ownership is transferred to a new owner.

**Fields:**
- `event`: "community-ownership-transferred"
- `community-id`: uint - Community ID
- `old-owner`: principal - Previous owner
- `new-owner`: principal - New owner
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-ownership-transferred",
  community-id: u5,
  old-owner: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  new-owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  block-height: u12700
}
```

## Access Control Events

### global-permissions-updated

Emitted when a user's global permissions are updated.

**Fields:**
- `event`: "global-permissions-updated"
- `user`: principal - User whose permissions were updated
- `can-create-communities`: bool - Permission to create communities
- `can-issue-badges`: bool - Permission to issue badges globally
- `is-platform-admin`: bool - Platform admin status
- `suspended`: bool - Account suspension status
- `updated-by`: principal - Platform admin who made the change
- `block-height`: uint

**Example:**
```clarity
{
  event: "global-permissions-updated",
  user: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  can-create-communities: true,
  can-issue-badges: true,
  is-platform-admin: false,
  suspended: false,
  updated-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12800
}
```

### community-permissions-updated

Emitted when a user's community-specific permissions are updated.

**Fields:**
- `event`: "community-permissions-updated"
- `community-id`: uint - Community ID
- `user`: principal - User whose permissions were updated
- `can-issue-badges`: bool - Permission to issue badges in community
- `can-manage-members`: bool - Permission to manage community members
- `can-create-templates`: bool - Permission to create badge templates
- `can-revoke-badges`: bool - Permission to revoke badges
- `role`: (string-ascii 32) - User's role in the community
- `updated-by`: principal - Address that updated permissions
- `block-height`: uint

**Example:**
```clarity
{
  event: "community-permissions-updated",
  community-id: u5,
  user: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  can-issue-badges: true,
  can-manage-members: false,
  can-create-templates: true,
  can-revoke-badges: false,
  role: "issuer",
  updated-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12850
}
```

### user-suspended

Emitted when a user account is suspended by a platform admin.

**Fields:**
- `event`: "user-suspended"
- `user`: principal - Suspended user
- `suspended-by`: principal - Platform admin who suspended the user
- `block-height`: uint

**Example:**
```clarity
{
  event: "user-suspended",
  user: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  suspended-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12900
}
```

### user-unsuspended

Emitted when a suspended user account is restored by a platform admin.

**Fields:**
- `event`: "user-unsuspended"
- `user`: principal - Unsuspended user
- `unsuspended-by`: principal - Platform admin who unsuspended the user
- `block-height`: uint

**Example:**
```clarity
{
  event: "user-unsuspended",
  user: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  unsuspended-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u12950
}
```

## Passport NFT Events

### passport-badge-minted

Emitted when a new passport badge NFT is minted.

**Fields:**
- `event`: "passport-badge-minted"
- `token-id`: uint - ID of the minted NFT
- `recipient`: principal - Address receiving the NFT
- `minted-by`: principal - Address that minted the NFT (contract owner)
- `block-height`: uint

**Example:**
```clarity
{
  event: "passport-badge-minted",
  token-id: u123,
  recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM,
  minted-by: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG,
  block-height: u13000
}
```

## Event Categories

Events can be grouped by their purpose:

### User Activity Events
- `badge-minted`
- `batch-badges-minted`
- `passport-badge-minted`
- `community-created`
- `community-member-added`

### Administrative Events
- `template-created`
- `issuer-authorized`
- `issuer-revoked`
- `badge-revoked`
- `badge-metadata-updated`
- `global-permissions-updated`
- `community-permissions-updated`
- `user-suspended`
- `user-unsuspended`

### Community Events
- `community-created`
- `community-member-added`
- `community-settings-updated`
- `community-deactivated`
- `community-ownership-transferred`

## Frontend Integration

### Listening to Events

Events can be monitored using the Stacks.js library:

```typescript
import { connectWebSocketClient } from '@stacks/blockchain-api-client'

const client = await connectWebSocketClient('wss://stacks-node-api.mainnet.stacks.co/')

client.subscribeBlocks((block) => {
  // Process events from block
})
```

### Parsing Events

All events use the same structure, making parsing straightforward:

```typescript
interface ContractEvent {
  event: string
  [key: string]: any
  block_height: number
}

function parseEvent(rawEvent: any): ContractEvent {
  const data = rawEvent.contract_event.value
  return {
    event: data.event,
    ...parseFields(data),
    block_height: rawEvent.block_height
  }
}
```

### Event Filtering

Filter events by type:

```typescript
function filterEventsByType(events: ContractEvent[], eventType: string) {
  return events.filter(e => e.event === eventType)
}

// Get all badge minting events
const mintEvents = filterEventsByType(allEvents, 'badge-minted')
```

## Best Practices

### For Contract Developers

1. **Always emit events for state changes**: Every public function that modifies state should emit an event
2. **Include relevant context**: Add all information needed to understand the action without additional contract calls
3. **Use consistent naming**: Follow the pattern `noun-verb-past-tense` (e.g., `badge-minted`, `user-suspended`)
4. **Include block-height**: Always include block-height as a timestamp
5. **Document events**: Update this documentation when adding new events

### For Frontend Developers

1. **Subscribe to relevant events**: Only listen to events you need for your features
2. **Handle event lag**: Events may arrive with a delay; implement optimistic updates
3. **Validate event data**: Always validate event data before using it
4. **Store events locally**: Consider caching events for better UX
5. **Use block-height for ordering**: Events may arrive out of order; use block-height to sort

## Testing Events

### Unit Testing

Test that events are emitted correctly:

```clarity
;; Test that badge-minted event is emitted
(contract-call? .badge-issuer mint-badge recipient template-id)
;; Check that event was emitted with correct data
```

### Integration Testing

Verify event listeners work correctly:

```typescript
test('should receive badge-minted event', async () => {
  const eventPromise = waitForEvent('badge-minted')
  await mintBadge(recipient, templateId)
  const event = await eventPromise
  expect(event.badge_id).toBeDefined()
  expect(event.recipient).toBe(recipient)
})
```

## See Also

- [Error Codes Reference](./ERROR_CODES.md)
- [Error Handling Best Practices](../.github/ERROR_HANDLING.md)
- [Contracts README](../contracts/README.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
