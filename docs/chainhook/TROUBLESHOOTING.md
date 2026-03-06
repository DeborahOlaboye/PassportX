# Chainhook Troubleshooting Guide

Practical guidance for diagnosing and fixing the most common Chainhook
integration problems in PassportX.

---

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

```bash
# 1. Is the Chainhook node reachable?
curl http://localhost:20456/ping

# 2. Are predicates registered?
curl http://localhost:20456/v1/chainhooks

# 3. Is the webhook server accepting requests?
curl -X POST http://localhost:3001/api/badges/webhook/mint \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 4. Check backend logs for chainhook errors
grep -i chainhook backend/logs/app.log | tail -50

# 5. Validate predicate configuration
node -e "const p = require('./backend/src/config/predicates'); p.validatePredicateConfig();"

# 6. Validate environment variables
node -e "const u = require('./src/config/chainhook/utils'); console.log(u.validateChainhookEnvironment());"
```

---

## Problem: Events Not Being Received

### Symptom
Badge mints happen on-chain, but the backend never receives a webhook POST.

### Causes and Fixes

**1. Predicates not registered**

```bash
# Check if any predicates are registered
curl http://localhost:20456/v1/chainhooks
# Expected: non-empty array

# If empty, trigger re-registration
curl -X POST http://localhost:3001/api/chainhook/register
```

**2. Feature flags not set**

Badge mint and metadata predicates are off by default. Check `.env`:

```bash
# Required for badge mint events
CHAINHOOK_ENABLE_BADGE_MINT=true
CHAINHOOK_ENABLE_BADGE_MINT_EVENT=true   # optional print predicate
```

**3. Wrong webhook URL in predicate**

The predicate `then_that.http_post.url` must be reachable FROM the Chainhook
node's network perspective. In development, the Chainhook node runs in Docker
and cannot reach `localhost:3001` on the host.

```bash
# Wrong (Chainhook node can't reach this from Docker)
CHAINHOOK_WEBHOOK_URL=http://localhost:3001/api/community-creation/webhook/events

# Correct (use host.docker.internal on Mac/Windows)
CHAINHOOK_WEBHOOK_URL=http://host.docker.internal:3001/api/community-creation/webhook/events

# Or use ngrok for external testing
ngrok http 3001
CHAINHOOK_WEBHOOK_URL=https://<ngrok-subdomain>.ngrok.io/api/community-creation/webhook/events
```

**4. Wrong network**

Ensure `STACKS_NETWORK` matches the network you're watching:

```bash
STACKS_NETWORK=devnet      # local Clarinet/Devnet
STACKS_NETWORK=testnet     # Stacks testnet
STACKS_NETWORK=mainnet     # Stacks mainnet
```

---

## Problem: 401 Unauthorized on Webhook POST

### Symptom
Backend returns `401 MISSING_SIGNATURE` or `401 INVALID_SIGNATURE`.

### Causes and Fixes

**1. Signature validation enabled but no secret set**

```bash
# In .env:
WEBHOOK_SIGNATURE_VALIDATION=true
WEBHOOK_SECRET_KEY=           # ← empty! Must be set
```

Fix: either set a strong secret or disable validation in development:

```bash
WEBHOOK_SIGNATURE_VALIDATION=false   # development only
# or
WEBHOOK_SECRET_KEY=change-me-to-something-strong-in-production
```

**2. Secret mismatch**

The `WEBHOOK_SECRET_KEY` in the backend must match the `authorization_header`
value used when registering predicates (`CHAINHOOK_AUTH_TOKEN`).

```bash
# These two values must match:
CHAINHOOK_AUTH_TOKEN=my-secret-token      # used to sign the Chainhook delivery
WEBHOOK_SECRET_KEY=my-secret-token        # used to verify the delivery
```

**3. Timestamp too old (replay protection)**

Webhook requests older than 5 minutes are rejected. This usually happens when:
- Replaying test events from a saved file (timestamps are stale)
- The server clock is out of sync

Fix for testing: temporarily disable signature validation, or use a live test.

**4. Signature algorithm mismatch**

```bash
WEBHOOK_SIGNATURE_ALGORITHM=sha256   # must match what Chainhook uses
```

---

## Problem: Events Arrive But Duplicated

### Symptom
The same badge is created twice or community creation runs twice.

### Cause
Chainhook may deliver the same event multiple times (at-least-once delivery).
Both a `stacks-contract-call` and `stacks-print` predicate may fire for the
same on-chain action.

### Fix
Check that the backend handler uses idempotency guards:

```typescript
// Good — won't create duplicate badge
const existing = await Badge.findOne({ transactionId });
if (existing) return; // already processed

// Then create
await Badge.create({ transactionId, ... });
```

Also ensure you haven't registered the same predicate twice. Check:

```bash
curl http://localhost:20456/v1/chainhooks | jq '.[].uuid'
```

Duplicate UUIDs indicate a registration bug. Delete extras:

```bash
curl -X DELETE http://localhost:20456/v1/chainhooks/pred_badge_mint_call
```

---

## Problem: Chainhook Node Connection Lost

### Symptom
Logs show `CHAINHOOK_CONNECTION_FAILED`. Events stop arriving after some time.

### Cause
The Chainhook node restarted or became unreachable. Predicates are lost when
the node restarts (they are not persisted by default).

### Fix
`ChainhookConnectionRecovery` handles automatic reconnection with exponential
backoff. If it isn't working:

1. Check that `ChainhookEventObserver.start()` was called at server startup.
2. Check that `CHAINHOOK_NODE_RETRY_ENABLED=true` is set.
3. Increase retry limits if needed:

