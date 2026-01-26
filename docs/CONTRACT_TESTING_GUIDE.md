# Contract Hooks Testing Guide

Comprehensive guide for testing smart contract interaction hooks in PassportX.

## Overview

This document describes the testing infrastructure, utilities, and best practices for testing contract interaction hooks including:
- `useIssueBadge` - Badge issuance and revocation
- `useCreateCommunity` - Community creation and management
- `useTransactionStatus` - Transaction polling and status tracking
- `useContractEvents` - Event subscription and handling

## Test Architecture

### Test Files

1. **integration.test.ts** (522 lines)
   - End-to-end integration tests with actual async flows
   - Real transaction lifecycle testing
   - Post-condition validation
   - Concurrent request handling

2. **unit.test.ts** (510 lines)
   - Unit tests with mocked contract responses
   - Isolated hook testing
   - State management testing
   - Error handling with mocks

3. **error-handling.test.ts** (586 lines)
   - Comprehensive error scenario coverage
   - User rejection scenarios
   - Balance and authorization errors
   - Network and timeout errors

4. **post-conditions.test.ts** (528 lines)
   - STX/FT/NFT post-condition validation
   - Badge issuance conditions
   - Community creation conditions
   - Edge cases and type mismatches

5. **additional-hooks.test.ts** (542 lines)
   - Transaction status tracking
   - Contract event subscriptions
   - Hook composition and interaction
   - Fee estimation and nonce management

### Test Utilities

#### test-setup.ts
Central configuration and fixtures for all test suites:

```typescript
// Mock user session
mockUserSession = {
  isUserSignedIn: jest.fn(),
  isSessionValid: jest.fn(),
  loadUserData: jest.fn(),
  signUserOut: jest.fn()
}

// Badge issuance fixtures
badgeIssuanceFixtures = {
  validParams: { ... },
  validResponse: { txId: '...', badgeId: 1 },
  errorResponses: { ... }
}

// Community creation fixtures
communityCreationFixtures = {
  validParams: { ... },
  minimalParams: { ... },
  statusResponses: { ... }
}

// Test data generators
testDataGenerators = {
  generateStacksAddress(),
  generateTransactionId(),
  generateBadgeId(),
  generateCommunityId(),
  generateBadgeParams(),
  generateCommunityParams()
}

// Assertion utilities
assertions = {
  assertSuccessfulTransaction(),
  assertFailedTransaction(),
  assertLoadingState(),
  assertResetState()
}
```

#### transaction-mocks.ts
Transaction lifecycle and error simulation (598 lines):

```typescript
// Mock transaction factory
MockTransactionFactory = {
  createSuccessfulTransaction(),
  createPendingTransaction(),
  createFailedTransaction(),
  createDroppedTransaction(),
  createSTXPostCondition(),
  createFTPostCondition(),
  createNFTPostCondition()
}

// Transaction sequence simulator
TransactionSequenceSimulator = {
  successSequence(),
  failureSequence(),
  droppedSequence(),
  getNext(),
  reset()
}

// Error factory
TransactionErrorFactory = {
  insufficientBalance(),
  postConditionFailed(),
  contractNotFound(),
  executionError(),
  authorizationError(),
  networkError(),
  timeoutError()
}

// Fee estimation
FeeEstimator = {
  estimateBaseFee(),
  estimateComplexityFee(),
  estimateTotalFee(),
  estimateFeeWithPriority()
}

// Nonce management
NonceManager = {
  getNextNonce(),
  getCurrentNonce(),
  resetNonce(),
  resetAll()
}
```

## Running Tests

### Run all contract hook tests:
```bash
npm test -- src/hooks/__tests__/
```

### Run specific test suite:
```bash
npm test -- src/hooks/__tests__/integration.test.ts
npm test -- src/hooks/__tests__/unit.test.ts
npm test -- src/hooks/__tests__/error-handling.test.ts
npm test -- src/hooks/__tests__/post-conditions.test.ts
npm test -- src/hooks/__tests__/additional-hooks.test.ts
```

### Run with coverage:
```bash
npm test -- src/hooks/__tests__/ --coverage
```

### Watch mode:
```bash
npm test -- src/hooks/__tests__/ --watch
```

## Test Coverage Summary

### Total Test Cases: 210+

#### By Category:
- **Integration Tests**: 50+ test cases
- **Unit Tests**: 40+ test cases
- **Error Handling Tests**: 40+ test cases
- **Post-Condition Tests**: 38 test cases
- **Additional Hook Tests**: 45+ test cases

#### Coverage by Hook:
- **useIssueBadge**: 70 test cases
  - Badge issuance operations
  - Revocation operations
  - State management
  - Error scenarios
  - Post-conditions

- **useCreateCommunity**: 65 test cases
  - Community creation
  - Parameter validation
  - Transaction tracking
  - Status polling
  - Error handling

- **useTransactionStatus**: 35 test cases
  - Transaction polling
  - Status updates
  - Confirmation tracking
  - Error handling

- **useContractEvents**: 30 test cases
  - Event fetching
  - Event subscriptions
  - Multiple event types
  - Error scenarios

- **Fee & Nonce Management**: 15 test cases
  - Fee estimation
  - Nonce tracking
  - Priority levels

## Key Testing Patterns

### 1. Integration Testing Pattern
```typescript
describe('Badge Issuance Integration', () => {
  it('should handle complete badge issuance flow', async () => {
    // Render hook
    const { result } = renderHook(() => useIssueBadge())

    // Trigger issuance
    act(() => {
      result.current.issueBadge(params)
    })

    // Wait for async completion
    await waitFor(() => {
      expect(result.current.success).toBe(true)
    })

    // Verify state
    assertions.assertSuccessfulTransaction(result.current)
  })
})
```

