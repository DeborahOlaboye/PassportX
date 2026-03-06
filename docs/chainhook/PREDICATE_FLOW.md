# Predicate Flow — End-to-End

This document traces the complete lifecycle of a Chainhook predicate: from
definition in code, through registration with the Chainhook node, to a matched
event arriving at the backend and being persisted.

---

## What is a Predicate?

A predicate is a **filter rule** you register with the Chainhook node. It says:

> "Watch the blockchain for transactions that match these criteria, and POST the
> raw event data to this URL when you find one."

PassportX predicates are defined in `backend/src/config/predicates.ts` and
have the following structure:

```typescript
{
  uuid: 'pred_badge_mint_call',           // Unique identifier
  name: 'Badge Mint - Contract Call',     // Human-readable label
  type: 'stacks-contract-call',           // Trigger type
  network: 'mainnet',                     // Target network
  if_this: {
    scope: 'contract',
    contract_identifier: 'SP101...nft',   // Which contract to watch
    method: 'mint'                        // Which method to match
  },
  then_that: {
    http_post: {
      url: 'https://api.passportx.io/api/badges/webhook/mint',  // Delivery URL
      authorization_header: '<CHAINHOOK_AUTH_TOKEN>'             // HMAC secret
    }
  },
  active: true
}
```

---

## Predicate Lifecycle

```
1. BUILD
   ─────
   backend/src/config/predicates.ts
   getPredicateConfigs() reads environment variables and contract addresses,
   then constructs Predicate objects for every enabled event type.

          │
          ▼

2. VALIDATE
   ────────
   validatePredicateConfig() checks:
   - uuid and name are present
   - type is a supported value
   - then_that.http_post.url is set
   - network is valid
   - stacks-contract-call predicates have contract_identifier and method

          │
          ▼

3. REGISTER
   ────────
   ChainhookPredicateManager (backend/src/services/chainhookPredicateManager.ts)
   POSTs each predicate to the Chainhook node REST API:
     POST http://<CHAINHOOK_NODE_URL>/v1/chainhooks

          │
          ▼

4. WATCH
   ─────
   The Chainhook node scans every new Stacks block.
   For each transaction it checks all registered predicates.

          │  predicate matches
          ▼

5. DELIVER
   ───────
   Chainhook node POSTs the raw event JSON to then_that.http_post.url.
   It includes:
     - x-chainhook-signature: HMAC-SHA256 signature of (timestamp.body)
     - x-chainhook-timestamp: Unix millisecond timestamp

          │
          ▼

6. VALIDATE SIGNATURE
   ──────────────────
   webhookValidation.ts middleware verifies:
   - x-chainhook-signature header is present
   - x-chainhook-timestamp header is present
   - HMAC-SHA256(timestamp.body, WEBHOOK_SECRET_KEY) matches signature
   - Timestamp is within 5 minutes of now (replay protection)

          │ valid
          ▼

7. ROUTE
   ─────
   Express routes the validated POST to the appropriate handler:
   - /api/badges/webhook/mint        → badge mint handler
   - /api/badges/webhook/metadata    → badge metadata update handler
   - /api/badges/webhook/revocation  → badge revocation handler
   - /api/community-creation/...     → community creation handler

          │
          ▼

8. PROCESS
   ───────
   The handler:
   a. Parses the ChainhookEventPayload
   b. Extracts the relevant fields
   c. Updates MongoDB (Badge, Community, User collections)
   d. Triggers cache invalidation
   e. Queues notifications for affected users
   f. Emits WebSocket events to connected clients

          │
          ▼

9. REORG HANDLING
   ──────────────
   If the block is later orphaned (chain reorganisation):
   - ReorgHandlerService reverses the database changes
   - Affected caches are invalidated again
   - Clients are notified via WebSocket
```

---

## Predicate Registration Flow (Detailed)

```
ChainhookEventObserver.start()
        │
        ├─▶ ChainhookPredicateManager.registerAllPredicates()
        │         │
        │         ├─▶ getPredicateConfigs()   ←── reads ENV vars
        │         │         │
        │         │         └─▶ Returns enabled Predicate[]
        │         │
        │         └─▶ for each predicate:
        │               POST /v1/chainhooks → Chainhook Node
        │               Store predicate UUID in memory
        │
        └─▶ Start health-check loop (ping Chainhook node every 30s)
                  │  node unreachable
                  └─▶ ChainhookConnectionRecovery.reconnect()
                           │
                           └─▶ Re-register all predicates after reconnect
```

---

## Feature-Flag Control

Individual predicates are enabled or disabled via environment variables.
This allows you to enable only the events you need:

| Env Var | Default | Predicate enabled |
|---|---|---|
| `CHAINHOOK_ENABLE_BADGE_MINT` | `false` | `pred_badge_mint_call` |
| `CHAINHOOK_ENABLE_BADGE_MINT_EVENT` | `false` | `pred_badge_mint_event` |
| `CHAINHOOK_ENABLE_BADGE_METADATA_UPDATE` | `false` | `pred_badge_metadata_update_call` |
| `CHAINHOOK_ENABLE_BADGE_METADATA_UPDATE_EVENT` | `false` | `pred_badge_metadata_update_event` |
| `CHAINHOOK_ENABLE_BADGE_REVOCATION` | `false` | `pred_badge_revocation_call` |
| `CHAINHOOK_ENABLE_BADGE_REVOCATION_EVENT` | `false` | `pred_badge_revocation_event` |
| `CHAINHOOK_ENABLE_EVENT_PREDICATE` | `false` | All `*_event` print predicates |

The `communityCreation` predicate is **always enabled** (no flag required).

> **Tip:** In development, set `CHAINHOOK_ENABLE_EVENT_PREDICATE=true` to
> activate all print-event predicates at once for easier testing.

---

## Webhook Signature Verification

Every inbound POST from the Chainhook node is authenticated with HMAC-SHA256:

```
Signing algorithm:
  message  = "<unix_ms_timestamp>.<raw_JSON_body>"
  expected = HMAC-SHA256(message, WEBHOOK_SECRET_KEY)

Verification (webhookValidation.ts):
  1. Read x-chainhook-signature and x-chainhook-timestamp headers
  2. Compute HMAC-SHA256 using the same formula
  3. Use crypto.timingSafeEqual() to compare (prevents timing attacks)
  4. Reject if timestamp is older than 5 minutes
```

Required environment variables:

```bash
WEBHOOK_SIGNATURE_VALIDATION=true
WEBHOOK_SECRET_KEY=<strong-random-secret>
WEBHOOK_SIGNATURE_ALGORITHM=sha256      # default
```

---

## Event Payload Structure

When a predicate matches, Chainhook delivers a payload shaped like:

```typescript
interface ChainhookEventPayload {
  block_identifier: { index: number; hash: string };
  parent_block_identifier: { index: number; hash: string };
  type: string;
  timestamp: number;
  transactions: Array<{
    transaction_index: number;
    transaction_hash: string;
    operations: Array<{
      type: string;
      contract_call?: { contract: string; method: string; args?: any[] };
      events?: Array<{
        type: string;
        contract_address: string;
        topic: string;
        value?: any;
      }>;
    }>;
  }>;
}
```

`EventMapper` (`src/chainhook/utils/eventMapper.ts`) converts this raw structure
into typed domain events (`BadgeMintEvent`, `CommunityCreationEvent`, etc.).

---

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Sequence Diagrams](./SEQUENCE_DIAGRAMS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Configuration Reference](./CONFIGURATION.md)
