# Chainhook Configuration Reference

Complete reference for every environment variable, configuration file, and
setting involved in the PassportX Chainhook integration.

---

## Environment Variables

### Stacks Network

| Variable         | Required | Default  | Description                                       |
| ---------------- | -------- | -------- | ------------------------------------------------- |
| `STACKS_NETWORK` | Yes      | `devnet` | Target network: `devnet`, `testnet`, or `mainnet` |

---

### Chainhook Node Connection (Backend)

Defined in `backend/src/chainhook/config/chainhook.config.ts`.

| Variable                       | Required | Default                  | Description                                      |
| ------------------------------ | -------- | ------------------------ | ------------------------------------------------ |
| `CHAINHOOK_NODE_URL`           | Yes      | `http://localhost:20456` | URL of the Chainhook node REST API               |
| `CHAINHOOK_API_KEY`            | No       | —                        | API key for Hiro-hosted nodes (testnet/mainnet)  |
| `CHAINHOOK_START_BLOCK`        | No       | `0`                      | First block height to index from                 |
| `CHAINHOOK_EVENT_QUEUE`        | No       | `chainhook-events`       | Internal event queue name                        |
| `CHAINHOOK_MAX_BATCH_SIZE`     | No       | `100`                    | Maximum events per batch                         |
| `CHAINHOOK_NODE_TIMEOUT`       | No       | `30000`                  | Request timeout in ms                            |
| `CHAINHOOK_NODE_RETRY_ENABLED` | No       | `true`                   | Enable automatic retry on connection failure     |
| `CHAINHOOK_NODE_MAX_RETRIES`   | No       | `3`                      | Maximum reconnection attempts                    |
| `CHAINHOOK_NODE_RETRY_DELAY`   | No       | `1000`                   | Initial retry delay in ms (doubles each attempt) |

---

### Local Event Server (Frontend / Next.js layer)

Defined in `src/config/chainhook/server.config.ts`.

| Variable                         | Required | Default     | Description                                                     |
| -------------------------------- | -------- | ----------- | --------------------------------------------------------------- |
| `CHAINHOOK_SERVER_HOST`          | No       | `localhost` | Hostname the local event server binds to                        |
| `CHAINHOOK_SERVER_PORT`          | No       | `3010`      | Port the local event server listens on                          |
| `CHAINHOOK_SERVER_EXTERNAL_URL`  | No       | —           | Public URL the Chainhook node posts to (required in production) |
| `CHAINHOOK_SERVER_HTTPS`         | No       | `false`     | Enable HTTPS for the local event server                         |
| `CHAINHOOK_SERVER_SSL_CERT_PATH` | No       | —           | Path to SSL certificate (required when HTTPS=true)              |
| `CHAINHOOK_SERVER_SSL_KEY_PATH`  | No       | —           | Path to SSL private key (required when HTTPS=true)              |

---

### Webhook Delivery URLs

These URLs are embedded into predicates and tell the Chainhook node where to
POST matching events.

| Variable                       | Default                                                       | Used by predicate                     |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------- |
| `CHAINHOOK_WEBHOOK_URL`        | `http://localhost:3010/api/community-creation/webhook/events` | Community creation                    |
| `BADGE_MINT_WEBHOOK_URL`       | `http://localhost:3010/api/badges/webhook/mint`               | Badge mint                            |
| `BADGE_METADATA_WEBHOOK_URL`   | `http://localhost:3010/api/badges/webhook/metadata`           | Badge metadata update                 |
| `BADGE_REVOCATION_WEBHOOK_URL` | `http://localhost:3010/api/badges/webhook/revocation`         | Badge revocation                      |
| `CHAINHOOK_AUTH_TOKEN`         | `` (empty)                                                    | All predicates (authorization_header) |

> **Docker users:** Replace `localhost` with `host.docker.internal` so the
> Chainhook node container can reach the backend on the host machine.

---

### Webhook Signature Verification (Backend)

