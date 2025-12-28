# Event-Driven Cache Invalidation Strategy

## Overview

This document describes the comprehensive event-driven cache invalidation strategy implemented for PassportX. The system ensures optimal UI data freshness while minimizing over-fetching through intelligent, selective cache invalidation triggered by Chainhook blockchain events.

## Architecture

### Core Components

1. **EventDrivenCacheInvalidator** - Central invalidation orchestrator
2. **CacheInvalidationMapper** - Maps Chainhook events to cache invalidation actions
3. **CachePerformanceMonitor** - Monitors cache performance and health
4. **CacheInvalidationIntegration** - Integrates with Chainhook event processing
5. **Existing Cache Services** - BadgeCacheService, CommunityCacheService, ChainhookEventCache

### Data Flow

```
Chainhook Event → Event Router → Cache Invalidation Integration
                      ↓
              Cache Invalidation Mapper
                      ↓
            Event-Driven Cache Invalidator
                      ↓
        Selective Cache Invalidation + Warming
                      ↓
            Performance Monitoring
```

## Cache Invalidation Rules

### Badge Minting Events
- **Event Type**: `badge-mint`
- **Cache Keys Invalidated**:
  - `badges:list:all`
  - `badges:recent`
  - `badges:count`
  - `badges:search:*`
  - `badges:category:*`
- **Pattern Invalidations**:
  - `^badges:user:.*:list$`
  - `^badges:user:.*:count$`
  - `^passport:.*$`
  - `^badge:.*$`
- **Cache Warming**: Enabled
- **Priority**: High

### Badge Metadata Updates
- **Event Type**: `badge-metadata-update`
- **Cache Keys Invalidated**:
  - `badges:list:all`
  - `badges:search:*`
- **Pattern Invalidations**:
  - `^badge:.*$`
  - `^badges:category:.*$`
- **Cache Warming**: Disabled
- **Priority**: Medium

### Badge Revocations
- **Event Type**: `badge-revocation`
- **Cache Keys Invalidated**:
  - `badges:list:all`
  - `badges:recent`
  - `badges:count`
- **Pattern Invalidations**:
  - `^badges:user:.*:list$`
  - `^badges:user:.*:count$`
  - `^passport:.*$`
  - `^badge:.*$`
- **Cache Warming**: Enabled
- **Priority**: High

### Community Creation
- **Event Type**: `community-creation`
- **Cache Keys Invalidated**:
  - `communities:list:all`
  - `communities:count`
  - `communities:search:*`
  - `communities:tag:*`
- **Pattern Invalidations**:
  - `^communities:admin:.*:count$`
  - `^community:.*$`
  - `^community:slug:.*$`
- **Cache Warming**: Enabled
- **Priority**: Medium

## Event Mapping Logic

### Chainhook Event Detection

The system detects relevant events by analyzing:

1. **Contract Calls**: Method names like `mint`, `revoke`, `update-metadata`, `create-community`
2. **Contract Events**: Event topics containing keywords like `mint`, `revoke`, `metadata`, `community`
3. **Transaction Operations**: Both successful contract calls and emitted events

### Data Extraction

For each event type, the mapper extracts relevant data:

```typescript
// Badge Mint Event Data
{
  userId: string,
  badgeId: string,
  badgeName: string,
  criteria: string,
  contractAddress: string,
  transactionHash: string,
  blockHeight: number,
  timestamp: number
}
```

## Cache Warming Strategy

### Automatic Cache Warming

After invalidation, the system queues cache warming for high-priority keys:

- **Badge Minting**: Warms user badge count and list caches
- **Badge Revocation**: Warms user badge list cache
- **Community Creation**: Warms community count cache

### Warming Process

1. Invalidation completes
2. High-priority keys are queued for warming
3. Background processor fetches fresh data
4. Cache is repopulated with current data
5. Performance metrics are updated

## Performance Monitoring

### Metrics Tracked

- **Cache Hit Rates**: Overall, per-cache-service, and per-event-type
- **Invalidation Performance**: Average time, success/failure rates
- **Cache Sizes**: Current entries in each cache service
- **Top Invalidated Keys**: Most frequently invalidated cache keys
- **Cache Efficiency**: Combined hit rate and invalidation overhead

### Health Checks

The system performs automatic health checks:

- **Healthy**: Hit rate > 80%, invalidation time < 50ms
- **Warning**: Hit rate 70-80%, invalidation time 50-100ms
- **Critical**: Hit rate < 70%, invalidation time > 100ms

### Recommendations

Based on metrics, the system provides optimization recommendations:

- Increase cache TTL for frequently accessed data
- Implement cache warming for high-traffic keys
- Optimize invalidation patterns
- Review invalidation frequency

## Integration Points

### Chainhook Event Processing

The system integrates with the existing Chainhook event router:

```typescript
// Initialize integration
const integration = new CacheInvalidationIntegration(
  eventRouter,
  invalidationMapper,
  invalidator,
  performanceMonitor
);

await integration.initialize();

// Process events
await integration.processEvent(chainhookEvent);
```

