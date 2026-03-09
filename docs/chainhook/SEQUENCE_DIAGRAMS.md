# Chainhook Sequence Diagrams

Mermaid sequence diagrams for each PassportX on-chain event. These diagrams
render natively on GitHub. Use them to understand exactly what happens at each
step of event processing and where to look when something breaks.

---

## 1. Badge Mint

A community admin calls `mint` on the `passport-nft` contract.

```mermaid
sequenceDiagram
    participant Admin as Community Admin (Wallet)
    participant Chain as Stacks Blockchain
    participant CH as Chainhook Node
    participant WH as Backend Webhook<br/>/api/badges/webhook/mint
    participant SVC as BadgeMintService
    participant DB as MongoDB
    participant NS as NotificationService
    participant WS as WebSocket Clients

    Admin->>Chain: call passport-nft.mint(recipient, tokenURI)
    Chain-->>Chain: Transaction confirmed in block N

    Chain->>CH: Block N indexed
    CH->>CH: Evaluate predicates
    CH->>CH: pred_badge_mint_call MATCHES

    CH->>WH: POST /api/badges/webhook/mint<br/>Headers: x-chainhook-signature, x-chainhook-timestamp

    WH->>WH: webhookValidation.ts<br/>Verify HMAC-SHA256 signature
    WH->>WH: Check timestamp ≤ 5 min old

    WH->>SVC: Dispatch to BadgeMintHandler

    SVC->>SVC: EventMapper.mapBadgeMintEvent(payload)
    SVC->>DB: Badge.create({ owner, templateId, tokenId, ... })
    SVC->>DB: updateMemberCount(communityId)
    SVC->>NS: createNotification(recipient, 'badge_received', ...)

    NS->>DB: Notification.create(...)
    NS->>WS: emit('notification', payload)

    WH-->>CH: 200 OK

    Note over Chain,WH: If block is reorg'd later:
    Chain->>CH: Reorg detected at block N
    CH->>WH: POST reorg event
    WH->>SVC: ReorgHandlerService.rollback(blockN)
    SVC->>DB: Badge.deleteOne({ transactionId })
```

---

## 2. Badge Metadata Update

A contract admin calls `update-metadata` on the `badge-metadata` contract.

```mermaid
sequenceDiagram
    participant Admin as Contract Admin
    participant Chain as Stacks Blockchain
    participant CH as Chainhook Node
    participant WH as Backend Webhook<br/>/api/badges/webhook/metadata
    participant Mid as badgeMetadataUpdateWebhook<br/>middleware
    participant SVC as BadgeMetadataUpdateService
    participant Cache as BadgeMetadataCacheInvalidator
    participant UI as BadgeUIRefreshService
    participant DB as MongoDB
    participant WS as WebSocket Clients

    Admin->>Chain: call badge-metadata.update-metadata(badgeId, newLevel, newCategory)
    Chain-->>Chain: Confirmed in block N

    CH->>CH: pred_badge_metadata_update_call MATCHES
    CH->>WH: POST /api/badges/webhook/metadata

    WH->>Mid: validateWebhookSignature()
    Mid-->>WH: Signature valid

    WH->>SVC: Process BadgeMetadataUpdateEvent
    SVC->>SVC: Detect changed fields<br/>(badgeMetadataChangeDetector.ts)

    SVC->>DB: Badge.updateOne({ _id: badgeId }, { level, category })
    SVC->>Cache: invalidateBadgeCache({ badgeId, changedFields })
    Cache->>Cache: Purge Redis/in-memory cache entries
    SVC->>UI: notifyBadgeMetadataUpdate(badgeId, changedFields)
    UI->>WS: emit('badge:metadata-updated', { badgeId, changes })

    WH-->>CH: 200 OK
```

---

## 3. Badge Revocation

A community admin calls `revoke-badge` on the `badge-issuer` contract.

```mermaid
sequenceDiagram
    participant Admin as Community Admin
    participant Chain as Stacks Blockchain
    participant CH as Chainhook Node
    participant WH as Backend Webhook<br/>/api/badges/webhook/revocation
    participant Mid as badgeRevocationWebhook<br/>middleware
    participant Coord as BadgeRevocationCoordinator
    participant Audit as BadgeRevocationAuditLog
    participant Cache as BadgeRevocationCacheInvalidator
    participant NS as NotificationService
    participant DB as MongoDB
    participant WS as WebSocket Clients

    Admin->>Chain: call badge-issuer.revoke-badge(badgeId, reason)
    Chain-->>Chain: Confirmed in block N

    CH->>CH: pred_badge_revocation_call MATCHES
    CH->>WH: POST /api/badges/webhook/revocation

    WH->>Mid: validateWebhookSignature()
    Mid-->>WH: Signature valid

    WH->>Coord: coordinate(BadgeRevocationEvent)
    Coord->>DB: Badge.updateOne({ isRevoked: true, revokedAt, revokedBy })
    Coord->>Audit: logRevocation(badgeId, reason, issuerId)
    Audit->>DB: RevocationLog.create(...)
    Coord->>Cache: invalidateRevocationCache(badgeId)
    Coord->>NS: createNotification(badgeOwner, 'badge_revoked', ...)
    NS->>DB: Notification.create(...)
    NS->>WS: emit('badge:revoked', { badgeId, reason })

    WH-->>CH: 200 OK
```

