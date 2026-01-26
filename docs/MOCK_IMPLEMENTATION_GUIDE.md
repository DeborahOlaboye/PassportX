# Mock Implementation Guide

Complete guide for understanding and extending the mock implementations for contract hook testing.

## Overview

This guide explains the mock implementations used in Issue #159 tests and how to extend or customize them for additional testing scenarios.

## Mock Architecture

### Three-Layer Mock System

```
┌─────────────────────────────────────────┐
│ Test Suites (*.test.ts)                 │
│ - integration.test.ts                   │
│ - unit.test.ts                          │
│ - error-handling.test.ts                │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Mock Utilities (transaction-mocks.ts)   │
│ - MockTransactionFactory                │
│ - TransactionSequenceSimulator          │
│ - TransactionErrorFactory               │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ Test Setup (test-setup.ts)              │
│ - Fixtures                              │
│ - Data Generators                       │
│ - Assertions                            │
└─────────────────────────────────────────┘
```

## Mock Transaction Factory

### Creating Transactions

#### Successful Transaction
```typescript
const tx = MockTransactionFactory.createSuccessfulTransaction({
  txId: 'tx_custom_123',
  blockHeight: 50000,
  fee: 200
})

// Returns:
{
  txId: 'tx_custom_123',
  status: 'success',
  blockHeight: 50000,
  blockTime: 1672531200,
  confirmed: true,
  fee: 200,
  nonce: 42,
  sender: 'STTEST...'
}
```

#### Pending Transaction
```typescript
const tx = MockTransactionFactory.createPendingTransaction({
  txId: 'tx_pending_456'
})

// Returns:
{
  txId: 'tx_pending_456',
  status: 'pending',
  confirmed: false,
  fee: 180,
  nonce: 1,
  sender: 'STTEST...'
}
```

#### Failed Transaction
```typescript
const tx = MockTransactionFactory.createFailedTransaction('Insufficient balance', {
  blockHeight: 50000
})

// Returns:
{
  txId: 'tx_failed_789',
  status: 'failed',
  blockHeight: 50000,
  confirmed: true,
  fee: 180,
  nonce: 1,
  sender: 'STTEST...'
}
```

#### Dropped Transaction
```typescript
const tx = MockTransactionFactory.createDroppedTransaction({
  txId: 'tx_dropped_000'
})

// Returns:
{
  txId: 'tx_dropped_000',
  status: 'dropped',
  confirmed: false,
  fee: 180,
  nonce: 1,
  sender: 'STTEST...'
}
```

### Post-Conditions

#### STX Post-Condition
```typescript
const condition = MockTransactionFactory.createSTXPostCondition(
  'SPTest.badge-issuer',
  100,                          // 100 microSTX
  'send-greater-than-or-equal'
)

// Use in transaction:
const tx = MockTransactionFactory.createSuccessfulTransaction({
  postConditions: [condition]
})
```

#### FT (Fungible Token) Post-Condition
```typescript
const condition = MockTransactionFactory.createFTPostCondition(
  'SPTest.user',
  'SPTest.token-contract',
  'MY-TOKEN',
  5000,                    // 5000 tokens
  'send-equal'
)
```

#### NFT Post-Condition
```typescript
const condition = MockTransactionFactory.createNFTPostCondition(
  'SPTest.user',
  'SPTest.nft-contract',
  'MY-NFT',
  'receives'
)
```

## Transaction Sequence Simulator

### Success Path
```typescript
const simulator = TransactionSequenceSimulator.successSequence()

const pending = simulator.getNext()      // { status: 'pending' }
const success = simulator.getNext()      // { status: 'success' }
const repeated = simulator.getNext()     // { status: 'success' } (stays on last)

simulator.reset()                        // Back to pending
```

### Failure Path
```typescript
const simulator = TransactionSequenceSimulator.failureSequence()

const pending = simulator.getNext()      // { status: 'pending' }
const failed = simulator.getNext()       // { status: 'failed' }
```

### Dropped Path
```typescript
const simulator = TransactionSequenceSimulator.droppedSequence()

const pending = simulator.getNext()      // { status: 'pending' }
const dropped = simulator.getNext()      // { status: 'dropped' }
```

