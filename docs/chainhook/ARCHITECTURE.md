# Chainhook Architecture Overview

PassportX uses [Hiro Chainhooks](https://docs.hiro.so/chainhook/overview) to watch
Stacks blockchain transactions in real-time. This document explains every component,
how they relate, and how data flows from on-chain contract events to the database and
connected clients.

---

## High-Level Event Pipeline

```
[Stacks Contract] → [Chainhook Node] → [Predicate Match] → [Webhook POST] → [Backend Handler] → [Database / WebSocket]
```

More precisely:

```
Stacks Blockchain
      │
      ▼
┌─────────────────────┐
│   Chainhook Node    │  Hiro-hosted or self-hosted
│  (event indexer)    │  Listens to every block
└─────────┬───────────┘
          │  matches a registered predicate
          ▼
┌─────────────────────┐
│     Predicate       │  Defined in backend/src/config/predicates.ts
│  (filter rule)      │  e.g. "call mint on passport-nft contract"
└─────────┬───────────┘
          │  HTTP POST to webhook URL
          ▼
┌──────────────────────────────────────┐
│         Backend Webhook Handler      │  Express route in backend/src/routes/
│  /api/badges/webhook/mint            │
│  /api/badges/webhook/metadata        │
│  /api/badges/webhook/revocation      │
│  /api/community-creation/webhook/    │
└─────────┬────────────────────────────┘
          │  validated + parsed
          ▼
┌─────────────────────┐     ┌──────────────────┐
│  Chainhook Handler  │────▶│    MongoDB        │
│  (business logic)   │     │  (persist event)  │
└─────────┬───────────┘     └──────────────────┘
          │
          ▼
┌─────────────────────┐     ┌──────────────────┐
│  Notification /     │────▶│  WebSocket /      │
│  Analytics Service  │     │  REST clients     │
└─────────────────────┘     └──────────────────┘
```

---

## Component Map

### Frontend (`src/`)

| Location                                   | Role                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `src/config/chainhook/constants.ts`        | Contract addresses, predicate names, error codes, default values            |
| `src/config/chainhook/server.config.ts`    | Local event-server config (host, port, HTTPS) per environment               |
| `src/config/chainhook/node.config.ts`      | Remote Chainhook-node connection config (URL, API key, retries)             |
| `src/config/chainhook/index.ts`            | Combines server + node config; exports `getChainhookConfig()`               |
| `src/config/chainhook/utils.ts`            | Network detection, config helpers, error utilities                          |
| `src/chainhook/config/chainhook.config.ts` | Runtime config object consumed by handlers (reads env vars)                 |
| `src/chainhook/types/chainhook.types.ts`   | TypeScript interfaces for config objects                                    |
| `src/chainhook/types/handlers.ts`          | Event payload interfaces (`BadgeMintEvent`, `CommunityCreationEvent`, etc.) |
| `src/chainhook/handlers/`                  | Per-event business-logic handlers                                           |
| `src/chainhook/services/`                  | Notification delivery, WebSocket emitter, integration glue                  |
| `src/chainhook/utils/eventMapper.ts`       | Maps raw Chainhook payloads to typed domain events                          |
| `src/chainhook/utils/errorHandler.ts`      | Typed error wrapping for Chainhook failures                                 |
| `src/chainhook/index.ts`                   | Public barrel export for the entire chainhook module                        |

### Backend (`backend/src/`)

| Location                                               | Role                                                            |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `backend/src/config/predicates.ts`                     | Builds `Predicate` objects from env vars and contract addresses |
| `backend/src/config/contracts.ts`                      | Contract address registry (reads `STACKS_NETWORK` env var)      |
| `backend/src/middleware/webhookValidation.ts`          | HMAC-SHA256 signature verification for incoming Chainhook POSTs |
| `backend/src/middleware/badgeMetadataUpdateWebhook.ts` | Middleware for badge metadata webhook endpoint                  |
| `backend/src/middleware/badgeRevocationWebhook.ts`     | Middleware for badge revocation webhook endpoint                |
| `backend/src/services/chainhookPredicateManager.ts`    | Registers and manages predicates with the Chainhook node        |
| `backend/src/services/chainhookEventProcessor.ts`      | Dispatches incoming events to the correct handler               |
| `backend/src/services/chainhookEventObserver.ts`       | Long-lived observer that keeps the predicate subscription alive |
| `backend/src/routes/chainhook.ts`                      | Chainhook management REST API (list/register predicates)        |

---

## Two Configuration Layers

PassportX has **two separate chainhook config layers** that often confuse new developers:

```
Layer 1 — src/config/chainhook/          (Frontend / Next.js)
│
│  Purpose: Configure the local event-server the frontend runs to receive
│           Chainhook events in development / testing.
│
│  Key exports: getChainhookConfig(), chainhookConfig, validateChainhookConfig()
│
└──▶ Used by: src/chainhook/ handlers and services

Layer 2 — backend/src/config/predicates.ts  (Backend / Express)
│
│  Purpose: Define the predicate filter rules that tell the Chainhook node
│           WHAT to watch and WHERE to POST events (the backend webhook URLs).
│
│  Key exports: getPredicateConfigs(), getAllPredicates(), validatePredicateConfig()
│
└──▶ Used by: ChainhookPredicateManager, chainhookEventProcessor
```

These two layers are **independent** but complementary:

- Layer 1 describes how to receive and parse events.
- Layer 2 describes what events to subscribe to.

---

## Network Environments

| Environment | Chainhook Node                | Network value |
| ----------- | ----------------------------- | ------------- |
| Development | `http://localhost:20456`      | `devnet`      |
| Testnet     | `https://api.testnet.hiro.so` | `testnet`     |
| Mainnet     | `https://api.hiro.so`         | `mainnet`     |

Set `STACKS_NETWORK` and `CHAINHOOK_NODE_URL` environment variables to switch between them.

---

## Predicate Types

PassportX uses two predicate types for each on-chain event:

| Type                   | Trigger                                    | Use case                              |
| ---------------------- | ------------------------------------------ | ------------------------------------- |
| `stacks-contract-call` | A specific contract method is called       | Catch the call before it is confirmed |
| `stacks-print`         | A `print` event is emitted by the contract | Catch structured data after execution |

Both types for each event type are registered in `backend/src/config/predicates.ts`.

---

## Registered Predicates

| Predicate UUID                     | Event                     | Contract Method / Print Topic        | Webhook URL                              |
| ---------------------------------- | ------------------------- | ------------------------------------ | ---------------------------------------- |
| `pred_community_creation_call`     | Community created (call)  | `community-manager.create-community` | `/api/community-creation/webhook/events` |
| `pred_community_creation_event`    | Community created (print) | `community-created`                  | `/api/community-creation/webhook/events` |
| `pred_badge_mint_call`             | Badge minted (call)       | `passport-nft.mint`                  | `/api/badges/webhook/mint`               |
| `pred_badge_mint_event`            | Badge minted (print)      | `badge-minted`                       | `/api/badges/webhook/mint`               |
| `pred_badge_metadata_update_call`  | Metadata updated (call)   | `badge-metadata.update-metadata`     | `/api/badges/webhook/metadata`           |
| `pred_badge_metadata_update_event` | Metadata updated (print)  | `metadata-updated`                   | `/api/badges/webhook/metadata`           |
| `pred_badge_revocation_call`       | Badge revoked (call)      | `badge-issuer.revoke-badge`          | `/api/badges/webhook/revocation`         |
| `pred_badge_revocation_event`      | Badge revoked (print)     | `badge-revoked`                      | `/api/badges/webhook/revocation`         |

---

## Related Documents

- [Predicate Flow](./PREDICATE_FLOW.md) — end-to-end predicate lifecycle
- [Sequence Diagrams](./SEQUENCE_DIAGRAMS.md) — per-event sequence diagrams
- [Troubleshooting Guide](./TROUBLESHOOTING.md) — debugging and common issues
- [Configuration Reference](./CONFIGURATION.md) — all environment variables
