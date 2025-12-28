# Chainhook Event Observer Service

Comprehensive documentation for the ChainhookEventObserver service, which manages all blockchain event subscriptions and handles incoming events from the Chainhook node.

## Overview

The ChainhookEventObserver is a centralized service that:
- Manages connections to the Chainhook node
- Receives blockchain events in real-time
- Manages event subscriptions and predicates
- Provides health monitoring and logging
- Handles errors and automatic reconnection

## Architecture

### Core Services

1. **ChainhookEventObserverService** - Main observer that manages the local server and event reception
2. **ChainhookManager** - Unified manager that orchestrates all services
3. **ChainhookSubscriptionManager** - Manages event subscriptions and listeners
4. **ChainhookPredicateManager** - Manages Chainhook predicates
5. **ChainhookLogger** - Comprehensive logging system
6. **ChainhookHealthCheck** - Health monitoring and status tracking

## Installation

The Chainhook client is already included in the project:

```bash
npm install @hirosystems/chainhook-client
```

## Configuration

### Environment Variables

```env
# Chainhook Node Configuration
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_API_KEY=your-api-key
CHAINHOOK_AUTH_TOKEN=your-auth-token

# Server Configuration
CHAINHOOK_SERVER_HOST=localhost
CHAINHOOK_SERVER_PORT=3010

# Network Configuration
STACKS_NETWORK=devnet

# Other Configuration
CHAINHOOK_START_BLOCK=0
CHAINHOOK_MAX_BATCH_SIZE=100
```

### Initialization

```typescript
import ChainhookManager from './services/chainhookManager'

const manager = new ChainhookManager({
  serverHost: 'localhost',
  serverPort: 3010,
  nodeUrl: 'http://localhost:20456',
  nodeApiKey: 'your-api-key',
  network: 'devnet',
  startBlock: 0,
  maxBatchSize: 100,
  logLevel: LogLevel.INFO,
  enableHealthChecks: true,
  healthCheckInterval: 30000
})

await manager.initialize()
await manager.start()
```

## Usage Guide

### Basic Setup in Express Server

```typescript
import ChainhookManager from './services/chainhookManager'
import chainhookRoutes, { initializeChainhookRoutes } from './routes/chainhook'
import { chainhookRequestLoggingMiddleware } from './middleware/chainhookLogging'

const app = express()
const manager = new ChainhookManager(config)

await manager.initialize()
await manager.start()

initializeChainhookRoutes(manager)
app.use('/api/chainhook', chainhookRequestLoggingMiddleware(), chainhookRoutes)
```

### Managing Subscriptions

```typescript
const subscriptionManager = manager.getSubscriptionManager()

// Create a subscription
const subscription = subscriptionManager.createSubscription(
  'Badge Mint Events',
  'badge-mint',
  { contract: 'SP.passport-nft', method: 'mint' },
  { badgeType: 'gold' }
)

// Register event listener
const listener = subscriptionManager.registerListener(
  subscription.id,
  async (event) => {
    console.log('Badge minted:', event)
  }
)

// Get subscriptions
const allSubs = subscriptionManager.getAllSubscriptions()
const badgeSubs = subscriptionManager.getSubscriptionsByEventType('badge-mint')

// Deactivate subscription
subscriptionManager.deactivateSubscription(subscription.id)

// Delete subscription
subscriptionManager.deleteSubscription(subscription.id)
```

### Managing Predicates

```typescript
const predicateManager = manager.getPredicateManager()

// Create a predicate
const predicate = predicateManager.createPredicate(
  'Badge Mint Predicate',
  'stacks-contract-call',
  'mainnet',
  {
    scope: 'contract_call',
    contract_identifier: 'SP.passport-nft',
    method: 'mint'
  },
  {
    http_post: {
      url: 'http://localhost:3010/events',
      authorization_header: 'Bearer YOUR_TOKEN'
    }
  }
)

// Get predicates
const allPredicates = predicateManager.getAllPredicates()
const activePredicates = predicateManager.getActivePredicates()

// Activate/deactivate predicate
predicateManager.deactivatePredicate(predicate.uuid)
predicateManager.activatePredicate(predicate.uuid)

// Delete predicate
predicateManager.deletePredicate(predicate.uuid)
```

### Health Monitoring

```typescript
const healthCheck = manager.getHealthCheck()

// Get health status
const status = healthCheck.getStatus()
// Returns: { status: 'healthy' | 'degraded' | 'unhealthy', ... }

// Check uptime
const uptime = healthCheck.getUptime() // milliseconds
const uptimeFormatted = healthCheck.getUptimeFormatted() // "1d 2h 30m 15s"

// Track metrics
healthCheck.recordEventProcessed()
healthCheck.recordError(new Error('Processing failed'))

const totalEvents = healthCheck.getTotalEventsProcessed()
const totalErrors = healthCheck.getTotalErrorsEncountered()
const errorRate = healthCheck.getErrorRate()
```

### Logging

```typescript
const logger = manager.getLogger()

// Log at different levels
logger.debug('Debug message', { context: 'data' })
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message', new Error('Something failed'))

// Get logs
const recentLogs = logger.getLogs(undefined, 100)
const errorLogs = logger.getErrorLogs(50)
const warningLogs = logger.getWarningLogs(50)

// Search logs
const searchResults = logger.searchLogs('badge')

// Export logs
const logString = logger.exportLogs()

// Statistics
const stats = logger.getLogStatistics()
// Returns: { DEBUG: 10, INFO: 50, WARN: 5, ERROR: 2, total: 67 }
```

## API Endpoints

### Status & Health

- `GET /api/chainhook/status` - Get overall Chainhook status
- `GET /api/chainhook/health` - Get health check status

