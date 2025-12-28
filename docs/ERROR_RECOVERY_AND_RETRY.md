# Error Recovery and Retry Mechanisms

This document describes the comprehensive error recovery and retry mechanisms implemented for the PassportX Chainhook integration.

## Overview

The error recovery system provides robust handling for:
- Connection failures to Chainhook nodes
- Event processing errors
- Webhook delivery failures
- Network timeouts and rate limiting
- Database errors

## Components

### 1. Retry Queue

The retry queue manages failed operations with intelligent retry logic.

**Models:**
- `RetryQueue`: Stores failed events and webhooks for retry

**Key Features:**
- Exponential backoff with jitter
- Error type classification
- Maximum retry attempts (configurable)
- Status tracking (pending, retrying, succeeded, failed)

**Usage:**
```typescript
import RetryQueueService from './services/RetryQueueService';

// Add item to retry queue
await RetryQueueService.addToQueue({
  itemType: 'event',
  originalPayload: eventData,
  eventType: 'chainhook-event',
  error: errorMessage,
  errorType: 'network'
});

// Process retry queue
const result = await RetryQueueService.processQueue();
```

### 2. Dead Letter Queue

Items that exceed maximum retry attempts are moved to the dead letter queue.

**Models:**
- `DeadLetterQueue`: Stores permanently failed items

**Key Features:**
- Error history tracking
- Recovery mechanism
- Archival of old items
- Error analysis and reporting

**Usage:**
```typescript
import DeadLetterQueueService from './services/DeadLetterQueueService';

// Get statistics
const stats = await DeadLetterQueueService.getStatistics();

// Recover items
const result = await DeadLetterQueueService.recoverItems({
  itemType: 'event',
  limit: 100
});

// Archive old items
const archivedCount = await DeadLetterQueueService.archiveOldItems(30);
```

### 3. Exponential Backoff

Provides progressive retry delays to prevent overwhelming systems.

**Configuration:**
```typescript
{
  initialDelayMs: 1000,      // Start with 1 second
  maxDelayMs: 300000,        // Max 5 minutes
  multiplier: 2,             // Double delay each time
  jitterFactor: 0.1,         // Add 10% randomness
  maxAttempts: 5             // Maximum retry attempts
}
```

**Error-Specific Backoff:**
- `network`: Fast retries (500ms initial)
- `timeout`: Medium delays (2s initial)
- `rate_limit`: Longer delays (5s initial, 10min max)
- `validation`: No retry (non-retryable)

### 4. Circuit Breaker

Prevents cascading failures by temporarily blocking requests to failing services.

**States:**
- `CLOSED`: Normal operation
- `OPEN`: Blocking requests after threshold exceeded
- `HALF_OPEN`: Testing if service recovered

**Configuration:**
```typescript
{
  failureThreshold: 5,           // Open after 5 failures
  successThreshold: 2,           // Close after 2 successes in HALF_OPEN
  timeout: 60000,                // Try HALF_OPEN after 1 minute
  volumeThreshold: 10,           // Minimum calls before evaluation
  errorThresholdPercentage: 50,  // Open if >50% errors
  monitoringPeriod: 60000        // Monitor last 1 minute
}
```

**Usage:**
```typescript
import CircuitBreakerRegistry from './services/CircuitBreakerService';

const breaker = CircuitBreakerRegistry.getBreaker('webhook:https://example.com');

await breaker.execute(async () => {
  // Your operation here
  await sendWebhook(url, payload);
});
```

### 5. Connection Recovery

Handles Chainhook node connection failures with automatic reconnection.

**Features:**
- Health check monitoring
- Automatic reconnection with backoff
- Connection state tracking
- Event callbacks for connection/disconnection