### 2. Error Handling Pattern
```typescript
describe('Error Handling', () => {
  it('should handle user rejection', async () => {
    // Mock rejection
    mockBadgeManager.issueBadge.mockRejectedValueOnce(
      TransactionErrorFactory.userRejected()
    )

    const { result } = renderHook(() => useIssueBadge())

    // Trigger and verify error
    await act(async () => {
      await result.current.issueBadge(params)
    })

    assertions.assertFailedTransaction(result.current, 'User rejected')
  })
})
```

### 3. Post-Condition Testing Pattern
```typescript
describe('Post-Conditions', () => {
  it('should validate badge issuance conditions', () => {
    const conditions = [
      MockTransactionFactory.createSTXPostCondition(...),
      MockTransactionFactory.createNFTPostCondition(...)
    ]

    const result = PostConditionValidator.validateAll(
      conditions,
      actualAmounts
    )

    expect(result.valid).toBe(true)
  })
})
```

### 4. Hook Composition Pattern
```typescript
describe('Hook Composition', () => {
  it('should compose multiple hooks', async () => {
    const statusHook = renderHook(() => useTransactionStatus(txId))
    const eventsHook = renderHook(() => useContractEvents(address, type))

    await waitFor(() => {
      expect(statusHook.result.current.status).toBeDefined()
      expect(eventsHook.result.current.events).toBeDefined()
    })
  })
})
```

## Mock Implementation Details

### Badge Issuer Manager Mock
```typescript
const mockBadgeManager = {
  issueBadge: jest.fn().mockResolvedValue({
    txId: 'tx_123',
    badgeId: 1
  }),
  revokeBadge: jest.fn().mockResolvedValue({
    txId: 'tx_456',
    badgeId: 1
  }),
  validateBadge: jest.fn().mockResolvedValue(true)
}
```

### Community Manager Mock
```typescript
const mockCommunityManager = {
  createCommunity: jest.fn().mockResolvedValue({
    txId: 'tx_789',
    communityId: 1
  }),
  validateTransactionStatus: jest.fn().mockResolvedValue({
    status: 'success',
    blockHeight: 50000,
    confirmed: true
  })
}
```

## Transaction State Machine

Transactions follow this state progression:

```
┌─────────┐
│ pending │
└────┬────┘
     │
  ┌──┴──┐
  │     │
  ▼     ▼
┌─────┐ ┌──────┐
│success failed
└─────┘ └──────┘
```

Test coverage includes all state transitions and error conditions at each state.

## Post-Condition Types

### STX Post-Conditions
- `send-greater-than`: Amount > required
- `send-greater-than-or-equal`: Amount >= required
- `send-less-than`: Amount < required
- `send-less-than-or-equal`: Amount <= required
- `send-equal`: Amount = required

### FT (Fungible Token) Post-Conditions
Same operators as STX, applies to token transfers.

### NFT Post-Conditions
- `receives`: Principal receives an NFT
- `sends`: Principal sends an NFT
- `owns`: Principal owns an NFT

## Error Scenarios Covered

1. **User Rejection**
   - User cancels transaction in wallet
   - User denies signature request

2. **Insufficient Funds**
   - Not enough STX for fees
   - Insufficient balance for payment

3. **Contract Errors**
   - Contract not found
   - Execution failure
   - Permission denied

4. **Network Errors**
   - Connection timeout
   - API unavailable
   - Invalid response

5. **Transaction Errors**
   - Invalid nonce
   - Serialization failure
   - Signature error

6. **Post-Condition Failures**
   - STX transfer amount mismatch
   - FT transfer failure
   - NFT transfer failure

## Best Practices

### 1. Isolation
- Mock external dependencies (contract managers, APIs)
- Test one behavior at a time
- Reset mocks between tests

### 2. Clarity
- Use descriptive test names
- Document complex assertions
- Include setup comments

### 3. Completeness
- Test success and failure paths
- Test edge cases
- Test error messages

### 4. Performance
- Use appropriate async utilities
- Avoid unnecessary delays
- Clean up timers and intervals

### 5. Maintainability
- Use shared fixtures and utilities
- Follow consistent patterns
- Keep tests DRY

## Continuous Integration

Tests are configured to run:
- On every commit
- Before merging to main
- With full coverage reporting
- With performance benchmarks

Run locally before pushing:
```bash
npm test -- src/hooks/__tests__/ --coverage
npm run lint
npm run build
```

## Troubleshooting

### Tests timing out
- Increase timeout: `jest.setTimeout(10000)`
- Check async operations
- Verify mock implementations

### Nondeterministic failures
- Check for timing issues
- Verify mock state reset
- Review async waiting conditions

### Mock not being called
- Verify jest.mock() setup
- Check function name matches
- Ensure mock is configured before hook render

## Future Enhancements

1. **Testnet Integration Tests**
   - Connect to actual testnet contracts
   - Real transaction submission
   - Live event streaming

2. **Performance Benchmarks**
   - Hook render time
   - State update latency
   - Memory usage tracking

3. **Snapshot Testing**
   - UI component snapshots
   - State machine snapshots
   - Error message snapshots

4. **E2E Testing**
   - Full user workflows
   - Browser automation
   - Real wallet integration

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Stacks Documentation](https://docs.stacks.co/)
- [@stacks/auth API](https://github.com/stacks-network/stacks.js/tree/master/packages/auth)
- [@stacks/transactions API](https://github.com/stacks-network/stacks.js/tree/master/packages/transactions)
