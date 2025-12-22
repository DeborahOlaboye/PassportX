# User Activity Feed

## Overview

The User Activity Feed provides real-time tracking of user actions and achievements on the PassportX platform. Built on Chainhook event streams and Socket.IO, it captures and displays badge receipts, community joins, and other blockchain-based activities with real-time updates and comprehensive pagination.

## Architecture

### Components

1. **UserActivityFeed MongoDB Model**: Stores user activity events with TTL-based auto-expiration (90 days)
2. **UserActivityService**: Processes and records all activity types with EventEmitter and Socket.IO integration
3. **Activity API Routes**: REST endpoints for feed retrieval, pagination, and activity management
4. **ActivityFeed Frontend Component**: React component with real-time updates and pagination
5. **useActivityFeed Hook**: Custom React hook for WebSocket connection and event subscription

### Data Flow

```
Chainhook Events
    ↓
Event Handlers (Badge/Community)
    ↓
UserActivityService.record*Event()
    ↓
    ├─ Save to MongoDB
    ├─ Emit EventEmitter event
    └─ Broadcast via Socket.IO
    ↓
Frontend receives activity:new
    ↓
ActivityFeed component updates
```

## Database Schema

### UserActivityFeed Collection

```typescript
interface IUserActivityFeed {
  _id: ObjectId
  userId: string              // User principal (indexed)
  eventType: ActivityEventType // badge_received | badge_revoked | community_joined | community_created | badge_metadata_updated | passport_created
  title: string              // Human-readable title
  description: string        // Event description
  icon?: string             // Emoji or icon representation
  metadata: {
    badgeId?: string
    badgeName?: string
    communityId?: string
    communityName?: string
    level?: number
    category?: string
    revocationType?: 'soft' | 'hard'
    blockHeight?: number
    transactionHash?: string
    contractAddress?: string
  }
  isRead: boolean           // Read status (indexed)
  createdAt: Date          // Event timestamp (indexed, TTL: 90 days)
  updatedAt: Date
}
```

### Indexes

- `{ userId: 1, createdAt: -1 }` - Primary activity retrieval
- `{ userId: 1, isRead: 1, createdAt: -1 }` - Unread activities
- `{ userId: 1, eventType: 1, createdAt: -1 }` - Filtered by event type
- `{ userId: 1, 'metadata.badgeId': 1 }` - Badge-specific activities
- `{ userId: 1, 'metadata.communityId': 1 }` - Community-specific activities
- `{ createdAt: 1 }` - TTL index (auto-delete after 90 days)

## API Endpoints

### Get User Activity Feed
```
GET /api/activity/feed?userId=<userId>&page=1&limit=20&eventType=badge_received&isRead=false
```

**Query Parameters:**
- `userId` (required): User principal
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `eventType` (optional): Filter by event type
- `isRead` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "_id": "...",
        "userId": "...",
        "eventType": "badge_received",
        "title": "Badge Received: Excellence",
        "description": "You received the Excellence badge (Level 3)",
        "icon": "🎖️",
        "metadata": {
          "badgeId": "badge_123",
          "badgeName": "Excellence",
          "level": 3,
          "category": "Achievement"
        },
        "isRead": false,
        "createdAt": "2025-12-22T10:30:00Z",
        "updatedAt": "2025-12-22T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "hasMore": true
    }
  }
}
```

### Get Unread Count
```
GET /api/activity/unread-count?userId=<userId>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Mark Activity as Read
```
POST /api/activity/mark-as-read
Content-Type: application/json

{
  "activityId": "..."
}
```

### Mark All Activities as Read
```
POST /api/activity/mark-all-as-read
Content-Type: application/json

{
  "userId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markedCount": 15
  }
}
```

### Delete Activity
```
DELETE /api/activity/<activityId>
```

### Clear User Activities
```
DELETE /api/activity/user/<userId>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 50
  }
}
```

## Event Types

