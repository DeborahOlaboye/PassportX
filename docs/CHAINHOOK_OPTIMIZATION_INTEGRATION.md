# Chainhook Optimization Integration Guide

## Quick Start

### 1. Basic Integration in ChainhookManager

The `ChainhookManager` now includes optimizations out of the box. No changes required for basic setup:

```typescript
import ChainhookManager from '../services/chainhookManager';

const manager = new ChainhookManager({
  serverHost: '0.0.0.0',
  serverPort: 3001,
  nodeUrl: 'http://localhost:20456',
  network: 'devnet'
});

await manager.start();
```

### 2. Enabling Custom Optimizations

```typescript
import ChainhookManager from '../services/chainhookManager';
import ChainhookPredicateOptimizer from '../services/chainhookPredicateOptimizer';
import ChainhookEventDeduplicator from '../services/chainhookEventDeduplicator';

const manager = new ChainhookManager(config);

const optimizer = new ChainhookPredicateOptimizer(logger);
const deduplicator = new ChainhookEventDeduplicator({
  windowSizeMs: 60000,
  maxTrackedEvents: 10000
}, logger);

await manager.start();

// Compile predicates for optimization
manager.getPredicateManager().compileAllPredicateFilters();
```

## Integration by Component

### EventProcessor with Cache and Profiling

```typescript
import ChainhookEventProcessor from '../services/chainhookEventProcessor';

const processor = new ChainhookEventProcessor(logger);

// Process events with automatic caching
const results = await processor.processEvent(chainhookEvent);

// Get performance metrics
const cacheMetrics = processor.getCacheMetrics();
const profileMetrics = processor.getProfilerMetrics();

console.log(`Cache Hit Rate: ${cacheMetrics.hitRate}%`);
console.log(`Avg Latency: ${profileMetrics['processEvent'].avg}ms`);
```

### EventBatcher for Batch Processing

```typescript
import ChainhookEventBatcher from '../services/chainhookEventBatcher';

const batcher = new ChainhookEventBatcher({
  batchSize: 50,
  batchTimeoutMs: 1000
}, logger);

batcher.registerBatchCallback(async (batch) => {
  // Process 50 events at once
  for (const event of batch) {
    await handleEvent(event);
  }
});

// Add events
for (const event of events) {
  batcher.addEvent(event);
}

// Flush remaining events
await batcher.flush();

// Get metrics
const metrics = batcher.getMetrics();
console.log(`Average Batch Size: ${metrics.averageBatchSize}`);
```

### PredicateOptimizer for Filtering

```typescript
import ChainhookPredicateOptimizer from '../services/chainhookPredicateOptimizer';

const optimizer = new ChainhookPredicateOptimizer(logger);

// Compile filter for a predicate
optimizer.compileFilter('pred-1', {
  contractAddress: 'SP...',
  method: 'mint',
  topic: 'badge-mint'
});

// Filter events
const isRelevant = optimizer.filterEvent('pred-1', chainhookEvent);

if (isRelevant) {
  // Process event
}

// Get filtering metrics
const metrics = optimizer.getMetrics();
console.log(`Filtering Rate: ${metrics.filteringRate}%`);
```

### EventDeduplicator for Duplicate Prevention

```typescript
import ChainhookEventDeduplicator from '../services/chainhookEventDeduplicator';

const dedup = new ChainhookEventDeduplicator({
  windowSizeMs: 60000,
  maxTrackedEvents: 10000
}, logger);

// Check for duplicates
if (!dedup.isDuplicate(event)) {
  // Process new event
  await processEvent(event);
}

// Get deduplication metrics
const metrics = dedup.getMetrics();
console.log(`Deduplication Rate: ${metrics.deduplicationRate}%`);
console.log(`Duplicates Detected: ${metrics.duplicatesDetected}`);
```

### OperationRouter for Smart Dispatch

```typescript
import ChainhookOperationRouter from '../services/chainhookOperationRouter';

const router = new ChainhookOperationRouter(logger);

// Register routes with filters
router.registerRoute('badge-mint', handleMintOperation, {
  contractAddress: 'SP...',
  method: 'mint'
});

router.registerRoute('badge-verify', handleVerifyOperation, {
  method: 'verify'
});

// Route operations
const routed = await router.routeOperation(operation);

if (!routed) {
  // Handle unrouted operations
  await handleDefaultOperation(operation);
}

// Get routing metrics
const metrics = router.getMetrics();
console.log(`Routed Operations: ${metrics.routed}/${metrics.totalOperations}`);
```

### PerformanceProfiler for Monitoring

```typescript
import ChainhookPerformanceProfiler from '../services/chainhookPerformanceProfiler';

const profiler = new ChainhookPerformanceProfiler(logger);

// Measure operation
profiler.startMeasurement('process-badge-mint');
await processBadgeMint(event);
profiler.endMeasurement('process-badge-mint');

// Get metrics
const metrics = profiler.getMetric('process-badge-mint');
console.log(`
  Count: ${metrics.count}
  Avg: ${metrics.avg.toFixed(2)}ms
  P95: ${metrics.p95.toFixed(2)}ms
  P99: ${metrics.p99.toFixed(2)}ms
`);

// Print full report
profiler.printReport(10);

// Get snapshot
const snapshot = profiler.getSnapshot();
console.log(`Memory: ${snapshot.systemMetrics.memoryUsage.heapUsed / 1024 / 1024}MB`);
```

## Express Integration

