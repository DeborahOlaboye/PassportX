# Performance Testing

Automated performance testing for PassportX using K6.

## Overview

Performance tests are automatically run in CI/CD to detect performance regressions before they reach production.

## Test Types

### Smoke Test
- **Duration**: 1 minute
- **Users**: 5 concurrent
- **Purpose**: Quick validation of basic performance
- **Runs**: On every push and PR

### Load Test
- **Duration**: 9 minutes
- **Users**: Up to 100 concurrent
- **Purpose**: Validate performance under normal load
- **Runs**: On push to main/develop

### Stress Test
- **Duration**: 16 minutes
- **Users**: Up to 200 concurrent
- **Purpose**: Test system limits and breaking points
- **Runs**: Manual execution only

## Running Tests Locally

```bash
# Smoke test
npm run test:performance:smoke

# Load test
npm run test:performance:load

# Stress test
npm run test:performance:stress

# Generate report
npm run test:performance:report results.json report.html
```

## CI/CD Integration

Performance tests run automatically:
- Smoke tests on every push/PR
- Load tests on push to main/develop
- Daily scheduled runs at 2 AM UTC

## Baseline Metrics

Baseline metrics are stored in `baseline.json`:
- P95 response times
- P99 response times
- Error rates

Tests fail if performance degrades by more than 15%.

## Reports

HTML reports are generated and uploaded as CI artifacts:
- View in GitHub Actions artifacts
- Download for detailed analysis

## Thresholds

Current thresholds:
- P95 < 500ms
- P99 < 1500ms
- Error rate < 10%
- Throughput > 10 req/s