### Badge Received
```typescript
await userActivityService.recordBadgeReceivedEvent({
  userId: string
  badgeId: string
  badgeName: string
  category: string
  level: number
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: 🎖️
- Title: "Badge Received: [BadgeName]"
- Description: "You received the [BadgeName] badge (Level [X])"

### Badge Revoked
```typescript
await userActivityService.recordBadgeRevokedEvent({
  userId: string
  badgeId: string
  badgeName: string
  revocationType: 'soft' | 'hard'
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: ❌
- Title: "Badge [Revoked/Suspended]: [BadgeName]"
- Description: "Your [BadgeName] badge has been [permanently revoked/temporarily revoked]"

### Community Joined
```typescript
await userActivityService.recordCommunityJoinedEvent({
  userId: string
  communityId: string
  communityName: string
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: 👥
- Title: "Joined Community: [CommunityName]"
- Description: "You joined the [CommunityName] community"

### Community Created
```typescript
await userActivityService.recordCommunityCreatedEvent({
  userId: string
  communityId: string
  communityName: string
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: 🌟
- Title: "Created Community: [CommunityName]"
- Description: "You created the [CommunityName] community"

### Badge Metadata Updated
```typescript
await userActivityService.recordBadgeMetadataUpdatedEvent({
  userId: string
  badgeId: string
  badgeName: string
  updatedFields: string[]
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: ⚙️
- Title: "Badge Updated: [BadgeName]"
- Description: "The [BadgeName] badge was updated (field1, field2, ...)"

### Passport Created
```typescript
await userActivityService.recordPassportCreatedEvent({
  userId: string
  blockHeight: number
  transactionHash: string
  contractAddress: string
})
```

**Display:**
- Icon: 🛂
- Title: "Passport Created"
- Description: "Your PassportX profile was created on the blockchain"

## Frontend Integration

### Using the ActivityFeed Component

```typescript
import { ActivityFeed } from '@/components/activity/ActivityFeed'

export function UserPage({ userId }) {
  return (
    <div className="p-8">
      <ActivityFeed userId={userId} initialPageSize={20} />
    </div>
  )
}
```

### Using the useActivityFeed Hook

```typescript
import { useActivityFeed } from '@/hooks/useActivityFeed'

export function CustomActivityDisplay({ userId }) {
  const { socket, isConnected, error } = useActivityFeed(userId)

  useEffect(() => {
    if (socket) {
      socket.on('activity:new', (data) => {
        console.log('New activity:', data.activity)
      })

      socket.on('activity:marked-read', (data) => {
        console.log('Activity marked as read:', data.activityId)
      })

      return () => {
        socket.off('activity:new')
        socket.off('activity:marked-read')
      }
    }
  }, [socket])

  return (
    <div>
      {isConnected ? <span>Connected</span> : <span>Offline</span>}
      {error && <div className="error">{error}</div>}
    </div>
  )
}
```

## Real-Time Updates via WebSocket

### Socket Events (Client → Server)
```typescript
socket.emit('activity:subscribe', { userId })
```

### Socket Events (Server → Client)

**New Activity**
```typescript
socket.on('activity:new', (data) => {
  // data.timestamp: number
  // data.activity: IUserActivityFeed
})
```

**Activity Marked as Read**
```typescript
socket.on('activity:marked-read', (data) => {
  // data.timestamp: number
  // data.activityId: string
})
```

**All Activities Marked as Read**
```typescript
socket.on('activity:marked-read-all', (data) => {
  // data.timestamp: number
  // data.count: number
})
```

**Activity Deleted**
```typescript
socket.on('activity:deleted', (data) => {
  // data.timestamp: number
  // data.activityId: string
})
```

**Activities Cleared**
```typescript
socket.on('activity:cleared', (data) => {
  // data.timestamp: number
  // data.count: number
})
```

## Backend Integration

### Integrating with Event Handlers

```typescript
import UserActivityService from './services/userActivityService'

const userActivityService = new UserActivityService()

// In badge mint handler
badgeMintHandler.on('badge:minted', async (event) => {
  await userActivityService.recordBadgeReceivedEvent({
    userId: event.userId,
    badgeId: event.badgeId,
    badgeName: event.badgeName,
    category: event.category,
    level: event.level,
    blockHeight: event.blockHeight,
    transactionHash: event.transactionHash,
    contractAddress: event.contractAddress
  })
})

// In badge revocation handler
badgeRevocationCoordinator.on('revocation:processed', async (event) => {
  await userActivityService.recordBadgeRevokedEvent({
    userId: event.userId,
    badgeId: event.badgeId,
    badgeName: event.badgeName,
    revocationType: event.revocationType,
    blockHeight: event.blockHeight,
    transactionHash: event.transactionHash,
    contractAddress: event.contractAddress
  })
})

// In community creation handler
communityCreationService.on('community:created', async (event) => {
  await userActivityService.recordCommunityCreatedEvent({
    userId: event.creatorId,
    communityId: event.communityId,
    communityName: event.communityName,
    blockHeight: event.blockHeight,
    transactionHash: event.transactionHash,
    contractAddress: event.contractAddress
  })
})
```

## Performance Characteristics

- **Write Latency**: <50ms per activity record
- **Read Latency**: <100ms for paginated feed retrieval
- **Real-time Broadcast**: <100ms from event to WebSocket delivery
- **Throughput**: 100+ activities/second per user
- **Storage**: 90-day TTL automatic cleanup

## Pagination

The activity feed supports efficient pagination:

```typescript
// Get first page
const response = await fetch(
  '/api/activity/feed?userId=<userId>&page=1&limit=20'
)

// Get next page
const response = await fetch(
  '/api/activity/feed?userId=<userId>&page=2&limit=20'
)
```

**Pagination Fields:**
- `page`: Current page number
- `limit`: Items per page
- `total`: Total number of activities
- `hasMore`: Boolean indicating if more pages exist

## Filtering

Filter activities by type or read status:

```typescript
// Get unread badge received events
const response = await fetch(
  '/api/activity/feed?userId=<userId>&eventType=badge_received&isRead=false'
)

// Get all revocation events
const response = await fetch(
  '/api/activity/feed?userId=<userId>&eventType=badge_revoked'
)
```

## Data Retention

Activities are automatically deleted after 90 days via MongoDB TTL index. To manually clear activities:

```typescript
// Clear all activities for a user
DELETE /api/activity/user/<userId>

// Delete a specific activity
DELETE /api/activity/<activityId>
```

## Error Handling

### API Errors
- `400`: Missing or invalid parameters
- `503`: Activity service not initialized
- `500`: Database or processing error

### WebSocket Errors
- Connection failures retry with exponential backoff (1s → 5s)
- Offline detection with automatic reconnection
- Event buffering for missed events during disconnection

## Best Practices

1. **Load on Demand**: Fetch activity feed only when user navigates to activity view
2. **Batch Operations**: Use mark-all-as-read for bulk read operations
3. **Filter Early**: Use eventType filter on API to reduce data transfer
4. **Pagination**: Use reasonable page sizes (20-50 items) to balance performance
5. **Caching**: Cache unread count separately for quick badge updates
6. **Cleanup**: Periodically clear old activities for inactive users

## Troubleshooting

### Activities Not Updating in Real-Time

1. Check WebSocket connection: `useActivityFeed` returns `isConnected` status
2. Verify user authentication token in localStorage
3. Check server Socket.IO logs for connection errors
4. Ensure user-specific room subscription: `activity:subscribe` event

### Missing Activities

1. Verify Chainhook events are being processed
2. Check UserActivityService is initialized in server startup
3. Verify MongoDB connection and indexes
4. Check event handler integration (badge/community handlers)

### Performance Issues

1. Add pagination limit parameter to reduce data transfer
2. Use eventType filter to narrow results
3. Check MongoDB indexes are properly created
4. Monitor unread count separately instead of full feed for badge updates

## Related Features

- [Analytics Dashboard](./ANALYTICS_DASHBOARD.md) - Platform-wide metrics
- [Chainhook Event Observer](./CHAINHOOK_EVENT_OBSERVER.md) - Event stream management
- [Real-Time Notifications](./REAL_TIME_NOTIFICATIONS.md) - User notifications