### Custom Sequence
```typescript
class CustomSequence extends TransactionSequenceSimulator {
  static customSequence() {
    const sim = new TransactionSequenceSimulator()
    const txId = `tx_custom_${Date.now()}`
    
    sim.sequence = [
      { txId, status: 'pending', confirmed: false, ... },
      { txId, status: 'pending', blockHeight: 49999, ... },
      { txId, status: 'success', blockHeight: 50000, ... }
    ]
    return sim
  }
}
```

## Transaction Error Factory

### Error Types

#### User Rejection
```typescript
const error = TransactionErrorFactory.userRejected()
// 'User rejected the transaction'

try {
  await mockBadgeManager.issueBadge(params)
} catch (e) {
  expect(e.message).toContain('User rejected')
}
```

#### Insufficient Balance
```typescript
const error = TransactionErrorFactory.insufficientBalance(1000, 500)
// 'Insufficient balance. Required: 1000 microSTX, Available: 500 microSTX'
```

#### Post-Condition Failure
```typescript
const error = TransactionErrorFactory.postConditionFailed(
  'send-greater-than',
  'Amount was less than expected'
)
```

#### Contract Errors
```typescript
// Contract not found
const error = TransactionErrorFactory.contractNotFound(
  'SPTest.badge-issuer',
  'badge-issuer'
)

// Execution error
const error = TransactionErrorFactory.executionError(
  'Post-condition failed',
  'ERR_POST_CONDITION_FAILED'
)

// Authorization error
const error = TransactionErrorFactory.authorizationError(
  'Only badge issuers can issue badges'
)
```

#### Network Errors
```typescript
const error = TransactionErrorFactory.networkError('Connection refused')
const timeout = TransactionErrorFactory.timeoutError('Badge issuance', 30000)
```

#### Transaction Errors
```typescript
const invalidTx = TransactionErrorFactory.invalidTransaction(
  'Missing required fields'
)
const nonceError = TransactionErrorFactory.nonceError(5, 3)
const sigError = TransactionErrorFactory.signatureError('Invalid signature')
```

## Post-Condition Validator

### Validation Examples

#### STX Validation
```typescript
const condition = MockTransactionFactory.createSTXPostCondition(
  'SPTest',
  1000,
  'send-greater-than'
)

// Valid: 1500 > 1000
const result1 = PostConditionValidator.validateSTX(condition, 1500)
expect(result1.valid).toBe(true)

// Invalid: 500 < 1000
const result2 = PostConditionValidator.validateSTX(condition, 500)
expect(result2.valid).toBe(false)
expect(result2.reason).toContain('500')
expect(result2.reason).toContain('1000')
```

#### Multiple Conditions
```typescript
const conditions = [
  MockTransactionFactory.createSTXPostCondition('SPTest', 100, 'send-greater-than-or-equal'),
  MockTransactionFactory.createNFTPostCondition('ST123', 'SPTest.nft', 'BADGE', 'receives')
]

const actualAmounts = {
  'STX:': 150,
  'NFT:BADGE': 1
}

const result = PostConditionValidator.validateAll(conditions, actualAmounts)
expect(result.valid).toBe(true)
expect(result.failures).toHaveLength(0)
```

#### Failure Reporting
```typescript
const result = PostConditionValidator.validateAll(conditions, badAmounts)

if (!result.valid) {
  result.failures.forEach(failure => {
    console.log(`Condition failed: ${failure.condition.type}`)
    console.log(`Reason: ${failure.reason}`)
  })
}
```

## Fee Estimator

### Fee Calculation

#### Base Fee
```typescript
const baseFee = FeeEstimator.estimateBaseFee()
// 180 microSTX
```

#### Complexity Fee
```typescript
const complexityFee = FeeEstimator.estimateComplexityFee(
  500,    // contract size in bytes
  3       // number of arguments
)
// Added fee based on complexity
```

#### Total Fee
```typescript
const totalFee = FeeEstimator.estimateTotalFee(
  500,    // contract length
  3,      // arguments
  2       // post-conditions
)
// Base + complexity + post-condition fees
```

