# Chainhook Integration & Testing Guide

## Overview

This guide covers the comprehensive test suite for Chainhook integration with PassportX. The test suite provides 85+ tests covering predicates, event handlers, reorg scenarios, and high-volume processing.

## Architecture

### Components

#### 1. Chainhook Types (`src/types/chainhook.ts`)

Defines all event types and predicate configurations:
- `ChainhookEvent` - Base event type
- `STXTransferEvent` - STX transfers
- `ContractCallEvent` - Smart contract calls
- `NFTMintEvent` - NFT minting events
- `BadgeMintPredicateEvent` - Badge-specific events
- `CommunityCreationEvent` - Community creation
- `RevocationEvent` - Badge/community revocations
- `ReorgEvent` - Blockchain reorganizations
- `PredicateConfig` - Event filter definitions

#### 2. Predicate Evaluator (`src/utils/predicateEvaluator.ts`)

Evaluates whether events match predicate conditions:

```typescript
const predicate = new PredicateBuilder()
  .withId('badge-mint')
  .withEventType(EventType.TX)
  .withFunctionName('mint-badge')
  .build();

const result = PredicateEvaluator.evaluateEvent(event, predicate);
```

**Features:**
- Filter by event type, function name, sender, recipient, amount
- Fluent builder API
- Batch evaluation
- Predicate validation

#### 3. Mock Event Factory (`src/utils/mockChainhookEvents.ts`)

Creates realistic mock events for testing:

```typescript
const badgeEvent = MockChainhookEventFactory.createBadgeMintEvent({
  badgeId: 'badge-1',
  recipientAddress: 'ST...',
  communityId: 'community-1'
});

const events = MockChainhookEventFactory.createEventBatch(100);
```

#### 4. Event Handler Registry (`src/utils/eventHandlerRegistry.ts`)

Manages event handlers and dispatches events:

```typescript
const registry = new EventHandlerRegistry();

registry.registerHandler('badge-mint', async (event) => {
  console.log('Badge minted:', event);
});

await registry.dispatch('badge-mint', event);
```

**Features:**
- Multiple handlers per event type
- Error handling and recovery
- Action dispatching
- Context passing

#### 5. Reorg Handler (`src/utils/reorgHandler.ts`)

Manages blockchain reorganizations:

```typescript
const reorgHandler = new ReorgHandler();

const reorgState = await reorgHandler.handleReorg(reorgEvent);

const isAffected = reorgHandler.isTransactionAffected('tx-hash');
const recoveryActions = reorgHandler.getRecoveryActions();
```

**Features:**
- Track reorg history
- Identify affected transactions
- Recovery action planning
- Reorg-aware event processor

## Test Suite

### Unit Tests

#### Predicate Tests (`tests/unit/chainhook.predicates.test.ts`)

14 tests covering:
- Event type matching
- Function name filtering
- Sender/recipient filtering
- Amount range filtering
- Predicate validation
- Builder pattern

```bash
npm test tests/unit/chainhook.predicates.test.ts
```

#### Handler Tests (`tests/unit/chainhook.handlers.test.ts`)

11 tests covering:
- Handler registration
- Event dispatching
- Error handling
- Multiple handlers
- Action execution
- Builder pattern

```bash
npm test tests/unit/chainhook.handlers.test.ts
```

#### Reorg Tests (`tests/unit/chainhook.reorg.test.ts`)

20 tests covering:
- Reorg tracking
- Transaction impact detection
- Block removal tracking
- Reorg depth calculation
- History management
- Recovery planning
- Reorg-aware event processing

```bash
npm test tests/unit/chainhook.reorg.test.ts
```

### Integration Tests (`tests/integration/chainhook.integration.test.ts`)

15 tests covering end-to-end scenarios:
- Badge mint event flow
- Community creation flow
- Revocation handling
- Metadata updates
- Connection failures
- Event batch processing
- Predicate-action orchestration

```bash
npm test tests/integration/chainhook.integration.test.ts
```

### Performance Tests (`tests/performance/chainhook.performance.test.ts`)

15 performance benchmarks:
- 1000 event processing
- 500 predicates evaluation
- Handler dispatch efficiency
- Reorg history queries
- Memory usage verification
- Concurrent operations

```bash
npm test tests/performance/chainhook.performance.test.ts
```

### E2E Tests (`tests/e2e/chainhook.e2e.test.ts`)

10 end-to-end scenarios:
- Complete badge lifecycle
- Community formation and management
- Reorg recovery
- High frequency events
- Multi-predicate matching
- Error recovery and resilience
- Data integrity verification

```bash
npm test tests/e2e/chainhook.e2e.test.ts
```

## Test Coverage

**Target: 80%+ code coverage**

Run all Chainhook tests:
```bash
npm test -- --testPathPattern="chainhook"
```

Generate coverage report:
```bash
npm test -- --testPathPattern="chainhook" --coverage
```

