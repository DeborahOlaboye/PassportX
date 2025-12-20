# Chainhook Event Logging and Monitoring

## Overview

Comprehensive logging and monitoring system for all Chainhook events to track system health, debug issues, and monitor performance metrics.

## Features

- **Event Logging**: Log all incoming Chainhook events with timestamps and processing status
- **Performance Tracking**: Monitor event processing latency and throughput
- **Connection Health**: Track connection uptime and response times to Chainhook node
- **Alert System**: Automatic alerts for anomalies and failed events
- **Dashboard**: REST API endpoints for metrics and monitoring data
- **Event History**: Searchable and queryable event logs

## Architecture

### Components

#### 1. **ChainhookEventLogger** - Event Logging
Logs all incoming events with timestamps, processing status, and metadata.

**File**: `backend/src/services/chainhookEventLogger.ts`

**Methods**:
- `logEvent(options)` - Log incoming event
- `updateEventStatus(eventId, status, options)` - Update event processing status
- `getEventLog(eventId)` - Retrieve specific event
- `getEventsByStatus(status, limit, offset)` - Get events by status
- `getEventsByType(eventType, limit, offset)` - Get events by type
- `getFailedEvents(limit, offset)` - Get failed events
- `getEventCount(status)` - Count events
- `clearOldLogs(daysToKeep)` - Clean up old logs

#### 2. **MetricsTracker** - Performance Metrics
Tracks event processing metrics including latency, throughput, and failure rates.

**File**: `backend/src/services/metricsTracker.ts`

**Methods**:
- `trackEventReceived()` - Increment received event count
- `trackEventProcessed(processingTime)` - Track successful processing
- `trackEventFailed()` - Track failed events
- `getCurrentMetrics()` - Get current metric snapshot
- `saveMetrics(connectionStatus)` - Save metrics to database
- `getMetricsHistory(limit, offset)` - Get historical metrics
- `getAverageProcessingTime(hours)` - Calculate average processing time
- `getTotalEventsReceived(hours)` - Get total received events
- `getFailureRate(hours)` - Calculate failure percentage

#### 3. **HealthMonitor** - Connection Health
Monitors connection health to Chainhook node and tracks uptime.

**File**: `backend/src/services/healthMonitor.ts`

**Methods**:
- `checkHealth(options)` - Perform health check
- `getHealthStatus(nodeUrl)` - Get node health status
- `getAllHealthStatus()` - Get all node statuses
- `getUptime(nodeUrl, hours)` - Calculate uptime percentage
- `getAverageResponseTime(nodeUrl, hours)` - Get average response time
- `startPeriodicHealthCheck(nodeUrl, interval)` - Start periodic checks

#### 4. **AlertService** - Anomaly Detection and Alerts
Creates and manages alerts for anomalies and failures.

**File**: `backend/src/services/alertService.ts`

**Methods**:
- `createAlert(options)` - Create new alert
- `checkPerformanceAnomaly(avgTime, failed, total)` - Detect performance issues
- `checkConnectionAnomaly(isConnected, failedAttempts)` - Detect connection issues
- `resolveAlert(alertId)` - Mark alert as resolved
- `getUnresolvedAlerts(limit)` - Get active alerts
- `getAlertsBySeverity(severity, limit)` - Filter alerts by severity
- `getCriticalAlerts()` - Get critical severity alerts
- `getRecentAlerts(hours, limit)` - Get alerts within time range

#### 5. **Monitoring Middleware** - Automatic Logging
Middleware that automatically logs all Chainhook events.

**File**: `backend/src/middleware/chainhookMonitoring.ts`

### Models

#### ChainhookEventLog
Stores event logs with full payload and processing metadata.

```typescript
{
  eventId: string
  eventType: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  payload: any
  processingTime?: number
  errorMessage?: string
  handler?: string
  receivedAt: Date
  processedAt?: Date
  transactionHash?: string
  blockHeight?: number
}
```

#### EventMetrics
Stores periodic metric snapshots for analysis.

```typescript
{
  timestamp: Date
  eventsReceived: number
  eventsProcessed: number
  eventsFailed: number
  averageProcessingTime: number
  minProcessingTime: number
  maxProcessingTime: number
  connectionStatus: 'connected' | 'disconnected'
  lastConnectionCheck: Date
}
```

#### HealthStatus
Tracks Chainhook node health and connection status.

```typescript
{
  nodeUrl: string
  isConnected: boolean
  lastCheckTime: Date
  uptime: number (percentage)
  failedAttempts: number
  successfulAttempts: number
  averageResponseTime: number
}
```

#### Alert
Stores system alerts for anomalies and failures.