#### Priority-Based Fee
```typescript
const lowFee = FeeEstimator.estimateFeeWithPriority(500, 3, 'low')
const mediumFee = FeeEstimator.estimateFeeWithPriority(500, 3, 'medium')
const highFee = FeeEstimator.estimateFeeWithPriority(500, 3, 'high')

// highFee > mediumFee > lowFee
```

## Nonce Manager

### Nonce Operations

#### Get Next Nonce
```typescript
const nonceManager = new NonceManager()
const principal = testDataGenerators.generateStacksAddress()

const nonce1 = nonceManager.getNextNonce(principal)  // 1
const nonce2 = nonceManager.getNextNonce(principal)  // 2
const nonce3 = nonceManager.getNextNonce(principal)  // 3
```

#### Get Current Nonce
```typescript
const current = nonceManager.getCurrentNonce(principal)
// 3
```

#### Reset Operations
```typescript
// Reset single principal
nonceManager.resetNonce(principal)
nonceManager.getCurrentNonce(principal) // 0

// Reset all
nonceManager.resetAll()
```

#### Set Specific Nonce
```typescript
nonceManager.setNonce(principal, 10)
nonceManager.getNextNonce(principal) // 11
```

## Test Fixtures

### Badge Issuance Fixtures

#### Valid Parameters
```typescript
const params = badgeIssuanceFixtures.validParams
// {
//   recipientAddress: 'ST2CY5V5...',
//   templateId: 1,
//   communityId: 1,
//   recipientName: 'John Doe',
//   recipientEmail: 'john@example.com'
// }
```

#### Valid Response
```typescript
const response = badgeIssuanceFixtures.validResponse
// {
//   txId: 'tx_0123...',
//   badgeId: 1
// }
```

#### Error Responses
```typescript
const errors = badgeIssuanceFixtures.errorResponses
expect(() => { throw errors.userRejected }).toThrow('User rejected')
expect(() => { throw errors.insufficientBalance }).toThrow('Insufficient STX')
expect(() => { throw errors.templateNotFound }).toThrow('Badge template does not exist')
```

### Community Creation Fixtures

#### Valid Parameters
```typescript
const params = communityCreationFixtures.validParams
// {
//   name: 'Web3 Developers',
//   description: 'A community for Web3 developers',
//   stxPayment: 1000,
//   settings: { ... },
//   tags: ['web3', 'developers']
// }

const minimal = communityCreationFixtures.minimalParams
// Minimal required fields
```

#### Status Responses
```typescript
const success = communityCreationFixtures.statusResponses.success
const pending = communityCreationFixtures.statusResponses.pending
const failed = communityCreationFixtures.statusResponses.failed
```

## Test Data Generators

### Address Generation
```typescript
const testnetAddr = testDataGenerators.generateStacksAddress('testnet')
// STXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

const mainnetAddr = testDataGenerators.generateStacksAddress('mainnet')
// SPXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Transaction ID Generation
```typescript
const txId = testDataGenerators.generateTransactionId()
// tx_0123456789abcdef...
```

### ID Generators
```typescript
const badgeId = testDataGenerators.generateBadgeId()
// Random number 0-1000000

const communityId = testDataGenerators.generateCommunityId()
// Random number 0-10000
```

### Parameter Generators
```typescript
const badgeParams = testDataGenerators.generateBadgeParams({
  templateId: 5  // Override default
})

const communityParams = testDataGenerators.generateCommunityParams({
  stxPayment: 5000  // Override default
})
```

## Contract Manager Mocks

### Badge Issuer Manager Mock
```typescript
const mockBadgeManager = contractManagerMocks.createBadgeIssuerManager({
  badgeId: 99  // Custom response
})

// Methods:
await mockBadgeManager.issueBadge(params)
await mockBadgeManager.revokeBadge(badgeId)
await mockBadgeManager.getBadgeDetails(badgeId)
await mockBadgeManager.validateBadge(badgeId)

// Verify calls:
expect(mockBadgeManager.issueBadge).toHaveBeenCalledWith(params)
```

### Community Manager Mock
```typescript
const mockCommunityManager = contractManagerMocks.createCommunityManager({
  communityId: 99
})

