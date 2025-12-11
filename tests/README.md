# PassportX Testing Documentation

## Test Structure

```
tests/
├── unit/           # Unit tests for individual components
├── integration/    # Integration tests for workflows
├── e2e/           # End-to-end tests with Cypress
├── performance/   # Load and performance tests
└── fixtures/      # Test data and mocks
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:coverage
```

### Smart Contract Tests
```bash
npm run test:contracts
```

### E2E Tests
```bash
npm run test:e2e
```

### Performance Tests
```bash
k6 run tests/performance/load-test.js
```

## Coverage Requirements

- Minimum 80% code coverage
- All critical paths must be tested
- Integration tests for complete workflows
- E2E tests for user journeys

## Test Categories

### Smart Contract Tests
- NFT minting and transfer restrictions
- Badge issuance and revocation
- Access control and permissions
- Community management

### API Tests
- Badge CRUD operations
- User passport management
- Community operations
- Authentication and authorization

### Frontend Tests
- Component rendering
- User interactions
- State management
- Error handling

### Integration Tests
- Complete badge issuance flow
- Community setup and management
- Permission enforcement
- Cross-contract interactions

### E2E Tests
- User registration and passport creation
- Badge discovery and viewing
- Community participation
- Mobile responsiveness

## Quality Gates

Tests must pass these criteria:
- ✅ 80%+ code coverage
- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ E2E tests pass on major browsers
- ✅ Performance benchmarks met
- ✅ No linting errors
- ✅ Security scans pass