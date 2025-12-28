# Analytics Integration Guide

## Quick Start

### 1. Backend Setup

Initialize analytics services in your server startup:

```typescript
import AnalyticsAggregator from './services/analyticsAggregator'
import AnalyticsEventProcessor from './services/analyticsEventProcessor'
import analyticsRoutes, { setAnalyticsAggregator } from './routes/analytics'

const app = express()

// Create aggregator
const analyticsAggregator = new AnalyticsAggregator()
setAnalyticsAggregator(analyticsAggregator)

// Create processor
const analyticsEventProcessor = new AnalyticsEventProcessor(analyticsAggregator)

// Register routes
app.use('/api/analytics', analyticsRoutes)

// Connect event sources
badgeMintHandler.on('badge:minted', (event) => {
  analyticsEventProcessor.processBadgeIssuedEvent({
    badgeId: event.badgeId,
    userId: event.userId,
    badgeName: event.badgeName,
    contractAddress: event.contractAddress,
    blockHeight: event.blockHeight,
    timestamp: event.timestamp
  })
})
```

### 2. Frontend Setup

Import and use the analytics dashboard:

```typescript
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <AnalyticsDashboard />
    </div>
  )
}
```

### 3. Configure Environment

```bash
# .env
STACKS_NETWORK=devnet
ANALYTICS_ENABLED=true
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Event Processing

### Badge Issued Event
Triggered when a new badge is minted:

```typescript
const badgeMintHandler = new BadgeMintHandler()

badgeMintHandler.on('badge:minted', (event) => {
  processor.processBadgeIssuedEvent({
    badgeId: event.badgeId,
    userId: event.userId,
    badgeName: event.badgeName,
    contractAddress: event.contractAddress,
    blockHeight: event.blockHeight,
    timestamp: Date.now()
  })
})
```

### Badge Revoked Event
Triggered when a badge is revoked:

```typescript
const revocationCoordinator = new BadgeRevocationCoordinator(...)

revocationCoordinator.on('revocation:processed', (event) => {
  processor.processBadgeRevokedEvent({
    badgeId: event.badgeId,
    userId: event.userId,
    badgeName: event.badgeName,
    revocationType: event.revocationType,
    blockHeight: event.blockHeight,
    timestamp: Date.now()
  })
})
```

### User Joined Event
Triggered on new user registration:

```typescript
userAuthService.on('user:registered', (user) => {
  processor.processUserJoinedEvent({
    userId: user.userId,
    username: user.username,
    walletAddress: user.walletAddress,
    timestamp: Date.now()
  })
})
```

### Community Created Event
Triggered when a new community is created:

```typescript
communityService.on('community:created', (community) => {
  processor.processCommunityCreatedEvent({
    communityId: community.id,
    communityName: community.name,
    creatorId: community.creatorId,
    blockHeight: community.blockHeight,
    timestamp: Date.now()
  })
})
```

## Frontend Integration

### Using the Analytics Hook

```typescript
import { useAnalyticsUpdates } from '@/hooks/useAnalyticsUpdates'

export function MetricsPanel() {
  const { isConnected, latestUpdate, subscribeToEvent } = useAnalyticsUpdates()

  useEffect(() => {
    // Subscribe to batch updates
    const unsubscribe = subscribeToEvent('batch-update', (data) => {
      console.log('Analytics updated:', data)
      // Refresh your metrics here
    })

    return unsubscribe
  }, [subscribeToEvent])

  return (
    <div>
      Connection status: {isConnected ? '✅ Live' : '❌ Offline'}
    </div>
  )
}
```

### Fetching Specific Metrics

```typescript
import { fetchAnalyticsData, getAnalyticsSnapshot } from '@/lib/api/analytics'

export async function loadMetrics() {
  // Get full analytics data
  const data = await fetchAnalyticsData({
    startDate: new Date('2024-01-01'),
    endDate: new Date(),
    timeRange: '30d'
  })

  console.log('Total badges:', data.metrics.totalBadges)
  console.log('Active users:', data.metrics.activeUsers)
  console.log('Engagement rate:', data.metrics.engagementRate)

  // Get historical snapshots
  const snapshots = await getAnalyticsSnapshot('daily')
  console.log('Daily snapshots:', snapshots)
}
```

## Building Custom Analytics

### Create Custom Analytics Service

```typescript
import BadgeIssuanceAnalytics from './badgeIssuanceAnalytics'

export class CustomAnalytics {
  private issuanceAnalytics: BadgeIssuanceAnalytics

  constructor() {
    this.issuanceAnalytics = new BadgeIssuanceAnalytics()
  }