| Variable                       | Required           | Default  | Description                                |
| ------------------------------ | ------------------ | -------- | ------------------------------------------ |
| `WEBHOOK_SIGNATURE_VALIDATION` | No                 | `false`  | Enable HMAC-SHA256 signature verification  |
| `WEBHOOK_SECRET_KEY`           | If validation=true | —        | Secret key for HMAC computation            |
| `WEBHOOK_SIGNATURE_ALGORITHM`  | No                 | `sha256` | Hash algorithm (must match Chainhook node) |

> **Production:** Always set `WEBHOOK_SIGNATURE_VALIDATION=true` and a strong
> `WEBHOOK_SECRET_KEY`. The value must match `CHAINHOOK_AUTH_TOKEN`.

---

### Predicate Feature Flags

Individual predicates are disabled by default. Enable them per environment.

| Variable                                       | Default | Activates                                        |
| ---------------------------------------------- | ------- | ------------------------------------------------ |
| `CHAINHOOK_ENABLE_BADGE_MINT`                  | `false` | `pred_badge_mint_call` (contract-call predicate) |
| `CHAINHOOK_ENABLE_BADGE_MINT_EVENT`            | `false` | `pred_badge_mint_event` (print predicate)        |
| `CHAINHOOK_ENABLE_BADGE_METADATA_UPDATE`       | `false` | `pred_badge_metadata_update_call`                |
| `CHAINHOOK_ENABLE_BADGE_METADATA_UPDATE_EVENT` | `false` | `pred_badge_metadata_update_event`               |
| `CHAINHOOK_ENABLE_BADGE_REVOCATION`            | `false` | `pred_badge_revocation_call`                     |
| `CHAINHOOK_ENABLE_BADGE_REVOCATION_EVENT`      | `false` | `pred_badge_revocation_event`                    |
| `CHAINHOOK_ENABLE_EVENT_PREDICATE`             | `false` | All `*_event` print predicates at once           |

---

### Frontend Feature Flags

| Variable                        | Default | Description                                  |
| ------------------------------- | ------- | -------------------------------------------- |
| `NEXT_PUBLIC_CHAINHOOK_ENABLED` | `true`  | Show chainhook-powered real-time UI features |
| `NEXT_PUBLIC_CHAINHOOK_DEBUG`   | `false` | Log raw Chainhook events to browser console  |

---

## Configuration Files

### `src/config/chainhook/constants.ts`

Defines compile-time constants:

```typescript
CHAINHOOK_DEFAULTS; // Default port, timeout, retry values
CHAINHOOK_NETWORKS; // 'development' | 'testnet' | 'mainnet'
CHAINHOOK_EVENT_TYPES; // Supported event type strings
PASSPORTX_CONTRACTS; // Mainnet contract addresses (deployer + all contracts)
PASSPORTX_PREDICATES; // Predicate name strings
CHAINHOOK_ENDPOINTS; // /health, /predicates, /events
CHAINHOOK_ERROR_CODES; // Error code strings
```

### `src/config/chainhook/server.config.ts`

Exports three server configurations:

| Export                         | Environment | Purpose                                |
| ------------------------------ | ----------- | -------------------------------------- |
| `defaultServerConfig`          | Any         | Reads from env vars                    |
| `developmentServerConfig`      | Development | `localhost:3010`, no HTTPS             |
| `productionServerConfig`       | Production  | `0.0.0.0`, HTTPS required              |
| `getServerConfig(env)`         | —           | Returns the right config for the env   |
| `validateServerConfig(config)` | —           | Throws if hostname/port/SSL is invalid |

### `src/config/chainhook/node.config.ts`

Exports three node configurations:

| Export                       | Network                | Chainhook node URL            |
| ---------------------------- | ---------------------- | ----------------------------- |
| `defaultNodeConfig`          | Reads `STACKS_NETWORK` | Uses matching URL             |
| `developmentNodeConfig`      | `development`          | `http://localhost:20456`      |
| `testnetNodeConfig`          | `testnet`              | `https://api.testnet.hiro.so` |
| `mainnetNodeConfig`          | `mainnet`              | `https://api.hiro.so`         |
| `getNodeConfig(network)`     | —                      | Returns the right config      |
| `validateNodeConfig(config)` | —                      | Throws if URL is invalid      |