### Adding Performance Monitoring Middleware

```typescript
import express from 'express';
import ChainhookPerformanceMonitoring from '../middleware/chainhookPerformanceMonitoring';

const app = express();

// Create monitoring middleware
const monitoring = new ChainhookPerformanceMonitoring({
  enabled: true,
  trackRequestSize: true,
  trackResponseTime: true,
  trackThroughput: true,
  reportInterval: 60000  // Report every 60 seconds
}, logger);

// Add middleware to all routes
app.use(monitoring.middleware());

// Your routes
app.post('/chainhook/events', (req, res) => {
  // Handle chainhook events
  res.json({ success: true });
});

// Access metrics
app.get('/metrics', (req, res) => {
  res.json(monitoring.getMetrics());
});

app.listen(3001);
```

## Complete Example Setup

```typescript
import express from 'express';
import ChainhookManager from '../services/chainhookManager';
import ChainhookEventDeduplicator from '../services/chainhookEventDeduplicator';
import ChainhookPerformanceMonitoring from '../middleware/chainhookPerformanceMonitoring';

const app = express();
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Initialize services
const manager = new ChainhookManager({
  serverHost: '0.0.0.0',
  serverPort: 3001,
  nodeUrl: process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456',
  network: 'devnet'
}, logger);

const dedup = new ChainhookEventDeduplicator({
  windowSizeMs: 60000,
  maxTrackedEvents: 10000
}, logger);

const monitoring = new ChainhookPerformanceMonitoring({
  enabled: true,
  reportInterval: 30000
}, logger);

// Setup monitoring middleware
app.use(monitoring.middleware());

// Setup event handler
manager.getObserver()?.on('event:process', async (event) => {
  // Filter duplicates
  if (dedup.isDuplicate(event)) {
    logger.debug('Skipping duplicate event');
    return;
  }

  // Process event
  try {
    const processor = manager.getPredicateManager();
    // Handle event...
  } catch (error) {
    logger.error('Error processing event:', error);
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    monitoring: monitoring.getMetrics(),
    deduplication: dedup.getMetrics(),
    profiler: monitoring.getProfiler().getSnapshot()
  };
  res.json(metrics);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: manager.isRunning() ? 'healthy' : 'unhealthy',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Start server
app.listen(3001, () => {
  logger.info('Chainhook server running on port 3001');
});

manager.start().catch(error => {
  logger.error('Failed to start chainhook manager:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await manager.stop();
  monitoring.stop();
  dedup.destroy();
  process.exit(0);
});
```

## Configuration Best Practices

### For Development

```typescript
const devConfig = {
  // Smaller batches for faster response
  batchSize: 10,
  
  // Shorter timeouts for testing
  batchTimeoutMs: 500,
  
  // Smaller cache for dev memory
  cacheSize: 1000,
  cacheTtl: 60000,
  
  // Enable all logging
  logLevel: 'debug',
  
  // More frequent reports
  reportInterval: 10000
};
```

### For Production

```typescript
const prodConfig = {
  // Larger batches for throughput
  batchSize: 100,
  
  // Balanced timeout
  batchTimeoutMs: 1000,
  
  // Large cache for hit rate
  cacheSize: 10000,
  cacheTtl: 600000,
  
  // Less verbose logging
  logLevel: 'info',
  
  // Regular reports
  reportInterval: 60000
};
```

## Performance Tuning

### If cache hit rate is low (< 20%)
1. Increase `cacheSize` parameter
2. Increase `ttlMs` (cache time-to-live)
3. Check event distribution - may have too much variety

### If latency is high (> 100ms)
1. Increase `batchSize` parameter
2. Decrease `batchTimeoutMs` to process faster
3. Check for memory pressure (see monitoring output)
4. Profile handlers for bottlenecks

### If memory usage is high
1. Decrease `cacheSize`
2. Decrease `deduplicationWindowMs`
3. Increase `reportInterval` to reduce overhead

## Monitoring in Production

### Key Metrics to Watch

```typescript
// In your monitoring/alerting system
const alerts = {
  highLatency: metrics.p99Latency > 150,  // Target < 100ms
  lowThroughput: metrics.eventRate < 100,  // Target > 100 events/sec
  highMemory: metrics.heapUsed > 500,      // Alert if > 500MB
  lowCacheHitRate: metrics.cacheHitRate < 20,  // Target 30-50%
  duplicateOverload: metrics.deduplicationRate > 40,  // Check event source
};

// Alert thresholds
if (alerts.highLatency) {
  alerting.send('High latency detected in chainhook processing');
}

if (alerts.lowThroughput) {
  alerting.send('Low throughput in chainhook events');
}
```

## Troubleshooting

### Events Not Processing
1. Check `isDuplicate()` - may be incorrectly filtering
2. Verify predicate filters are compiled
3. Check operation routing configuration

### Memory Leak
1. Monitor cache size with `cache.getSize()`
2. Verify deduplicator cleanup is running
3. Check for event handler memory leaks

### High Latency Spikes
1. Check batch size - may be too large
2. Monitor queue size - may be backing up
3. Check memory pressure - may trigger GC pauses

## See Also

- [CHAINHOOK_OPTIMIZATION.md](./CHAINHOOK_OPTIMIZATION.md) - Detailed optimization guide
- [scripts/chainhook-load-test.ts](../scripts/chainhook-load-test.ts) - Load testing
- [backend/src/services/](../backend/src/services/) - Implementation files