// Methods:
await mockCommunityManager.createCommunity(params)
await mockCommunityManager.updateCommunity(id, updates)
await mockCommunityManager.validateTransactionStatus(txId)
await mockCommunityManager.getCommunityDetails(id)
```

## Custom Mock Creation

### Extending MockTransactionFactory
```typescript
class CustomTransactionFactory extends MockTransactionFactory {
  static createCustomTransaction() {
    return {
      txId: `custom_${Date.now()}`,
      status: 'success',
      blockHeight: 50000,
      // ... custom fields
    }
  }
}
```

### Creating Custom Sequence
```typescript
class BadgeIssuanceSequence extends TransactionSequenceSimulator {
  static create() {
    const sim = new TransactionSequenceSimulator()
    sim.sequence = [
      { status: 'pending', txId: 'badge_pending' },
      { status: 'pending', txId: 'badge_pending', blockHeight: 49999 },
      { status: 'success', txId: 'badge_pending', blockHeight: 50000, badgeId: 1 }
    ]
    return sim
  }
}
```

### Custom Error Factory
```typescript
class CustomErrorFactory extends TransactionErrorFactory {
  static customContractError(code: string) {
    return new Error(`Custom contract error (${code})`)
  }
}
```

## Assertion Utilities

### Success Verification
```typescript
const result = {
  isLoading: false,
  error: null,
  success: true,
  txId: 'tx_123',
  badgeId: 1
}

assertions.assertSuccessfulTransaction(result)
// Verifies: loading=false, error=null, success=true, txId defined
```

### Failure Verification
```typescript
const result = {
  isLoading: false,
  success: false,
  error: 'User rejected'
}

assertions.assertFailedTransaction(result, 'User rejected')
// Verifies: loading=false, success=false, error contains text
```

### Loading State
```typescript
assertions.assertLoadingState(result)
// Verifies: loading=true
```

### Reset State
```typescript
assertions.assertResetState(result)
// Verifies: loading=false, error=null, success=false, txId=null
```

## Testing Best Practices with Mocks

### 1. Proper Isolation
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  nonceManager.resetAll()
})

afterEach(() => {
  jest.restoreAllMocks()
})
```

### 2. Using Fixtures
```typescript
it('should handle valid badge issuance', async () => {
  const mockManager = contractManagerMocks.createBadgeIssuerManager()
  const params = badgeIssuanceFixtures.validParams
  
  const result = await mockManager.issueBadge(params)
  expect(result).toEqual(badgeIssuanceFixtures.validResponse)
})
```

### 3. Error Simulation
```typescript
it('should handle insufficient balance', async () => {
  const mockManager = contractManagerMocks.createBadgeIssuerManager()
  mockManager.issueBadge.mockRejectedValueOnce(
    TransactionErrorFactory.insufficientBalance(1000, 500)
  )
  
  await expect(mockManager.issueBadge(params)).rejects.toThrow()
})
```

### 4. State Tracking
```typescript
it('should track transaction state progression', () => {
  const simulator = TransactionSequenceSimulator.successSequence()
  const states = []
  
  states.push(simulator.getNext())
  states.push(simulator.getNext())
  
  expect(states[0].status).toBe('pending')
  expect(states[1].status).toBe('success')
})
```

## Troubleshooting Mocks

### Mock Not Being Called
```typescript
// Check mock was setup
expect(mockBadgeManager.issueBadge).toBeDefined()

// Verify parameters match
expect(mockBadgeManager.issueBadge).toHaveBeenCalledWith(
  expect.objectContaining(expectedParams)
)

// Check execution flow
mockBadgeManager.issueBadge.mockImplementationOnce(() => {
  console.log('Mock called!')
})
```

### Async Issues
```typescript
// Use waitFor from test utilities
await waitUtils.waitFor(
  () => mockManager.issueBadge.mock.calls.length > 0,
  5000
)
```

### State Mutations
```typescript
// Reset between tests
beforeEach(() => {
  const fresh = contractManagerMocks.createBadgeIssuerManager()
  mockBadgeManager = fresh
})
```

## References

- [Jest Mock Documentation](https://jestjs.io/docs/manual-mocks)
- [React Testing Library](https://testing-library.com/react)
- [Mocking Best Practices](https://testing-library.com/docs/queries/about)
