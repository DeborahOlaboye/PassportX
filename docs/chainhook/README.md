# Chainhook Documentation

This directory contains the complete documentation for PassportX's Chainhook
integration — the system that watches the Stacks blockchain and triggers
real-time updates in response to on-chain events.

## Start Here

```
[Contract Event] → [Chainhook Node] → [Predicate Match] → [Webhook POST] → [Backend Handler] → [Database / WebSocket]
```

## Documents

| Document                                       | What you will learn                                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)           | Component map, two-layer config explained, predicate table, network environments                                 |
| [PREDICATE_FLOW.md](./PREDICATE_FLOW.md)       | Step-by-step predicate lifecycle, registration call chain, webhook signature algorithm                           |
| [SEQUENCE_DIAGRAMS.md](./SEQUENCE_DIAGRAMS.md) | Mermaid diagrams for badge mint, metadata update, revocation, community creation, connection recovery, and reorg |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)     | Diagnostic checklist, fixes for 8 common failure modes, error code reference                                     |
| [CONFIGURATION.md](./CONFIGURATION.md)         | Every environment variable, all config file exports, `.env` templates for dev and production                     |

## Key Files (quick reference)

```
src/
  config/chainhook/
    constants.ts        ← Contract addresses, predicate names, error codes
    server.config.ts    ← Local event-server config (dev / prod)
    node.config.ts      ← Chainhook node connection config
    index.ts            ← getChainhookConfig(), validateChainhookConfig()
    utils.ts            ← getCurrentNetwork(), validateChainhookEnvironment()
  chainhook/
    config/chainhook.config.ts  ← Runtime config for handlers
    types/handlers.ts           ← Event payload TypeScript interfaces
    handlers/                   ← Per-event business logic
    services/                   ← Notification, WebSocket, delivery
    utils/eventMapper.ts        ← Raw payload → typed domain events
    index.ts                    ← Public barrel export

backend/src/
  config/predicates.ts          ← Builds all Predicate objects
  config/contracts.ts           ← Contract address registry
  middleware/webhookValidation.ts  ← HMAC-SHA256 signature verification
  services/chainhookPredicateManager.ts  ← Registers predicates with node
  services/chainhookEventObserver.ts     ← Long-lived subscription observer
```
