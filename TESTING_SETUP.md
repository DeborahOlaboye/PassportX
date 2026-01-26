# Contract Hooks Testing Setup Guide

Complete setup guide for running and configuring contract hooks tests.

## Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Run All Tests
```bash
npm test -- src/hooks/__tests__/
```

### 3. Run with Coverage
```bash
npm test -- src/hooks/__tests__/ --coverage
```

## Project Structure

```
src/
├── hooks/
│   ├── useIssueBadge.ts          # Badge issuance hook
│   ├── useCreateCommunity.ts     # Community creation hook
│   └── __tests__/
│       ├── integration.test.ts   # End-to-end tests
│       ├── unit.test.ts          # Isolated unit tests
│       ├── error-handling.test.ts# Error scenario tests
│       ├── post-conditions.test.ts# Post-condition validation
│       ├── additional-hooks.test.ts# Hook composition
│       └── test-setup.ts         # Shared fixtures and utilities
├── lib/
│   └── contracts/
│       ├── badgeContractUtils.ts # Badge contract interactions
│       ├── communityContractUtils.ts # Community contract interactions
│       └── __tests__/
│           └── transaction-mocks.ts  # Transaction mocking utilities
└── __tests__/
    └── testnet-setup.ts          # Testnet configuration
docs/
├── CONTRACT_TESTING_GUIDE.md     # Testing guide
├── TEST_COVERAGE_159.md          # Coverage report
└── MOCK_IMPLEMENTATION_GUIDE.md  # Mock implementations
```

## Environment Setup

### Local Development

#### 1. Set Up Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### 2. Install Testing Dependencies
The following are already in package.json:
- `jest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Jest matchers

### 3. Configure Jest (already done)
```bash
# jest.config.js already configured
# jest.coverage.config.js for coverage reporting
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- src/hooks/__tests__/integration.test.ts
npm test -- src/hooks/__tests__/unit.test.ts
npm test -- src/hooks/__tests__/error-handling.test.ts
npm test -- src/hooks/__tests__/post-conditions.test.ts
npm test -- src/hooks/__tests__/additional-hooks.test.ts
```

### Run in Watch Mode
```bash
npm test -- --watch src/hooks/__tests__/
```

### Run with Coverage
```bash
npm test -- --coverage src/hooks/__tests__/
```

### Generate Coverage Report
```bash
npm test -- --coverage src/hooks/__tests__/ --coverageReporters=html
# Open coverage/index.html in browser
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose src/hooks/__tests__/
```

### Run Specific Test Suite
```bash
npm test -- -t "Badge Issuance Integration"
npm test -- -t "Community Creation"
npm test -- -t "Post-Condition Validation"
```

### Run Tests by Pattern
```bash
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=error-handling
npm test -- --testPathPattern=post-conditions
```

## Test Configuration

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ]
}
```

### Coverage Configuration (jest.coverage.config.js)

```javascript
module.exports = {
  ...baseConfig,
  collectCoverageFrom: [
    'src/hooks/**/*.ts',
    'src/lib/contracts/**/*.ts',
    '!**/__tests__/**',
    '!**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## Test Environment Setup

### Mock Setup (test-setup.ts)

The test-setup.ts file provides:

1. **Mock User Sessions**
   - Simulated authentication state
   - User data fixtures
   - Session validation

2. **Test Fixtures**
   - Badge issuance parameters
   - Community creation parameters
   - Transaction responses

3. **Test Data Generators**
   - Random Stacks addresses
   - Transaction IDs
   - Badge/Community IDs

4. **Assertion Utilities**
   - Success state verification
   - Error state verification
   - Loading state verification

### Mock Transaction Setup (transaction-mocks.ts)

The transaction-mocks.ts file provides:

1. **MockTransactionFactory**
   - Successful transactions
   - Pending transactions
   - Failed transactions
   - Post-condition creation

2. **TransactionSequenceSimulator**
   - Success paths
   - Failure paths
   - Custom sequences

3. **Error Factories**
   - User rejection errors
   - Balance errors
   - Contract errors
   - Network errors

## Testnet Integration Setup

### Testnet Configuration (testnet-setup.ts)

```typescript
import { TestnetConnectionManager, testnetConfig } from './src/__tests__/testnet-setup'

// Check testnet readiness
const isReady = await runTestnetReadinessCheck()

// Connect to testnet
const manager = new TestnetConnectionManager()
await manager.connect()

// Verify contracts
const verifier = new ContractDeploymentVerifier(manager)
await verifier.verifyAllContracts()