**Usage:**
```typescript
import { ChainhookConnectionRecovery } from './services/ChainhookConnectionRecovery';

const recovery = new ChainhookConnectionRecovery({
  host: 'localhost',
  port: 20456,
  maxReconnectAttempts: 10,
  healthCheckInterval: 30000,
  connectionTimeout: 10000
});

recovery.onConnection(async () => {
  console.log('Connected to Chainhook node');
});

recovery.onDisconnection(async (error) => {
  console.error('Disconnected:', error);
});

await recovery.connect();
```

### 6. Error Monitoring

Tracks error rates, generates alerts, and provides health status.

**Features:**
- Error rate monitoring
- Threshold-based alerting
- Health status checks
- Error statistics

**Alert Thresholds:**
- Error rate > 10/minute: HIGH severity
- Dead letter queue > 100 items: CRITICAL severity
- Circuit breakers open >= 3: CRITICAL severity
- Retry queue > 500 items: MEDIUM severity

**Usage:**
```typescript
import ErrorMonitoringService from './services/ErrorMonitoringService';

// Start monitoring
ErrorMonitoringService.startMonitoring(60000); // Check every minute

// Record error
ErrorMonitoringService.recordError(
  'webhook_failure',
  'Connection timeout',
  'WebhookService'
);

// Get health status
const health = await ErrorMonitoringService.getHealthStatus();
```

### 7. Database Transactions

Ensures data consistency with automatic rollback on errors.

**Usage:**
```typescript
import { withTransaction } from './utils/DatabaseTransaction';

await withTransaction(async (session) => {
  await Model1.create([data1], { session });
  await Model2.findByIdAndUpdate(id, data2, { session });
  // All operations committed together or rolled back on error
});
```

## API Endpoints

### Retry Queue

- `GET /retry/queue/stats` - Get retry queue statistics
- `POST /retry/queue/process` - Manually trigger processing
- `POST /retry/queue/:itemId/retry` - Retry item immediately
- `DELETE /retry/queue/:itemId` - Cancel retry
- `POST /retry/queue/cleanup` - Clean up old items

### Dead Letter Queue

- `GET /retry/dead-letter/stats` - Get statistics
- `POST /retry/dead-letter/recover` - Recover items
- `POST /retry/dead-letter/archive` - Archive old items
- `GET /retry/dead-letter/analysis` - Error analysis
- `GET /retry/dead-letter/manual-review` - Items needing review

### Metrics

- `GET /retry/metrics` - Comprehensive metrics
- `GET /retry/metrics/success-rate` - Success rate over time
- `GET /retry/metrics/error-distribution` - Error distribution
- `GET /retry/metrics/top-failing` - Top failing items
- `GET /retry/metrics/export` - Export metrics as JSON

### Monitoring

- `GET /retry/monitoring/health` - System health status
- `GET /retry/monitoring/alerts` - Recent alerts
- `GET /retry/monitoring/statistics` - Monitoring statistics

### Circuit Breakers

- `GET /retry/circuit-breakers` - All circuit breaker stats
- `POST /retry/circuit-breakers/:name/reset` - Reset circuit breaker

## Error Scenarios

### Chainhook Node Disconnection

**Detection:**
- Health check failures
- Connection timeouts

**Recovery:**
1. Connection marked as disconnected
2. Exponential backoff reconnection scheduled
3. Health checks suspended
4. Reconnection attempts with increasing delays
5. Circuit breaker protects from rapid retries

### Network Timeouts

**Detection:**
- Request timeout errors
- Connection refused errors

**Recovery:**
1. Error classified as 'timeout' or 'network'
2. Added to retry queue with appropriate backoff
3. Fast retry schedule (500ms-2s initial)
4. Circuit breaker monitors failure rate

### Invalid Event Data

**Detection:**
- Validation errors
- Schema mismatches

**Recovery:**
1. Error classified as 'validation'
2. Marked as non-retryable
3. Moved directly to dead letter queue
4. Requires manual review

### Database Errors

**Detection:**
- Connection errors
- Transaction failures

**Recovery:**
1. Automatic transaction rollback
2. Retry with exponential backoff
3. Transaction timeout protection
4. Error monitoring and alerting

