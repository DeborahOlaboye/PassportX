# Badge Revocation Integration Guide

## Quick Start

### 1. Enable Revocation Predicates

Update your `.env` file:

```bash
CHAINHOOK_ENABLE_BADGE_REVOCATION=true
CHAINHOOK_ENABLE_BADGE_REVOCATION_EVENT=false
BADGE_REVOCATION_WEBHOOK_URL=http://localhost:3010/api/badges/webhook/revocation
```

### 2. Initialize Services

```typescript
import BadgeRevocationAuditLog from './services/badgeRevocationAuditLog';
import BadgeRevocationCacheInvalidator from './services/badgeRevocationCacheInvalidator';
import BadgeRevocationNotificationService from './services/badgeRevocationNotificationService';
import BadgeCountUpdateService from './services/badgeCountUpdateService';
import BadgeRevocationCoordinator from './services/badgeRevocationCoordinator';

// Create service instances
const auditLog = new BadgeRevocationAuditLog(logger);
const cacheInvalidator = new BadgeRevocationCacheInvalidator(logger);
const notificationService = new BadgeRevocationNotificationService(logger);
const countUpdateService = new BadgeCountUpdateService(logger);

// Create coordinator
const coordinator = new BadgeRevocationCoordinator(
  auditLog,
  cacheInvalidator,
  notificationService,
  countUpdateService,
  logger
);
```

### 3. Register Notification Handlers

```typescript
// Email notification
notificationService.registerNotificationHandler('email', async (notification) => {
  await emailService.sendBadgeRevocationNotice({
    userId: notification.userId,
    badgeName: notification.badgeName,
    revocationType: notification.revocationType,
    reason: notification.reason
  });
});

// In-app notification
notificationService.registerNotificationHandler('in-app', async (notification) => {
  await inAppNotificationService.create({
    userId: notification.userId,
    type: 'badge_revoked',
    title: `Badge ${notification.revocationType}`,
    message: `Your badge "${notification.badgeName}" has been ${notification.revocationType}`
  });
});

// WebSocket push
notificationService.registerNotificationHandler('push', async (notification) => {
  await websocketService.emit(notification.userId, {
    event: 'badge:revoked',
    data: notification
  });
});
```

### 4. Register Cache Invalidation Handlers

```typescript
cacheInvalidator.registerInvalidationCallback(async (invalidation) => {
  // Clear from Redis
  const cacheKey = `user:${invalidation.userId}:badges:${invalidation.badgeId}`;
  await redis.del(cacheKey);
  
  // Clear user's all badges cache
  await redis.del(`user:${invalidation.userId}:all_badges`);
  
  // Notify CDN to invalidate
  if (process.env.CDN_ENABLED) {
    await cdn.invalidateCache(`/api/user/${invalidation.userId}/badges`);
  }
});
```

### 5. Register Webhook Endpoint

```typescript
import BadgeRevocationWebhookMiddleware from './middleware/badgeRevocationWebhook';

const app = express();

// Create webhook middleware
const revocationWebhook = new BadgeRevocationWebhookMiddleware(
  coordinator,
  {
    enabled: true,
    validateSignature: process.env.NODE_ENV === 'production',
    validateContentType: true,
    validatePayload: true
  },
  logger
);

// Register endpoint
app.post('/api/badges/webhook/revocation', revocationWebhook.middleware());
```

### 6. Register Badge Count Update Handlers

```typescript
countUpdateService.registerUpdateCallback(async (update) => {
  // Update user profile stats
  await userService.updateBadgeStats(update.userId, {
    totalBadges: update.totalBadges,
    activeBadges: update.activeBadges,
    revokedBadges: update.revokedBadges
  });
  
  // Update badges collection
  await badgeCollectionService.updateStats(update.userId, update);
});
```

## Configuration Examples

### Development Setup

```typescript
// In your application initialization
const isDevelopment = process.env.NODE_ENV === 'development';

const coordinator = new BadgeRevocationCoordinator(
  auditLog,
  cacheInvalidator,
  notificationService,
  countUpdateService,
  logger
);

// In development, log all operations
if (isDevelopment) {
  notificationService.on('notification-sent', (notification) => {
    logger.debug('Notification sent:', notification);
  });
  
  cacheInvalidator.on('invalidation', (invalidation) => {
    logger.debug('Cache invalidated:', invalidation);
  });
}
```