```typescript
{
  type: 'performance' | 'connection' | 'failed_event' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  resolved: boolean
  createdAt: Date
  resolvedAt?: Date
}
```

## API Endpoints

### Health Check
**GET** `/api/monitoring/health`

Returns current health status of all Chainhook nodes.

**Response**:
```json
{
  "status": "healthy",
  "nodes": [
    {
      "nodeUrl": "http://localhost:20456",
      "isConnected": true,
      "lastCheckTime": "2025-12-20T12:00:00Z",
      "uptime": 99.5,
      "averageResponseTime": 150
    }
  ]
}
```

### Metrics
**GET** `/api/monitoring/metrics` (requires auth)

Get current and historical metrics.

**Query Parameters**:
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response**:
```json
{
  "current": {
    "eventsReceived": 1500,
    "eventsProcessed": 1490,
    "eventsFailed": 10,
    "averageProcessingTime": 1250.5,
    "minProcessingTime": 500,
    "maxProcessingTime": 5000,
    "connectionStatus": "connected"
  },
  "history": [...]
}
```

### Average Metrics
**GET** `/api/monitoring/metrics/average` (requires auth)

Get aggregate metrics over time period.

**Query Parameters**:
- `hours` (optional, default: 1)

**Response**:
```json
{
  "hours": 1,
  "averageProcessingTime": "1250.50",
  "totalEventsReceived": 500,
  "failureRate": "2.00%"
}
```

### Events
**GET** `/api/monitoring/events` (requires auth)

Get event logs with optional filtering.

**Query Parameters**:
- `status` (optional: received, processing, completed, failed)
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response**:
```json
{
  "events": [...],
  "total": 5000,
  "limit": 50,
  "offset": 0
}
```

### Failed Events
**GET** `/api/monitoring/events/failed` (requires auth)

Get all failed events.

**Response**:
```json
{
  "events": [...],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### Event Details
**GET** `/api/monitoring/events/:eventId` (requires auth)

Get specific event details.

**Response**:
```json
{
  "eventId": "event_1702897200000_abc123",
  "eventType": "badge_mint",
  "status": "completed",
  "payload": {...},
  "processingTime": 1250,
  "receivedAt": "2025-12-20T12:00:00Z",
  "processedAt": "2025-12-20T12:00:01Z"
}
```

### Alerts
**GET** `/api/monitoring/alerts` (requires auth)

Get system alerts.

**Query Parameters**:
- `severity` (optional: low, medium, high, critical)
- `resolved` (optional: true/false)

**Response**:
```json
{
  "alerts": [
    {
      "_id": "alert_123",
      "type": "performance",
      "severity": "high",
      "message": "High processing time detected",
      "details": {
        "averageProcessingTime": 6000,
        "threshold": 5000
      },
      "resolved": false,
      "createdAt": "2025-12-20T12:00:00Z"
    }
  ],
  "total": 3
}
```

### Critical Alerts
**GET** `/api/monitoring/alerts/critical` (requires auth)

Get critical severity alerts only.

### Resolve Alert
**POST** `/api/monitoring/alerts/:alertId/resolve` (requires auth)

Mark alert as resolved.

**Response**:
```json
{
  "message": "Alert resolved",
  "alert": {...}
}
```

### Dashboard
**GET** `/api/monitoring/dashboard` (requires auth)

Get comprehensive monitoring dashboard data.

**Response**:
```json
{
  "summary": {
    "status": "healthy",
    "eventsReceived": 5000,
    "eventsProcessed": 4980,
    "eventsFailed": 20,
    "failureRate": "0.40",
    "avgProcessingTime": "1250.50",
    "unresolvedAlerts": 2,
    "criticalAlerts": 0
  },
  "recentAlerts": [...],
  "failedEvents": [...],
  "nodeHealth": [...]
}
```

## Setup & Configuration

### Environment Variables

```env
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_HEALTH_CHECK_INTERVAL=30000
CHAINHOOK_ALERT_THRESHOLDS_PERFORMANCE=5000
CHAINHOOK_ALERT_THRESHOLDS_FAILURE_RATE=10
CHAINHOOK_ALERT_THRESHOLDS_CONNECTION_TIMEOUT=30000
CHAINHOOK_LOG_RETENTION_DAYS=30
```

### Initialization

```typescript
import express from 'express'
import ChainhookEventLogger from './services/chainhookEventLogger'
import MetricsTracker from './services/metricsTracker'
import HealthMonitor from './services/healthMonitor'
import AlertService from './services/alertService'
import monitoringRoutes, { initializeMonitoringRoutes } from './routes/monitoring'
import { initializeChainhookMonitoring, chainhookEventMonitoringMiddleware } from './middleware/chainhookMonitoring'

const app = express()

