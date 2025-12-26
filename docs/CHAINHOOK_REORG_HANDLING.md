# Blockchain Reorg Handling Implementation

## Overview

This document describes the comprehensive blockchain reorganization (reorg) handling system implemented in PassportX. The system ensures data consistency and provides real-time updates when blockchain reorganizations occur.

## Architecture

The reorg handling system consists of several integrated components:

### 1. ReorgHandlerService (`backend/src/services/ReorgHandlerService.ts`)
- **Purpose**: Core service for detecting and managing blockchain reorganizations
- **Key Features**:
  - Reorg event detection from Chainhook
  - Rollback operation tracking
  - State management during reorgs
  - Integration with other reorg-aware services

### 2. ReorgAwareDatabase (`backend/src/services/ReorgAwareDatabase.ts`)
- **Purpose**: Database operations with automatic rollback capabilities
- **Key Features**:
  - Reorg-aware CRUD operations
  - Automatic rollback logging
  - State restoration during reorgs
  - Rollback statistics and monitoring

### 3. ReorgAwareCache (`backend/src/services/ReorgAwareCache.ts`)
- **Purpose**: Cache management that handles reorg invalidation
- **Key Features**:
  - Block-height aware caching
  - Automatic invalidation during reorgs
  - Cache performance metrics
  - Memory-efficient cleanup

### 4. ReorgStateManager (`src/services/ReorgStateManager.ts`)
- **Purpose**: Frontend state management for reorg events
- **Key Features**:
  - UI state updates during reorgs
  - Real-time notifications
  - Affected entity tracking
  - State restoration

### 5. ReorgMonitoringService (`src/services/ReorgMonitoringService.ts`)
- **Purpose**: Comprehensive monitoring and alerting for reorg events
- **Key Features**:
  - Metrics collection and analysis
  - Alert generation for critical events
  - Trend analysis and reporting
  - Performance monitoring

## How It Works

### Reorg Detection Flow

1. **Chainhook Event Reception**: Chainhook sends reorg events to the backend
2. **Event Processing**: `ChainhookEventProcessor` receives and validates the event
3. **Reorg Detection**: `ReorgHandlerService` analyzes the event for reorg patterns
4. **Parallel Processing**:
   - Database rollback via `ReorgAwareDatabase`
   - Cache invalidation via `ReorgAwareCache`
   - UI state updates via `ReorgStateManager`
   - Monitoring and alerting via `ReorgMonitoringService`

### Database Rollback Process

```typescript
// Example of reorg-aware database operation
await reorgDatabase.saveWithReorgAwareness(
  BadgeModel,
  { name: 'New Badge', category: 1 },
  blockHeight,
  transactionHash
)

// During reorg, automatic rollback occurs
const reorgEvent = {
  rollbackToBlock: 100,
  affectedTransactions: ['tx1', 'tx2']
}
await reorgDatabase.handleReorg(reorgEvent)
```

### Cache Invalidation Strategy

- Cache entries are tagged with block heights
- During reorg, entries with `blockHeight > rollbackToBlock` are invalidated
- Affected transaction-based invalidation for precision
- Automatic cleanup of invalidated entries

### UI State Management

```typescript
// Frontend integration
const reorgManager = ReorgStateManager.getInstance()

// Subscribe to reorg events
const unsubscribe = reorgManager.subscribe((state) => {
  if (state.isReorgInProgress) {
    // Show reorg indicator
    showReorgNotification()
  }

  // Update affected components
  state.affectedEntities.forEach(entityId => {
    updateComponent(entityId, state.pendingUpdates)
  })
})
```

## Configuration

### Environment Variables

```bash
# Reorg handling configuration
REORG_MAX_ROLLBACK_DEPTH=100
REORG_MONITORING_ENABLED=true
REORG_CACHE_TTL_MS=300000
REORG_DATABASE_LOG_RETENTION_HOURS=24
```

### Service Configuration