## Event Scenarios Tested

### Badge Mint Events
- Single badge minting
- Batch badge minting
- Multiple recipients
- Reorg handling

### Metadata Updates
- Badge metadata changes
- Community metadata updates
- Property verification

### Community Creation
- New community creation
- Community metadata
- Founder verification
- Tags and descriptions

### Revocation Events
- Badge revocation
- Community revocation
- Revocation reasons
- Affected entity tracking

### Reorg Handling
- Shallow reorgs (1-10 blocks)
- Deep reorgs (10-100 blocks)
- Transaction rollback
- Data integrity recovery
- Event reprocessing

### Connection Failures
- Network disconnection
- Event handler failures
- Recovery and retry
- Error propagation

## API Usage Examples

### Setting Up Predicates

```typescript
import { PredicateBuilder, EventType } from './src/utils/predicateEvaluator';

const badgeMintPredicate = new PredicateBuilder()
  .withId('badge-mint-alert')
  .withName('High-Value Badge Minting')
  .withNetwork('testnet')
  .withEventType(EventType.TX)
  .withFunctionName('mint-badge')
  .withMinAmount(BigInt(100000000)) // Min amount in microSTX
  .enabled(true)
  .build();
```

### Registering Handlers

```typescript
import { EventHandlerRegistry, EventHandlerBuilder } from './src/utils/eventHandlerRegistry';

const registry = new EventHandlerRegistry();

const builder = new EventHandlerBuilder(registry);
builder
  .onBadgeMint(async (event) => {
    console.log('Badge minted:', event.badgeId);
  })
  .onCommunityCreation(async (event) => {
    console.log('Community created:', event.communityId);
  })
  .action('notify', async (data) => {
    // Send notification
  })
  .onError(async (error, event) => {
    console.error('Handler error:', error.message);
  });
```

### Handling Reorgs

```typescript
import { ReorgHandler, ReorgAwareEventProcessor } from './src/utils/reorgHandler';

const reorgHandler = new ReorgHandler(100); // Max depth 100 blocks

reorgHandler.onAffectedTransactions(async (txHashes) => {
  console.log('Transactions affected by reorg:', txHashes);
  // Trigger reprocessing
});

const processor = new ReorgAwareEventProcessor(reorgHandler);

const result = await processor.processEvent(event, async (e) => {
  // Process event only if not affected by reorg
  await registry.dispatch('badge-mint', e);
});
```

## Performance Benchmarks

From performance tests:

| Scenario | Target | Result |
|----------|--------|--------|
| 1000 events | <5s | ✅ |
| 500 predicates | <2s | ✅ |
| Event dispatch latency | <10ms | ✅ |
| Reorg tracking (100 events) | <500ms | ✅ |
| Memory per 1000 events | <50MB | ✅ |
| Concurrent operations | <2s | ✅ |

## Continuous Integration

CI/CD pipeline runs tests automatically on:
- Pull requests
- Commits to main/develop branches
- Pre-deployment checks

Tests must pass with:
- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ Performance within benchmarks
- ✅ No regressions

## Troubleshooting

### Tests Failing

1. **Predicate validation errors**: Check predicate ID and event type
2. **Handler dispatch issues**: Ensure handlers are registered before dispatch
3. **Reorg tests failing**: Verify reorg depth calculations
4. **Performance degradation**: Check for memory leaks in handler closures

### Debugging

Enable debug logging:
```typescript
process.env.DEBUG = 'chainhook:*';
```

Run single test:
```bash
npm test tests/unit/chainhook.predicates.test.ts -- --testNamePattern="should match event"
```

## Extending the Test Suite

### Adding New Event Types

1. Add type to `src/types/chainhook.ts`
2. Add factory method to `MockChainhookEventFactory`
3. Add predicate filters in `PredicateEvaluator`
4. Add test cases
5. Add handler in `EventHandlerRegistry`

### Adding Custom Handlers

```typescript
registry.registerHandler('custom-event', async (event) => {
  // Custom logic
});
```

### Adding Performance Tests

Follow patterns in `tests/performance/chainhook.performance.test.ts`:
- Measure timing with `Date.now()`
- Set performance thresholds
- Check memory usage
- Test concurrent operations

## Best Practices

1. **Always use predicates** to filter relevant events
2. **Register error handlers** to handle failures gracefully
3. **Use reorg-aware processor** for critical operations
4. **Batch events** when processing high volume
5. **Monitor performance** with timing metrics
6. **Validate data** after reorg recovery
7. **Test with realistic event batches** for performance

## Next Steps

- Integrate with actual Chainhook API endpoint
- Implement state persistence for processed events
- Add monitoring and alerting
- Deploy test suite to CI/CD pipeline
- Scale to testnet and mainnet

## Support

For issues or questions:
1. Check test output for error messages
2. Review relevant test case examples
3. Check architecture documentation
4. Open issue with test failure details