### `src/config/chainhook/index.ts`

Main entry point:

```typescript
getChainhookConfig(environment, network); // Returns combined ChainhookConfig
validateChainhookConfig(config); // Validates both server + node config
chainhookConfig; // Default export (reads env vars)
```

### `src/config/chainhook/utils.ts`

Helper functions:

```typescript
getCurrentNetwork(); // Reads STACKS_NETWORK → 'development' | 'testnet' | 'mainnet'
validateChainhookEnvironment(); // Returns { valid: boolean, errors: string[] }
createChainhookError(code, msg); // Creates typed ChainhookError
logChainhookError(label, error); // Structured error logging
formatContractAddress(addr); // Normalises Stacks contract address format
```

### `src/chainhook/config/chainhook.config.ts`

Backend runtime config consumed by handlers:

```typescript
chainhookConfig = {
  nodeUrl, // CHAINHOOK_NODE_URL
  apiKey, // CHAINHOOK_API_KEY
  startBlock, // CHAINHOOK_START_BLOCK
  eventQueue, // CHAINHOOK_EVENT_QUEUE
  maxBatchSize, // CHAINHOOK_MAX_BATCH_SIZE
  network, // STACKS_NETWORK
};

getServerOptions(); // Returns { port, host, logLevel }
getNodeOptions(); // Returns { network, startBlock, maxBatchSize, rpcUrl, apiKey }
```

### `backend/src/config/predicates.ts`

Builds all predicate objects:

```typescript
getPredicateConfigs(enableEventPredicate?)  // Returns PredicateConfig object
getAllPredicates(includeInactive?)           // Returns Predicate[]
getPredicateByName(name)                    // Finds predicate by name
getPredicateByUuid(uuid)                    // Finds predicate by UUID
validatePredicateConfig()                   // Returns { valid, errors }
```

---

## Minimum `.env` for Development

```bash
# Network
STACKS_NETWORK=devnet

# Chainhook node (run with: docker-compose up chainhook)
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_AUTH_TOKEN=dev-secret

# Webhook URLs (host.docker.internal needed if Chainhook runs in Docker)
CHAINHOOK_WEBHOOK_URL=http://host.docker.internal:3001/api/community-creation/webhook/events
BADGE_MINT_WEBHOOK_URL=http://host.docker.internal:3001/api/badges/webhook/mint
BADGE_METADATA_WEBHOOK_URL=http://host.docker.internal:3001/api/badges/webhook/metadata
BADGE_REVOCATION_WEBHOOK_URL=http://host.docker.internal:3001/api/badges/webhook/revocation

# Skip signature verification in development
WEBHOOK_SIGNATURE_VALIDATION=false

# Enable all predicates in development
CHAINHOOK_ENABLE_BADGE_MINT=true
CHAINHOOK_ENABLE_EVENT_PREDICATE=true
```

## Minimum `.env` for Production

```bash
STACKS_NETWORK=mainnet

CHAINHOOK_NODE_URL=https://api.hiro.so
CHAINHOOK_API_KEY=<hiro-api-key>
CHAINHOOK_AUTH_TOKEN=<strong-random-secret>

CHAINHOOK_WEBHOOK_URL=https://api.passportx.io/api/community-creation/webhook/events
BADGE_MINT_WEBHOOK_URL=https://api.passportx.io/api/badges/webhook/mint
BADGE_METADATA_WEBHOOK_URL=https://api.passportx.io/api/badges/webhook/metadata
BADGE_REVOCATION_WEBHOOK_URL=https://api.passportx.io/api/badges/webhook/revocation

WEBHOOK_SIGNATURE_VALIDATION=true
WEBHOOK_SECRET_KEY=<same-as-CHAINHOOK_AUTH_TOKEN>

CHAINHOOK_ENABLE_BADGE_MINT=true
CHAINHOOK_ENABLE_BADGE_REVOCATION=true
CHAINHOOK_ENABLE_BADGE_METADATA_UPDATE=true
```

---

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Predicate Flow](./PREDICATE_FLOW.md)
- [Sequence Diagrams](./SEQUENCE_DIAGRAMS.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