```typescript
// ReorgHandlerService configuration
const reorgConfig = {
  maxRollbackOperations: 10000,
  cleanupIntervalMs: 3600000, // 1 hour
  alertThresholds: {
    deepReorgBlocks: 10,
    frequentReorgPerHour: 5,
    largeImpactTransactions: 100
  }
}
```

## API Endpoints

### Reorg Status
```
GET /api/reorg/status
```
Returns current reorg state and statistics.

### Affected Entities
```
GET /api/reorg/affected-entities?block=<blockHeight>
```
Returns entities affected by reorg at specified block.

### Monitoring Metrics
```
GET /api/reorg/metrics
```
Returns comprehensive reorg monitoring metrics.

### Alert History
```
GET /api/reorg/alerts?limit=10
```
Returns recent reorg alerts.

## Monitoring and Alerts

### Alert Types

1. **Deep Reorg**: Rollback depth exceeds threshold
   - Severity: Medium/High/Critical based on depth
   - Action: Monitor network stability

2. **Frequent Reorgs**: Multiple reorgs within time window
   - Severity: High/Critical based on frequency
   - Action: Increase confirmation requirements

3. **Large Impact**: Many transactions affected
   - Severity: High/Critical based on transaction count
   - Action: Review system performance

### Metrics Tracked

- Total reorgs
- Average/max rollback depth
- Reorg frequency (per hour)
- Affected transactions count
- Cache invalidation statistics
- Database rollback operations

## Testing

### Unit Tests
- Individual service functionality
- Reorg event parsing and validation
- Database rollback operations
- Cache invalidation logic

### Integration Tests
- End-to-end reorg scenarios
- Multi-service coordination
- UI state synchronization
- WebSocket event propagation

### Load Testing
- High-frequency reorg simulation
- Large rollback depth handling
- Concurrent reorg processing

## Performance Considerations

### Memory Management
- Automatic cleanup of old rollback operations
- Cache size limits with LRU eviction
- Metrics history truncation

### Database Optimization
- Indexed queries for block height
- Batch rollback operations
- Connection pooling for high load

### Monitoring Overhead
- Asynchronous metrics collection
- Configurable sampling rates
- Alert throttling to prevent spam

## Troubleshooting

### Common Issues

1. **Reorg Not Detected**
   - Check Chainhook configuration
   - Verify event parsing logic
   - Review WebSocket connections

2. **Database Rollback Failures**
   - Check database connectivity
   - Verify transaction isolation levels
   - Review rollback operation logs

3. **UI State Desynchronization**
   - Check WebSocket event delivery
   - Verify state manager subscriptions
   - Review component update logic

4. **Performance Degradation**
   - Monitor cache hit rates
   - Check database query performance
   - Review monitoring overhead

### Debug Commands

```bash
# Check reorg status
curl http://localhost:3001/api/reorg/status

# View recent alerts
curl http://localhost:3001/api/reorg/alerts

# Get monitoring metrics
curl http://localhost:3001/api/reorg/metrics
```

## Future Enhancements

### Planned Features
- Machine learning-based reorg prediction
- Automated confirmation requirement adjustment
- Cross-chain reorg correlation
- Historical reorg analysis dashboard

### Scalability Improvements
- Distributed reorg handling
- Sharded database rollback
- Event-driven cache invalidation
- Real-time monitoring dashboard

## Security Considerations

### Data Integrity
- Cryptographic verification of reorg events
- Secure rollback operation logging
- Access control for reorg management APIs

### Denial of Service Protection
- Rate limiting for reorg processing
- Resource usage monitoring
- Automatic throttling during high load

### Audit Trail
- Comprehensive logging of all reorg operations
- Immutable audit records
- Regulatory compliance support

## Conclusion

The blockchain reorg handling system provides robust protection against data inconsistency during blockchain reorganizations. Through comprehensive monitoring, automatic rollback capabilities, and real-time UI updates, the system ensures that PassportX maintains data integrity and provides a seamless user experience even during network instability.