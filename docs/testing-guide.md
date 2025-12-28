# Unit Tests Guide

## Running Tests

### Run all unit tests:
```bash
npm run test:unit
```

### Run with coverage report:
```bash
npm run test:coverage
```

### Run specific test file:
```bash
npm test -- tests/unit/walletConnect.connection.test.ts
```

### Watch mode:
```bash
npm run test:watch
```

## Test Organization

Tests are organized by functionality:

- `walletConnect.connection.test.ts` — connection flow tests
- `walletConnect.session.test.ts` — session management tests
- `walletConnect.signing.test.ts` — transaction signing tests
- `walletConnect.errors.test.ts` — error handling tests
- `walletConnect.state.test.ts` — state management tests
- `walletConnect.e2e.test.ts` — end-to-end flow tests

## Coverage Requirements

Current coverage thresholds (set in `jest.coverage.config.js`):

- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

To view detailed coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing New Tests

Follow this pattern:

```typescript
describe('Feature', () => {
  it('should do something', async () => {
    // Arrange
    const mockFn = jest.fn().mockResolvedValue({...});
    
    // Act
    const result = await mockFn();
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

## CI/CD Integration

Tests automatically run on:
- Push to main or develop
- Pull requests targeting main or develop
- Manual trigger via GitHub Actions

See `.github/workflows/unit-tests-walletconnect.yml` for full CI/CD config.