```bash
CHAINHOOK_NODE_MAX_RETRIES=5
CHAINHOOK_NODE_RETRY_DELAY=2000   # milliseconds, doubles on each retry
```

4. If recovery does not auto-trigger, manually re-register via the API:

```bash
curl -X POST http://localhost:3001/api/chainhook/register \
  -H "Authorization: Bearer <admin-token>"
```

---

## Problem: Reorg Not Handled Correctly

### Symptom
After a chain reorganisation, stale badge records persist or users see
incorrect data.

### Causes and Fixes

**1. ReorgHandlerService not running**

Ensure the reorg route is mounted in `backend/src/server.ts`:

```typescript
app.use('/api/reorg', reorgRoutes);
```

**2. Events not tagged with block height**

Every document written from a Chainhook event must store `blockHeight` so the
reorg handler can find and reverse them:

```typescript
await Badge.create({
  ...badgeData,
  blockHeight: event.blockHeight,   // ← required for reorg rollback
  transactionId: event.transactionHash,
});
```

**3. Cache not invalidated after reorg**

`ReorgAwareCache` should automatically invalidate on reorg events.
Check that `ReorgAwareCache.onReorg()` is wired to the reorg WebSocket event.

---

## Problem: Wrong Contract Address

### Symptom
Predicates register successfully but no events arrive, even though on-chain
transactions are happening.

### Cause
The contract identifier in the predicate does not match the deployed contract.

### Fix

1. Check deployed addresses in `backend/src/config/contracts.ts`:

```typescript
export function getContracts() {
  const network = process.env.STACKS_NETWORK || 'devnet';
  // Returns addresses for the active network
}
```

2. Verify the predicate's `contract_identifier` matches what is on-chain:

```bash
curl http://localhost:20456/v1/chainhooks | jq '.[] | {name, contract: .if_this.contract_identifier}'
```

3. For devnet/Clarinet, check `.clarinet/requirements/` for the correct address.

---

## Problem: Large Event Batches Timing Out

### Symptom
Webhook handler returns 504 or the Chainhook node marks the predicate as
failing because the POST takes too long.

### Cause
Processing many events synchronously in a single request takes too long.

### Fix

Use the `RetryQueueService` and `ChainhookEventBatcher` to process events
asynchronously:

```typescript
// Instead of processing inline:
await heavyProcessing(event);

// Queue for background processing:
await retryQueueService.enqueue({ event, handler: 'badge-mint' });
res.json({ success: true, queued: true });
```

Also tune the batch size:

```bash
CHAINHOOK_MAX_BATCH_SIZE=50   # default 100 — reduce if timeouts persist
```

---

## Problem: Missing Environment Variables

### Symptom
Server crashes on startup with `EnvValidator` errors.

### Fix

Run the environment validator manually to see what's missing:

```typescript
import { validateChainhookEnvironment } from '@/config/chainhook/utils';

const { valid, errors } = validateChainhookEnvironment();
if (!valid) {
  console.error('Missing env vars:', errors);
}
```

Minimum required variables:

```bash
# Network
STACKS_NETWORK=devnet

# Chainhook node
CHAINHOOK_NODE_URL=http://localhost:20456

# Webhook delivery
CHAINHOOK_WEBHOOK_URL=http://host.docker.internal:3001/api/community-creation/webhook/events
CHAINHOOK_AUTH_TOKEN=<any-string-in-dev>

# Signature validation (set to false in dev to skip)
WEBHOOK_SIGNATURE_VALIDATION=false
WEBHOOK_SECRET_KEY=<set-if-validation-true>
```

---

## Useful Debug Commands

```bash
# List all registered predicates
curl http://localhost:20456/v1/chainhooks | jq .

# Delete a specific predicate (use UUID from ARCHITECTURE.md)
curl -X DELETE http://localhost:20456/v1/chainhooks/pred_badge_mint_call

# Manually trigger test webhook (dev only)
curl -X POST http://localhost:3001/api/badges/webhook/mint \
  -H "Content-Type: application/json" \
  -H "x-chainhook-signature: test" \
  -H "x-chainhook-timestamp: $(date +%s000)" \
  -d @tests/fixtures/badge-mint-event.json

# Check backend health
curl http://localhost:3001/health/status | jq .

# View retry queue
curl http://localhost:3001/api/retry/queue | jq .

# View dead letter queue (failed events)
curl http://localhost:3001/api/retry/dead-letter | jq .
```

---

## Error Code Reference

| Code | Meaning | Where thrown |
|---|---|---|
| `CHAINHOOK_CONNECTION_FAILED` | Cannot reach Chainhook node | `ChainhookConnectionRecovery` |
| `CHAINHOOK_INVALID_CONFIG` | Missing required config value | `validateChainhookConfig()` |
| `CHAINHOOK_PREDICATE_ERROR` | Predicate registration failed | `ChainhookPredicateManager` |
| `CHAINHOOK_EVENT_PROCESSING_ERROR` | Handler threw during event processing | `chainhookEventProcessor` |
| `CHAINHOOK_TIMEOUT` | Node request timed out | `ChainhookPredicateManager` |
| `CHAINHOOK_UNAUTHORIZED` | Node rejected request (bad API key) | `ChainhookPredicateManager` |
| `MISSING_SIGNATURE` | Webhook POST has no signature header | `webhookValidation.ts` |
| `INVALID_SIGNATURE` | Signature does not match computed HMAC | `webhookValidation.ts` |
| `EXPIRED_TIMESTAMP` | Webhook timestamp older than 5 min | `webhookValidation.ts` |

---

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Predicate Flow](./PREDICATE_FLOW.md)
- [Sequence Diagrams](./SEQUENCE_DIAGRAMS.md)
- [Configuration Reference](./CONFIGURATION.md)