const eventLogger = new ChainhookEventLogger()
const metricsTracker = new MetricsTracker()
const healthMonitor = new HealthMonitor()
const alertService = new AlertService({
  performanceThreshold: 5000,
  failureRateThreshold: 10,
  maxConsecutiveFailures: 5
})

initializeMonitoringRoutes(eventLogger, metricsTracker, healthMonitor, alertService)
initializeChainhookMonitoring(eventLogger, metricsTracker, alertService)

app.use(chainhookEventMonitoringMiddleware)
app.use('/api/monitoring', monitoringRoutes)

const healthCheckInterval = setInterval(() => {
  healthMonitor.checkHealth({
    nodeUrl: process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456'
  })
}, process.env.CHAINHOOK_HEALTH_CHECK_INTERVAL ? parseInt(process.env.CHAINHOOK_HEALTH_CHECK_INTERVAL) : 30000)

const metricsInterval = setInterval(async () => {
  await metricsTracker.saveMetrics('connected')
}, 60000)
```

## Metrics to Monitor

### Real-time Metrics
- **Events received per minute**: Rate of incoming events
- **Event processing time**: P50, P95, P99 latencies
- **Failed event count**: Number of processing failures
- **Connection uptime**: Percentage of time connected to Chainhook
- **Average response time**: Health check response latency

### Aggregated Metrics
- **Total events processed**: Cumulative count
- **Failure rate**: Failed events / total events
- **Average processing time**: Mean latency
- **Min/Max processing times**: Performance range
- **Connection stability**: Consecutive successful checks

## Alert Types and Thresholds

### Performance Alerts
- **Trigger**: Average processing time > 5000ms
- **Severity**: HIGH
- **Action**: Review event handler performance

### Failure Rate Alerts
- **Trigger**: Failed events > 10% of processed
- **Severity**: HIGH
- **Action**: Investigate failure causes

### Connection Alerts
- **Trigger**: 5+ consecutive failed health checks
- **Severity**: CRITICAL
- **Action**: Check Chainhook node connectivity

### Anomaly Alerts
- **Trigger**: Unexpected metric deviations
- **Severity**: MEDIUM to HIGH
- **Action**: Investigate anomaly source

## Usage Examples

### TypeScript

```typescript
import ChainhookEventLogger from './services/chainhookEventLogger'
import MetricsTracker from './services/metricsTracker'

const eventLogger = new ChainhookEventLogger()
const metricsTracker = new MetricsTracker()

async function processEvent(event: any) {
  const startTime = Date.now()

  try {
    metricsTracker.trackEventReceived()

    const logged = await eventLogger.logEvent({
      eventType: event.type,
      status: 'processing',
      payload: event
    })

    const processingTime = Date.now() - startTime
    metricsTracker.trackEventProcessed(processingTime)

    await eventLogger.updateEventStatus(logged!.eventId, 'completed', {
      processingTime
    })
  } catch (error) {
    metricsTracker.trackEventFailed()
    await eventLogger.updateEventStatus(logged!.eventId, 'failed', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
```

## Testing

### Unit Tests
```bash
npm test -- backend/src/__tests__/unit/chainhookLogging.test.ts
```

### Integration Tests
```bash
npm test -- backend/src/__tests__/integration/chainhookMonitoring.test.ts
```

## Performance Considerations

- **Event Log Retention**: Logs older than 30 days are automatically cleaned up
- **Metrics Aggregation**: Metrics are sampled every minute (configurable)
- **Database Indexes**: Optimized indexes on eventId, eventType, timestamp, status
- **Memory Usage**: In-memory metrics buffer limited to last 1000 samples
- **Alert Deduplication**: Prevents duplicate alerts within 5-minute window

## Troubleshooting

### High Processing Time Alerts
- Check handler performance
- Review event payload size
- Monitor database latency
- Scale horizontally if needed

### Connection Lost Alerts
- Verify Chainhook node is running
- Check network connectivity
- Review firewall rules
- Check Chainhook logs for errors

### Memory Issues
- Enable log cleanup: `clearOldLogs()`
- Reduce metrics retention
- Monitor event throughput
- Consider scaling database

### Query Performance
- Use offset/limit for pagination
- Filter by date range
- Add custom database indexes
- Consider archiving old data

## Security Considerations

- All monitoring endpoints require JWT authentication
- Sensitive data (addresses, transaction hashes) is logged
- Consider encrypting event payloads at rest
- Implement role-based access for alert management
- Regular audit of alert resolution

## Future Enhancements

- WebSocket real-time event streaming
- Custom alert templates and rules
- Email/Slack notifications for critical alerts
- Historical trend analysis and forecasting
- Custom dashboard builder
- Event replay functionality
- Distributed tracing integration