### Production Setup

```typescript
// Add monitoring and alerting
const statsReporter = setInterval(() => {
  const stats = coordinator.getDetailedStatistics();
  
  // Report to monitoring service
  monitoring.sendMetrics({
    revocation_success_rate: stats.successRate,
    notification_failure_rate: stats.notificationStats.failureRate,
    cache_hit_rate: stats.cacheInvalidatorStats.hitRate,
    audit_log_size: stats.auditLogStats.recordCount,
    pending_notifications: stats.notificationStats.pendingNotifications
  });
  
  // Alert on failures
  if (Number(stats.successRate.split('%')[0]) < 95) {
    alerting.critical('Badge revocation success rate below 95%');
  }
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGTERM', async () => {
  clearInterval(statsReporter);
  await coordinator.flushPendingOperations();
  coordinator.destroy();
  process.exit(0);
});
```

## Usage Examples

### Single Revocation

```typescript
const event: BadgeRevocationEvent = {
  userId: 'user-123',
  badgeId: 'badge-456',
  badgeName: 'Gold Achievement',
  revocationType: 'soft',
  reason: 'Misconduct policy violation',
  issuerId: 'issuer-789',
  contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
  transactionHash: '0x1234...',
  blockHeight: 100000,
  timestamp: Date.now(),
  previousActive: true
};

const result = await coordinator.processBadgeRevocation(event);

if (result.success) {
  console.log('Revocation processed:', result);
} else {
  console.error('Revocation failed:', result.error);
}
```

### Batch Revocations

```typescript
const events: BadgeRevocationEvent[] = [
  { /* event 1 */ },
  { /* event 2 */ },
  { /* event 3 */ },
];

const results = await coordinator.processBatchRevocations(events);

const successful = results.filter(r => r.success).length;
console.log(`Processed ${successful}/${results.length} revocations`);
```

### Monitoring Revocations

```typescript
// Get comprehensive statistics
const stats = coordinator.getDetailedStatistics();

console.log('Revocation Statistics:');
console.log(`  Processed: ${stats.processedCount}`);
console.log(`  Success Rate: ${stats.successRate}`);
console.log(`  Errors: ${stats.errorCount}`);
console.log(`  Soft Revokes: ${stats.auditLogStats.softRevokePercentage}`);
console.log(`  Hard Revokes: ${stats.auditLogStats.hardRevokePercentage}`);

// Get audit history
const userHistory = auditLog.getRevocationHistory('user-123');
console.log(`User has ${userHistory.length} revocation records`);

// Find most revoked badge
const stats2 = auditLog.getRevocationStatistics();
if (stats2.mostRevokedBadge) {
  console.log(`Most revoked: ${stats2.mostRevokedBadge.name} (${stats2.mostRevokedBadge.count} times)`);
}
```

### Export Audit Log

```typescript
// Export as JSON
const jsonExport = auditLog.exportAuditLog('json');
await fs.writeFile('revocations.json', jsonExport);

// Export as CSV
const csvExport = auditLog.exportAuditLog('csv');
await fs.writeFile('revocations.csv', csvExport);

// Search revocations
const softRevokes = auditLog.searchRevocations({
  revocationType: 'soft',
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
  endDate: Date.now()
});

console.log(`Found ${softRevokes.length} soft revocations in last 30 days`);
```

## Testing

### Unit Test Example