### Rate Limiting

**Detection:**
- 429 HTTP status codes
- Rate limit headers

**Recovery:**
1. Error classified as 'rate_limit'
2. Extended backoff delays (5s-10min)
3. Circuit breaker prevents overwhelming API
4. Automatic retry when rate limit resets

## Monitoring and Alerts

### Metrics Tracked

- **Retry Queue:**
  - Total items by status
  - Average retry attempts
  - Oldest pending item
  - Processing throughput

- **Dead Letter Queue:**
  - Total failed items
  - Error distribution
  - Recovery success rate

- **Circuit Breakers:**
  - State changes
  - Failure rates
  - Success rates
  - Rejected calls

- **Error Monitoring:**
  - Error rates
  - Error types
  - Critical errors
  - Service-specific errors

### Alert Conditions

Alerts are generated when:
- Error rate exceeds threshold
- Dead letter queue grows too large
- Multiple circuit breakers open
- Retry queue backlog increases
- Critical errors occur

### Health Status

System health is evaluated as:
- **Healthy:** All systems operating normally
- **Degraded:** Some issues but functioning
- **Unhealthy:** Critical failures detected

## Best Practices

### 1. Set Appropriate Retry Limits

```typescript
// For critical operations
maxAttempts: 5

// For less critical operations
maxAttempts: 3

// For validation errors
maxAttempts: 0  // Don't retry
```

### 2. Use Circuit Breakers for External Services

```typescript
const breaker = CircuitBreakerRegistry.getBreaker('external-api', {
  failureThreshold: 3,
  timeout: 30000
});
```

### 3. Monitor Dead Letter Queue

Regularly review and recover items:
```bash
GET /retry/dead-letter/manual-review
POST /retry/dead-letter/recover
```

### 4. Archive Old Data

Clean up periodically:
```bash
POST /retry/queue/cleanup
POST /retry/dead-letter/archive
```

### 5. Set Up Alerts

Monitor critical metrics:
```typescript
ErrorMonitoringService.addAlertThreshold({
  metric: 'error_rate',
  threshold: 20,
  window: 60000,
  severity: 'critical'
});
```

## Configuration

### Environment Variables

```env
# Retry Configuration
RETRY_MAX_ATTEMPTS=5
RETRY_INITIAL_DELAY_MS=1000
RETRY_MAX_DELAY_MS=300000

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000

# Connection Recovery
CHAINHOOK_HOST=localhost
CHAINHOOK_PORT=20456
CHAINHOOK_HEALTH_CHECK_INTERVAL=30000

# Monitoring
ERROR_MONITORING_INTERVAL=60000
ALERT_ERROR_RATE_THRESHOLD=10
```

## Troubleshooting

### High Retry Queue Size

**Symptoms:** Retry queue growing continuously

**Solutions:**
1. Check circuit breaker states
2. Verify Chainhook node connectivity
3. Review error types in queue
4. Increase processing frequency
5. Check for validation errors

### Circuit Breakers Stuck Open

**Symptoms:** Multiple circuit breakers in OPEN state

**Solutions:**
1. Check underlying service health
2. Review error logs
3. Manually reset if service recovered
4. Adjust failure threshold if too sensitive

### Dead Letter Queue Growing

**Symptoms:** Many items in dead letter queue

**Solutions:**
1. Review error analysis
2. Fix underlying issues
3. Recover items after fixes
4. Archive old items
5. Check for systematic problems

## Testing

Run tests:
```bash
npm test backend/src/__tests__/retry/
```

Individual test suites:
```bash
npm test RetryQueueService.test.ts
npm test CircuitBreaker.test.ts
npm test DeadLetterQueue.test.ts
```

## Maintenance

### Daily
- Monitor health status
- Review critical alerts
- Check dead letter queue

### Weekly
- Review retry metrics
- Analyze error patterns
- Clean up old items

### Monthly
- Export metrics for analysis
- Review alert thresholds
- Update configuration as needed