  async getIssuanceStats() {
    const metrics = await this.issuanceAnalytics.getIssuanceMetrics()
    
    return {
      totalIssued: metrics.totalBadgesIssued,
      avgPerDay: Math.round(
        metrics.totalBadgesIssued / metrics.dailyIssuance.length
      ),
      topCategory: Object.entries(metrics.byCategory)
        .sort((a, b) => b[1] - a[1])[0]
    }
  }
}
```

### Create Custom Dashboard Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { fetchAnalyticsData } from '@/lib/api/analytics'

export function CustomDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const analyticsData = await fetchAnalyticsData({
        startDate: new Date('2024-01-01'),
        endDate: new Date(),
        timeRange: '30d'
      })
      setData(analyticsData)
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!data) return <div>No data</div>

  return (
    <div>
      <h1>Custom Analytics Dashboard</h1>
      <div>Total Badges: {data.metrics.totalBadges}</div>
      <div>Active Users: {data.metrics.activeUsers}</div>
      {/* Your custom visualizations */}
    </div>
  )
}
```

## Recording Snapshots

Record analytics snapshots for historical analysis:

```typescript
import { recordAnalyticsSnapshot } from '@/lib/api/analytics'

// Record daily snapshot
async function recordDailySnapshot() {
  const success = await recordAnalyticsSnapshot('daily')
  console.log('Snapshot recorded:', success)
}

// Set up automatic snapshots (e.g., via cron job)
import cron from 'node-cron'

// Record daily snapshot at midnight
cron.schedule('0 0 * * *', async () => {
  const aggregator = new AnalyticsAggregator()
  await aggregator.recordAnalyticsSnapshot('daily')
  console.log('Daily snapshot recorded')
})

// Record weekly snapshot at Monday 00:00
cron.schedule('0 0 * * 1', async () => {
  const aggregator = new AnalyticsAggregator()
  await aggregator.recordAnalyticsSnapshot('weekly')
  console.log('Weekly snapshot recorded')
})
```

## Monitoring Analytics Health

### Check API Health
```typescript
async function checkAnalyticsHealth() {
  const response = await fetch('/api/analytics/health')
  const { status } = await response.json()
  console.log('Analytics status:', status)
}
```

### Monitor Event Processor
```typescript
const processor = new AnalyticsEventProcessor(aggregator)

// Get processing metrics
const metrics = processor.getMetrics()
console.log('Events processed:', metrics.eventsProcessed)
console.log('Average processing time:', metrics.averageProcessingTime)
console.log('Queue size:', metrics.queueSize)

// Monitor via logs
processor.on('analytics:batch-update', (data) => {
  console.log('Batch processed:', data)
})

processor.on('analytics:batch-error', (error) => {
  console.error('Processing error:', error)
})
```

## Performance Optimization

### Tune Cache TTL
```typescript
// Longer TTL for less frequent updates
class OptimizedAnalytics extends BadgeIssuanceAnalytics {
  private readonly CACHE_TTL_MS = 600000 // 10 minutes
}
```

### Adjust Batch Settings
```typescript
// Process larger batches for higher throughput
export class HighThroughputProcessor extends AnalyticsEventProcessor {
  private readonly QUEUE_THRESHOLD = 100  // Instead of 50
  private readonly BATCH_TIMEOUT_MS = 5000 // Instead of 10000
}
```

### Database Indexing
Ensure these indexes exist on AnalyticsSnapshot:

```typescript
// MongoDB
db.analyticssnapshots.createIndex({ timestamp: -1 })
db.analyticssnapshots.createIndex({ period: 1, timestamp: -1 })
db.analyticssnapshots.createIndex({ "metrics.totalBadgesIssued": -1 })
```

## Troubleshooting

### Issue: Analytics show old data
**Solution**: Invalidate cache and reload
```typescript
aggregator.invalidateCache()
// Data will be recalculated on next request
```

### Issue: Event processor not processing events
**Solution**: Verify event source is emitting
```typescript
// Check if events are being emitted
badgeMintHandler.on('badge:minted', (event) => {
  console.log('Badge minted event received:', event)
  processor.processBadgeIssuedEvent({
    // ... event data
  })
})
```

### Issue: WebSocket not updating dashboard
**Solution**: Check connection and token
```typescript
// In browser console
const socket = io('http://localhost:3001', {
  auth: {
    token: localStorage.getItem('auth_token')
  }
})

socket.on('connect', () => console.log('Connected'))
socket.on('connect_error', (error) => console.error('Error:', error))
socket.on('analytics:update', (data) => console.log('Update:', data))
```

## Best Practices

1. **Process Events Asynchronously**: Don't block main request handler
2. **Batch Events**: Let processor batch 50 events or wait 10 seconds
3. **Monitor Queue Size**: Alert if queue grows beyond 1000 events
4. **Cache Invalidation**: Clear cache when data sources change
5. **Error Handling**: Implement retry logic for failed event processing
6. **Testing**: Test with production-like event volumes
7. **Documentation**: Document custom analytics in code comments
8. **Metrics Export**: Periodically export snapshots for backup

## API Reference

See `/api/analytics` routes in `backend/src/routes/analytics.ts` for complete endpoint documentation.

Frontend API client: `src/lib/api/analytics.ts`
Hooks: `src/hooks/useAnalyticsUpdates.ts`
Components: `src/components/analytics/components/`