### Existing Cache Services

The invalidator works with existing cache services:

- **BadgeCacheService**: Handles badge-related caching
- **CommunityCacheService**: Handles community-related caching
- **ChainhookEventCache**: Caches processed events
- **Metadata/Revocation Invalidators**: Handle specific invalidation logic

## Configuration

### Default Configuration

```typescript
{
  enablePerformanceMonitoring: true,
  enableDetailedLogging: false,
  batchSize: 10,
  batchTimeout: 5000
}
```

### Cache Service Configuration

```typescript
const badgeCache = new BadgeCacheService({
  enabled: true,
  ttl: 300, // 5 minutes
  provider: 'memory'
});
```

## Usage Examples

### Manual Cache Invalidation

```typescript
// Invalidate cache for a specific event
await integration.invalidateCacheForEventType('badge-mint', {
  userId: 'user123',
  badgeId: 'badge456',
  badgeName: 'Achievement Unlocked'
});
```

### Performance Monitoring

```typescript
// Get current performance metrics
const metrics = integration.getMetrics();
console.log(`Cache hit rate: ${(metrics.overallHitRate * 100).toFixed(1)}%`);

// Get health status
const health = integration.getHealthStatus();
if (health.status === 'critical') {
  console.error('Cache health issues:', health.issues);
}
```

### Custom Invalidation Rules

```typescript
// Add custom invalidation rule
invalidator.addInvalidationRule({
  eventType: 'custom-event',
  cacheKeys: ['custom:list', 'custom:count'],
  patterns: ['^custom:user:.*'],
  priority: 'low',
  warmCache: false,
  description: 'Custom event invalidation'
});
```

## Performance Targets

### Cache Hit Rate
- **Target**: > 90%
- **Current**: Monitored and reported
- **Optimization**: TTL adjustments, cache warming

### Invalidation Performance
- **Target**: < 50ms average
- **Current**: Tracked per invalidation
- **Optimization**: Pattern optimization, batching

### Cache Efficiency
- **Target**: > 85%
- **Formula**: Hit Rate × (1 - Invalidation Overhead)
- **Optimization**: Reduce unnecessary invalidations

## Monitoring and Alerting

### Automatic Monitoring

- Health checks every 5 minutes
- Performance metrics collection
- Automatic recommendations generation

### Manual Monitoring

```typescript
// Generate performance report
const report = performanceMonitor.generatePerformanceReport();
console.log(report);

// Reset metrics
performanceMonitor.resetMetrics();
```

### Alert Conditions

- Cache hit rate drops below 70%
- Average invalidation time exceeds 100ms
- Cache sizes exceed configured limits
- High frequency of invalidations detected

## Testing Strategy

### Unit Tests

- Individual component testing
- Mock Chainhook events
- Cache invalidation verification
- Performance metric validation

### Integration Tests

- End-to-end event processing
- Cache invalidation accuracy
- Performance monitoring validation
- Health check functionality

### Load Testing

- High-frequency event processing
- Large cache sizes
- Concurrent invalidation handling
- Memory usage monitoring

## Troubleshooting

### Common Issues

1. **Low Cache Hit Rate**
   - Check TTL values
   - Review invalidation frequency
   - Implement cache warming

2. **Slow Invalidation**
   - Optimize regex patterns
   - Reduce pattern matching
   - Implement batching

3. **Memory Issues**
   - Set cache size limits
   - Implement LRU eviction
   - Monitor cache sizes

### Debug Logging

Enable detailed logging for troubleshooting:

```typescript
const integration = new CacheInvalidationIntegration(
  eventRouter,
  mapper,
  invalidator,
  monitor,
  { enableDetailedLogging: true }
);
```

## Future Enhancements

### Planned Features

1. **Redis Integration**: Distributed caching support
2. **Advanced Warming**: Predictive cache warming based on patterns
3. **Metrics Dashboard**: Real-time monitoring UI
4. **A/B Testing**: Cache strategy optimization
5. **Machine Learning**: Automated TTL optimization

### Scalability Improvements

1. **Event Batching**: Process multiple events efficiently
2. **Distributed Processing**: Handle high event volumes
3. **Cache Partitioning**: Optimize for different data types
4. **Async Invalidation**: Non-blocking cache operations

## Conclusion

This event-driven cache invalidation strategy provides:

- **Optimal Performance**: High cache hit rates with minimal over-fetching
- **Real-time Freshness**: Immediate UI updates through selective invalidation
- **Comprehensive Monitoring**: Full visibility into cache performance and health
- **Scalable Architecture**: Extensible design for future enhancements
- **Production Ready**: Robust error handling and monitoring

The implementation ensures PassportX maintains excellent user experience with fresh data while optimizing backend performance through intelligent caching.</content>
<parameter name="filePath">/Users/mac/Documents/DEBY/Personal Projects/PassportX/docs/EVENT_DRIVEN_CACHE_INVALIDATION.md