### Control

- `POST /api/chainhook/start` - Start the observer service
- `POST /api/chainhook/stop` - Stop the observer service

### Subscriptions

- `GET /api/chainhook/subscriptions` - List all subscriptions
- `POST /api/chainhook/subscriptions` - Create new subscription
- `DELETE /api/chainhook/subscriptions/:id` - Delete subscription

### Predicates

- `GET /api/chainhook/predicates` - List all predicates
- `POST /api/chainhook/predicates` - Create new predicate
- `DELETE /api/chainhook/predicates/:uuid` - Delete predicate

### Logging

- `GET /api/chainhook/logs` - Get application logs
- `GET /api/chainhook/logs/errors` - Get error logs only

## Event Flow

```
┌─────────────────────────┐
│  Chainhook Node         │
│  (blockchain events)    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Local Event Server      │
│ (localhost:3010)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Event Queue             │
│ (batching & validation) │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Subscription Manager    │
│ (routing & filtering)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Event Listeners         │
│ (application handlers)  │
└─────────────────────────┘
```

## Error Handling

### Automatic Reconnection

The observer automatically reconnects on failures with exponential backoff:

```
Attempt 1: immediate
Attempt 2: 1 second delay
Attempt 3: 2 second delay
Attempt 4: 4 second delay
Attempt 5: 8 second delay
(Max 5 attempts)
```

### Error Recovery

```typescript
observer.on('reconnect:attempt', (data) => {
  console.log(`Reconnecting (${data.attempt}/${data.maxAttempts})...`)
})

observer.on('reconnect:failed', (data) => {
  console.error('Reconnection failed. Manual intervention required.')
})
```

## Performance Considerations

1. **Event Queue** - Automatically batches events for efficient processing
2. **Memory Management** - Logs and old events are automatically cleaned up
3. **Health Checks** - Run periodically to monitor system status
4. **Connection Pooling** - Reuses connections to the Chainhook node

## Monitoring and Debugging

### Check Service Status

```bash
curl http://localhost:3001/api/chainhook/status
```

### View Health Status

```bash
curl http://localhost:3001/api/chainhook/health
```

### Get Recent Logs

```bash
curl http://localhost:3001/api/chainhook/logs?limit=50
```

### Get Error Logs Only

```bash
curl http://localhost:3001/api/chainhook/logs/errors?limit=20
```

## Troubleshooting

### Issue: Observer not receiving events

1. Verify Chainhook node is running and accessible
2. Check network connectivity: `ping localhost:20456`
3. Verify predicates are properly configured
4. Check observer logs for errors: `GET /api/chainhook/logs/errors`

### Issue: High error rate

1. Check health status: `GET /api/chainhook/health`
2. Review recent logs: `GET /api/chainhook/logs`
3. Verify event queue size is not growing indefinitely
4. Check if predicates need adjustment

### Issue: Memory usage growing

1. Clear old logs: POST to cleanup endpoint
2. Reduce log level to WARN or ERROR
3. Check for memory leaks in event listeners
4. Restart the service if necessary

## Testing

### Run Tests

```bash
npm test backend/src/__tests__/integration/chainhookObserver.test.ts
```

### Manual Testing

```typescript
// Create test subscription
const testSub = subscriptionManager.createSubscription(
  'Test Subscription',
  'test-event',
  {}
)

// Register test listener
subscriptionManager.registerListener(testSub.id, async (event) => {
  console.log('Test event received:', event)
})

// Send test event
await subscriptionManager.dispatchEvent(testSub.id, {
  test: true,
  timestamp: new Date().toISOString()
})
```

## Best Practices

1. **Initialize on Server Startup** - Set up the manager as part of your server initialization
2. **Handle Events Asynchronously** - Use async handlers for event processing
3. **Monitor Health Regularly** - Check health status periodically
4. **Clean Up Resources** - Stop the manager on server shutdown
5. **Use Proper Error Handling** - Catch and log all errors in listeners
6. **Implement Backpressure** - Handle cases where events arrive faster than processing
7. **Version Predicates** - Keep track of predicate versions for debugging

## Integration with Express Server

```typescript
// In server.ts
import ChainhookManager from './services/chainhookManager'

let chainhookManager: ChainhookManager

async function startChainhookObserver() {
  chainhookManager = new ChainhookManager({
    serverHost: process.env.CHAINHOOK_SERVER_HOST || 'localhost',
    serverPort: parseInt(process.env.CHAINHOOK_SERVER_PORT || '3010'),
    nodeUrl: process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456',
    network: (process.env.STACKS_NETWORK || 'devnet') as any,
    enableHealthChecks: true
  })

  await chainhookManager.initialize()
  await chainhookManager.start()

  // Initialize routes
  initializeChainhookRoutes(chainhookManager)
  app.use('/api/chainhook', chainhookRoutes)
}

// Start everything
const startServer = async () => {
  await connectDB()
  await startChainhookObserver()
  
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  if (chainhookManager) {
    await chainhookManager.stop()
  }
  process.exit(0)
})
```

## References

- [Chainhook Documentation](https://docs.hiro.so/chainhook/overview)
- [Stacks Blockchain Documentation](https://docs.stacks.co)
- [Node.js EventEmitter](https://nodejs.org/api/events.html)

## Contributing

When adding new event types or features:

1. Create new handler class implementing `ChainhookEventHandler`
2. Register handler with subscription manager
3. Add tests for new functionality
4. Update documentation with examples
5. Follow existing code style and patterns

## Support

For issues or questions:

1. Check troubleshooting section
2. Review error logs
3. Check health status
4. Open an issue on GitHub with:
   - Error message and logs
   - Steps to reproduce
   - Configuration details
   - System information