---

## 4. Community Creation

Anyone calls `create-community` on the `community-manager` contract.

```mermaid
sequenceDiagram
    participant User as User (Wallet)
    participant Chain as Stacks Blockchain
    participant CH as Chainhook Node
    participant WH as Backend Webhook<br/>/api/community-creation/webhook/events
    participant SVC as CommunityCreationService
    participant Int as CommunityCreationIntegration
    participant NS as CommunityCreationNotificationService
    participant DB as MongoDB
    participant WS as WebSocket Clients

    User->>Chain: call community-manager.create-community(name, description)
    Chain-->>Chain: Confirmed in block N

    CH->>CH: pred_community_creation_call MATCHES
    CH->>WH: POST /api/community-creation/webhook/events

    WH->>WH: validateWebhookSignature()

    WH->>SVC: handleCommunityCreation(CommunityCreationEvent)
    SVC->>SVC: Validate event fields
    SVC->>DB: Community.create({ name, description, creator, blockHeight })
    SVC->>Int: syncCommunityCreation(community)
    Int->>DB: Update community analytics snapshot
    Int->>NS: notifyCommunityCreated(ownerAddress, community)
    NS->>DB: Notification.create({ type: 'community_created', ... })
    NS->>WS: emit('community:created', { communityId, name })

    WH-->>CH: 200 OK
```

---

## 5. Chainhook Node Connection Recovery

What happens when the Chainhook node becomes unavailable.

```mermaid
sequenceDiagram
    participant Obs as ChainhookEventObserver
    participant Rec as ChainhookConnectionRecovery
    participant Node as Chainhook Node
    participant PM as ChainhookPredicateManager
    participant Log as Logger

    Obs->>Node: Health check ping (every 30s)
    Node--xObs: Connection refused / timeout

    Obs->>Rec: onConnectionLost()
    Rec->>Log: Log connection failure
    Rec->>Rec: Start exponential backoff (1s, 2s, 4s, ... max 60s)

    loop Until reconnected
        Rec->>Node: Retry connection
        Node--xRec: Still unavailable
        Rec->>Rec: Wait (backoff interval)
    end

    Node-->>Rec: Connection restored
    Rec->>PM: re-registerAllPredicates()
    PM->>Node: POST /v1/chainhooks (for each predicate)
    Node-->>PM: 200 OK — predicates active
    Rec->>Obs: Resume normal health checks
    Rec->>Log: Log successful reconnection
```

---

## 6. Reorg Handling

When a chain reorganisation orphans a previously confirmed block.

```mermaid
sequenceDiagram
    participant Chain as Stacks Blockchain
    participant CH as Chainhook Node
    participant WH as Backend (reorg endpoint)
    participant RH as ReorgHandlerService
    participant DB as MongoDB
    participant Cache as ReorgAwareCache
    participant WS as WebSocket Clients

    Chain->>Chain: Fork detected — block N orphaned
    CH->>WH: POST reorg event<br/>{ orphanedBlock: N, canonicalBlock: N' }

    WH->>RH: handleReorg(orphanedBlockHeight)
    RH->>DB: Find all events at blockHeight = N
    RH->>DB: Reverse badge mints (delete Badge docs)
    RH->>DB: Reverse community creations
    RH->>DB: Reverse metadata updates (restore previous values)
    RH->>Cache: invalidateForBlock(N)
    RH->>WS: emit('reorg', { orphanedBlock: N, affectedItems })
    WS-->>WS: UI shows reorg notification to users

    Note over Chain,WH: Chainhook automatically re-delivers<br/>events for canonical block N'
    CH->>WH: Re-deliver events for block N'
    WH->>RH: Process events as normal
```

---

## Summary Table

| Event | Predicate | Webhook Route | Key Service |
|---|---|---|---|
| Badge mint | `pred_badge_mint_call` | `/api/badges/webhook/mint` | `BadgeMintService` |
| Badge metadata update | `pred_badge_metadata_update_call` | `/api/badges/webhook/metadata` | `BadgeMetadataUpdateService` |
| Badge revocation | `pred_badge_revocation_call` | `/api/badges/webhook/revocation` | `BadgeRevocationCoordinator` |
| Community creation | `pred_community_creation_call` | `/api/community-creation/webhook/events` | `CommunityCreationService` |

---

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Predicate Flow](./PREDICATE_FLOW.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Configuration Reference](./CONFIGURATION.md)