// Check account balances
await verifier.verifyAccountBalances()
```

### Testnet Configuration

Update `src/__tests__/testnet-setup.ts` with actual contract addresses:

```typescript
contracts: {
  badgeIssuer: {
    address: 'SPxxxxx.badge-issuer-v1',  // Replace with actual
    name: 'badge-issuer-v1'
  },
  // ... other contracts
}
```

## Running Testnet Integration Tests

### Step 1: Verify Testnet Setup
```bash
npm run test:testnet:verify
# or manually:
npm test -- src/__tests__/testnet-setup.ts
```

### Step 2: Run with Testnet Configuration
```bash
NEXT_PUBLIC_STACKS_NETWORK=testnet npm test -- src/hooks/__tests__/
```

### Step 3: Real Contract Integration
```bash
NEXT_PUBLIC_USE_REAL_CONTRACTS=true npm test -- src/hooks/__tests__/
```

## Debugging Tests

### Enable Debug Output
```bash
DEBUG=* npm test -- src/hooks/__tests__/
```

### Run Single Test with Debug
```bash
npm test -- -t "specific test name" --detectOpenHandles
```

### Check for Memory Leaks
```bash
npm test -- --detectOpenHandles --forceExit
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand src/hooks/__tests__/
# Then open chrome://inspect in Chrome
```

## Test Organization

### Test Suites by Category

#### Integration Tests (integration.test.ts)
- Badge issuance workflows
- Community creation workflows
- Badge revocation
- Complex multi-step operations
- **Run:** `npm test -- --testPathPattern=integration`

#### Unit Tests (unit.test.ts)
- Individual hook behavior
- State management
- Mocked responses
- **Run:** `npm test -- --testPathPattern=unit`

#### Error Handling Tests (error-handling.test.ts)
- User rejection scenarios
- Insufficient balance scenarios
- Authorization failures
- Network errors
- **Run:** `npm test -- --testPathPattern=error-handling`

#### Post-Condition Tests (post-conditions.test.ts)
- STX validation
- FT validation
- NFT validation
- Multi-condition validation
- **Run:** `npm test -- --testPathPattern=post-conditions`

#### Additional Hook Tests (additional-hooks.test.ts)
- Transaction status tracking
- Contract events
- Hook composition
- Fee estimation
- **Run:** `npm test -- --testPathPattern=additional-hooks`

## CI/CD Integration

### GitHub Actions Setup

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- src/hooks/__tests__/ --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Tests Not Running

**Issue:** Tests don't run when using npm test
**Solution:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run with fresh cache
npm test -- src/hooks/__tests__/
```

### Mock Issues

**Issue:** Mocks are not being applied
**Solution:**
```bash
# Ensure jest.mock() is at top level of test file
# before any other imports
jest.mock('../path/to/module')

# Or reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Async Timeout Issues

**Issue:** Tests timeout on async operations
**Solution:**
```typescript
// Increase timeout for specific tests
it('should handle long operations', async () => {
  // test code
}, 10000) // 10 second timeout

// Or globally
jest.setTimeout(10000)
```

### Memory Issues

**Issue:** Tests consume too much memory
**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm test

# Or run tests sequentially
npm test -- --runInBand
```

## Performance Optimization

### Run Tests in Parallel (default)
```bash
npm test -- --maxWorkers=4
```

### Run Tests Sequentially
```bash
npm test -- --runInBand
```

### Profile Test Performance
```bash
npm test -- --logHeapUsage --detectOpenHandles
```

## Coverage Thresholds

Current thresholds in jest.config.js:
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

To adjust for specific files:
```javascript
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/__tests__/',
  '/.next/'
]
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- Keep tests focused and isolated

### 2. Setup and Teardown
```typescript
beforeEach(() => {
  // Reset mocks and state
  jest.clearAllMocks()
})

afterEach(() => {
  // Cleanup
  jest.restoreAllMocks()
})
```

### 3. Async Testing
```typescript
// Use async/await
it('should complete async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})

// Or use waitFor
await waitFor(() => {
  expect(result.current.status).toBe('success')
})
```

### 4. Mock Management
```typescript
// Mock at module level
jest.mock('../module', () => ({
  functionName: jest.fn()
}))

// Use mock in tests
it('should call function', () => {
  const { functionName } = require('../module')
  expect(functionName).toHaveBeenCalled()
})
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Stacks Documentation](https://docs.stacks.co/)
- [Testing Best Practices](./CONTRACT_TESTING_GUIDE.md)
- [Mock Implementation Guide](./MOCK_IMPLEMENTATION_GUIDE.md)

## Getting Help

### View Test Output
```bash
npm test -- --verbose
```

### See which tests ran
```bash
npm test -- --listTests
```

### Check test names
```bash
npm test -- --testNamePattern="should" --listTests
```

### View coverage gaps
```bash
npm test -- --coverage --coverageReporters=text
```

## Next Steps

1. **Run tests locally**
   ```bash
   npm test -- src/hooks/__tests__/
   ```

2. **Check coverage**
   ```bash
   npm test -- --coverage src/hooks/__tests__/
   ```

3. **Review test output**
   ```bash
   npm test -- --verbose src/hooks/__tests__/
   ```

4. **Set up in CI/CD** (see CI/CD Integration section)

5. **Extend tests** (see MOCK_IMPLEMENTATION_GUIDE.md for custom mocks)