```typescript
describe('Badge Revocation', () => {
  let coordinator: BadgeRevocationCoordinator;

  beforeEach(() => {
    const auditLog = new BadgeRevocationAuditLog();
    const cacheInvalidator = new BadgeRevocationCacheInvalidator();
    const notificationService = new BadgeRevocationNotificationService();
    const countUpdateService = new BadgeCountUpdateService();

    coordinator = new BadgeRevocationCoordinator(
      auditLog,
      cacheInvalidator,
      notificationService,
      countUpdateService
    );
  });

  it('should process revocation successfully', async () => {
    const event: BadgeRevocationEvent = {
      userId: 'user-1',
      badgeId: 'badge-1',
      badgeName: 'Test Badge',
      revocationType: 'soft',
      issuerId: 'issuer-1',
      contractAddress: 'SP101...',
      transactionHash: '0x...',
      blockHeight: 1000,
      timestamp: Date.now(),
      previousActive: true
    };

    const result = await coordinator.processBadgeRevocation(event);

    expect(result.success).toBe(true);
    expect(result.auditLogged).toBe(true);
    expect(result.cacheInvalidated).toBe(true);
  });
});
```

### Load Test Example

```typescript
// Simulate 1000 concurrent revocations
async function loadTest() {
  const events: BadgeRevocationEvent[] = Array.from({ length: 1000 }, (_, i) => ({
    userId: `user-${i}`,
    badgeId: `badge-${Math.floor(i / 10)}`,
    badgeName: 'Test Badge',
    revocationType: i % 2 === 0 ? 'soft' : 'hard',
    issuerId: 'issuer-1',
    contractAddress: 'SP101...',
    transactionHash: `0x${i}`,
    blockHeight: 1000 + i,
    timestamp: Date.now(),
    previousActive: true
  }));

  const startTime = Date.now();
  const results = await coordinator.processBatchRevocations(events);
  const duration = Date.now() - startTime;

  const successful = results.filter(r => r.success).length;
  const throughput = Math.round((successful / duration) * 1000);

  console.log(`Processed ${successful}/1000 revocations in ${duration}ms (${throughput}/sec)`);
}
```

## Troubleshooting

### Revocation Not Processed

1. **Check webhook is receiving events**
   ```bash
   curl -X POST http://localhost:3010/api/badges/webhook/revocation \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","badgeId":"test","revocationType":"soft",...}'
   ```

2. **Check coordinator initialization**
   ```typescript
   console.log('Coordinator initialized:', coordinator instanceof BadgeRevocationCoordinator);
   ```

3. **Check logs for errors**
   ```bash
   grep -i "revocation" app.log | head -50
   ```

### Cache Not Invalidating

1. **Verify callback registration**
   ```typescript
   console.log('Invalidation callbacks:', cacheInvalidator.callbacks.length);
   ```

2. **Check Redis connection**
   ```bash
   redis-cli ping
   ```

3. **Monitor invalidations**
   ```typescript
   cacheInvalidator.on('invalidation', (inv) => {
     console.log('Cache invalidated:', inv);
   });
   ```

### Notifications Not Sent

1. **Check handler registration**
   ```typescript
   console.log('Notification handlers:', notificationService.handlers.size);
   ```

2. **Check notification queue**
   ```typescript
   const pending = notificationService.getPendingNotifications();
   console.log('Pending notifications:', pending.length);
   ```

3. **Check failed notifications**
   ```typescript
   const failed = notificationService.getFailedNotifications();
   failed.forEach(n => console.log('Failed:', n.error));
   ```

## Performance Optimization

### Batch Configuration

```typescript
// Adjust batch sizes based on load
const cacheInvalidator = new BadgeRevocationCacheInvalidator();
cacheInvalidator.BATCH_SIZE = 100; // Increase for high load
cacheInvalidator.BATCH_TIMEOUT = 500; // Decrease for lower latency
```

### Audit Log Cleanup

```typescript
// Archive old audit logs periodically
setInterval(async () => {
  const stats = auditLog.getRevocationStatistics();
  
  if (stats.recordCount > 50000) {
    const oldRecords = auditLog.getRevocationsByDateRange(0, Date.now() - 90*24*60*60*1000);
    await archiveService.archive(oldRecords);
    auditLog.resetAuditLog();
  }
}, 24 * 60 * 60 * 1000); // Daily
```

## References

- [Badge Revocation Documentation](./BADGE_REVOCATION.md)
- [Chainhook Documentation](https://docs.chainhook.ai/)
- [Badge System Architecture](./ARCHITECTURE.md)
