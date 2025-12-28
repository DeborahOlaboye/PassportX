# Real-time Notifications System

## Overview

The Real-time Notifications System enables PassportX users to receive instant updates about important events through WebSocket connections and traditional REST APIs. The system supports multiple notification types, user preferences, and delivers notifications through both in-app and browser native channels.

## Features

### Core Functionality
- Real-time delivery via WebSocket (Socket.io)
- Badge received notifications
- Community updates and invitations
- System-wide announcements
- Badge issuance tracking
- Badge verification alerts
- Persistent notification storage
- Read/unread status tracking
- Notification preferences per type
- Browser push notifications
- Email notifications (optional)

### User Interface
- Notification bell with unread count badge
- Dropdown notification center
- Filter by all/unread
- Mark individual/all as read
- Delete notifications
- Connection status indicator
- Real-time updates without refresh
- Mobile-responsive design

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Notification │  │ Notification │  │  Notification   │ │
│  │     Bell      │  │    Center    │  │  Preferences    │ │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│          │                  │                    │          │
│          └──────────────────┼────────────────────┘          │
│                             │                               │
│                    ┌────────▼─────────┐                     │
│                    │ Notification     │                     │
│                    │  Context         │                     │
│                    │ (Socket.io-      │                     │
│                    │  client)         │                     │
│                    └────────┬─────────┘                     │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Next.js API      │
                    │   Proxy Routes     │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                          Backend                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Socket.io    │  │ Notification │  │  Notification   │ │
│  │    Server     │  │    Routes    │  │    Service      │ │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│          │                  │                    │          │
│          └──────────────────┼────────────────────┘          │
│                             │                               │
│                    ┌────────▼─────────┐                     │
│                    │   Notification   │                     │
│                    │      Model       │                     │
│                    │    (MongoDB)     │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Backend Structure

```
backend/src/
├── config/
│   └── socket.ts                # Socket.io server configuration
├── models/
│   └── Notification.ts          # Notification database schema
├── routes/
│   └── notifications.ts         # REST API endpoints
├── services/
│   └── notificationService.ts   # Business logic
└── types/
    └── index.ts                 # TypeScript interfaces
```

### Frontend Structure

```
src/
├── app/
│   ├── api/notifications/       # Next.js proxy routes
│   │   ├── route.ts
│   │   ├── unread-count/route.ts
│   │   ├── stats/route.ts
│   │   ├── read-all/route.ts
│   │   └── [id]/route.ts
│   └── settings/notifications/
│       └── page.tsx             # Preferences UI
├── components/notifications/
│   ├── NotificationBell.tsx     # Header bell component
│   └── NotificationCenter.tsx   # Dropdown notification list
└── contexts/
    └── NotificationContext.tsx  # WebSocket & state management
```

## Database Schema

### Notification Model

```typescript
interface INotification {
  userId: string                 // User's Stacks address
  type: NotificationType         // See types below
  title: string                  // Max 200 characters
  message: string                // Max 500 characters
  data?: {                       // Optional metadata
    badgeId?: string
    communityId?: string
    templateId?: string
    issuer?: string
    url?: string
    [key: string]: any
  }
  read: boolean                  // Read status
  createdAt: Date                // Creation timestamp
  expiresAt?: Date               // Optional expiration
}
```

### Notification Types

```typescript
type NotificationType =
  | 'badge_received'      // User received a badge
  | 'badge_issued'        // User issued a badge
  | 'badge_verified'      // Badge verified on blockchain
  | 'community_update'    // Community announcement
  | 'community_invite'    // Invited to community
  | 'system_announcement' // Platform-wide announcement
```

### User Notification Preferences

```typescript
interface INotificationPreferences {
  badgeReceived: boolean         // Default: true
  communityUpdates: boolean      // Default: true
  systemAnnouncements: boolean   // Default: true
  badgeIssued: boolean          // Default: true
  communityInvite: boolean      // Default: true
  badgeVerified: boolean        // Default: true
  emailNotifications: boolean   // Default: false
  pushNotifications: boolean    // Default: true
}
```

### Indexes

```javascript
// Compound indexes for performance
{ userId: 1, createdAt: -1 }
{ userId: 1, read: 1, createdAt: -1 }

// Individual indexes
{ userId: 1 }
{ type: 1 }
{ read: 1 }
{ createdAt: 1 }

// TTL index for automatic expiration
{ expiresAt: 1 }, { expireAfterSeconds: 0 }
```

## API Endpoints

### REST API (Backend)

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
Query Parameters:
  - type: string | string[] (optional)
  - read: boolean (optional)
  - page: number (default: 1)
  - limit: number (default: 20)
  - sortBy: 'newest' | 'oldest' (default: 'newest')

Response: 200 OK
{
  "notifications": [
    {
      "_id": "notification_id",
      "userId": "SP...",
      "type": "badge_received",
      "title": "New Badge Received!",
      "message": "You've earned the Community Builder badge",
      "data": {
        "badgeId": "badge_id",
        "templateId": "template_id",
        "communityId": "community_id"
      },
      "read": false,
      "createdAt": "2024-12-16T10:30:00Z"
    }
  ],
  "total": 42,
  "unreadCount": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "hasMore": true
}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response: 200 OK
{
  "count": 5
}
```

#### Get Statistics
```http
GET /api/notifications/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "badge_received": {
    "total": 15,
    "unread": 3
  },
  "community_update": {
    "total": 10,
    "unread": 2
  }
}
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Notification marked as read",
  "notification": { /* updated notification */ }
}
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "5 notifications marked as read",
  "count": 5
}
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Notification deleted successfully"
}
```

#### Delete Read Notifications
```http
DELETE /api/notifications/read
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "10 read notifications deleted",
  "count": 10
}
```

### Next.js Proxy Routes

All Next.js routes (`/api/notifications/*`) proxy to the backend at `BACKEND_URL`.

## WebSocket Events

### Client → Server

#### Authenticate
```typescript
// On connection (automatic)
socket.auth = {
  token: 'jwt_token_here'
}
```

#### Mark as Read
```typescript
socket.emit('notification:read', notificationId)

// Acknowledgment
socket.on('notification:read:ack', ({ notificationId }) => {
  // Notification marked as read
})
```

#### Mark All as Read
```typescript
socket.emit('notifications:readAll')

// Acknowledgment
socket.on('notifications:readAll:ack', () => {
  // All notifications marked as read
})
```

#### Fetch Notifications
```typescript
socket.emit('notifications:fetch')

// Acknowledgment
socket.on('notifications:fetch:ack', () => {
  // Use REST API to fetch
})
```

### Server → Client

#### New Notification
```typescript
socket.on('notification:new', (notification) => {
  // Handle new notification
  console.log('New notification:', notification)
})
```

#### System Announcement
```typescript
socket.on('notification:system', (announcement) => {
  // Handle system-wide announcement
  console.log('System announcement:', announcement)
})
```

#### Connection Events
```typescript
socket.on('connect', () => {
  console.log('Connected to notification server')
})

socket.on('disconnect', () => {
  console.log('Disconnected from notification server')
})

socket.on('connect_error', (error) => {
  console.error('Connection error:', error)
})
```

## Frontend Integration

### Setup

#### 1. Wrap App with NotificationProvider

```tsx
// src/app/layout.tsx
import { NotificationProvider } from '@/contexts/NotificationContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  )
}
```

#### 2. Add NotificationBell to Navigation

```tsx
// src/components/layout/Header.tsx
import NotificationBell from '@/components/notifications/NotificationBell'

export default function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationBell />
      </nav>
    </header>
  )
}
```

### Using the NotificationContext

```tsx
import { useNotifications } from '@/contexts/NotificationContext'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount
  } = useNotifications()

  // Use notification data and methods
}
```

### Sending Notifications (Backend)

```typescript
import { createNotification } from '../services/notificationService'

// Send to single user
await createNotification(
  userId,
  'badge_received',
  'New Badge Received!',
  'You earned the Community Builder badge',
  {
    badgeId: 'badge_123',
    templateId: 'template_456',
    url: '/badges/badge_123'
  }
)

// Send to multiple users
import { createNotificationForUsers } from '../services/notificationService'

await createNotificationForUsers(
  ['user1', 'user2', 'user3'],
  'community_update',
  'Community Event',
  'Join us for the weekly meetup!'
)

// System announcement
import { createSystemAnnouncement } from '../services/notificationService'

await createSystemAnnouncement(
  'Platform Maintenance',
  'Scheduled maintenance on Sunday at 2 AM UTC',
  { url: '/announcements/maintenance-2024-12-17' },
  new Date('2024-12-17T05:00:00Z') // Expires after event
)
```

## Environment Variables

### Backend (.env)

```env
# WebSocket/API Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key

# MongoDB
MONGODB_URI=mongodb://localhost:27017/passportx
```

### Frontend (.env.local)

```env
# Backend URLs
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Performance Optimizations

### 1. Database Indexes
- Compound indexes on `{ userId, createdAt }` and `{ userId, read, createdAt }`
- Individual indexes on frequently queried fields
- TTL index for automatic cleanup of expired notifications

### 2. WebSocket Rooms
- Users join user-specific rooms: `user:${userId}`
- Targeted emission to specific users
- Reduced broadcast overhead

### 3. Pagination
- Default limit of 20 notifications per request
- Cursor-based pagination support
- Lazy loading in UI

### 4. Caching Strategy
- Unread count cached in context state
- Notifications list cached locally
- Incremental updates via WebSocket

### 5. Connection Management
- Automatic reconnection on disconnect
- Connection status indicator
- Graceful degradation to REST API

## Security

### Authentication
- JWT token required for all operations
- WebSocket authentication via handshake
- Token validation on every request

### Authorization
- Users can only access their own notifications
- User preferences checked before sending
- Admin-only routes for system announcements

### Data Validation
- Input sanitization on all endpoints
- Type checking with TypeScript
- Mongoose schema validation

### Rate Limiting
- Applied to all REST endpoints
- Per-IP limits: 100 requests / 15 minutes
- WebSocket connection limits

## Testing

### Manual Testing Checklist

#### WebSocket Connection
- [ ] Connect with valid token
- [ ] Receive new notifications in real-time
- [ ] Handle disconnection/reconnection
- [ ] Authentication error with invalid token
- [ ] Multiple tabs stay synchronized

#### Notification Creation
- [ ] Create notification for single user
- [ ] Create notification for multiple users
- [ ] System announcement reaches all users
- [ ] Respect user preferences
- [ ] Handle expired notifications

#### Notification Management
- [ ] Fetch notifications with pagination
- [ ] Filter by type and read status
- [ ] Mark individual as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Get unread count

#### UI Components
- [ ] Bell shows correct unread count
- [ ] Badge animates on new notification
- [ ] Dropdown opens/closes properly
- [ ] Filter tabs work correctly
- [ ] Notifications display with icons
- [ ] Timestamps format correctly
- [ ] Mark as read updates UI
- [ ] Delete removes from list
- [ ] Connection status indicator works

#### Preferences
- [ ] Load existing preferences
- [ ] Toggle notification types
- [ ] Save preferences
- [ ] Preferences respected
- [ ] Email toggle works
- [ ] Push toggle works

#### Browser Notifications
- [ ] Request permission on load
- [ ] Show native notification
- [ ] Notification includes title/body
- [ ] Click notification navigates

### Test Notification (Development)

```bash
curl -X POST http://localhost:3001/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "badge_received",
    "title": "Test Notification",
    "message": "This is a test notification",
    "data": { "test": true }
  }'
```

## Troubleshooting

### WebSocket Connection Issues

**Problem**: Cannot connect to WebSocket server

**Solutions**:
- Verify `NEXT_PUBLIC_WS_URL` environment variable
- Check backend server is running on correct port
- Ensure JWT token is valid and not expired
- Check CORS configuration allows frontend origin
- Try both websocket and polling transports

### Notifications Not Appearing

**Problem**: Notifications created but not showing

**Solutions**:
- Check user notification preferences
- Verify notification type matches user settings
- Ensure WebSocket connection is active
- Check browser console for errors
- Verify user ID matches

### Unread Count Incorrect

**Problem**: Badge shows wrong number

**Solutions**:
- Call `refreshUnreadCount()` to sync
- Check database for orphaned notifications
- Verify mark as read operations complete
- Clear browser cache and reload

### Performance Issues

**Problem**: Slow notification loading

**Solutions**:
- Reduce pagination limit
- Check database indexes exist
- Monitor WebSocket connection count
- Review server resource usage
- Implement notification archiving

## Future Enhancements

1. **Notification Grouping**: Group similar notifications (e.g., "5 new badges")
2. **Notification Actions**: Add action buttons (Accept/Decline, View, etc.)
3. **Rich Media**: Support images and videos in notifications
4. **Notification Sound**: Audio alerts for new notifications
5. **Do Not Disturb**: Schedule quiet hours
6. **Priority Levels**: High/medium/low priority notifications
7. **Notification Templates**: Pre-defined templates for common events
8. **Analytics**: Track notification open rates and engagement
9. **A/B Testing**: Test different notification formats
10. **Multi-language Support**: Localized notification content

## Best Practices

### For Developers

1. **Always check preferences** before sending notifications
2. **Use meaningful titles and messages** that clearly explain the event
3. **Include relevant data** in the notification payload for deep linking
4. **Set expiration dates** for time-sensitive notifications
5. **Handle WebSocket disconnections gracefully**
6. **Test with multiple users and scenarios**
7. **Monitor notification volume** to avoid overwhelming users
8. **Respect user's do-not-disturb settings** (when implemented)

### For Users

1. **Configure preferences** to receive only relevant notifications
2. **Enable browser notifications** for important alerts
3. **Regularly mark notifications as read** to keep inbox clean
4. **Delete old notifications** to improve performance
5. **Report issues** with inappropriate or spam notifications

## Related Issues

- **Issue #21**: Implement Real-time Notifications (this feature)

## References

- [Socket.io Documentation](https://socket.io/docs/)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [MongoDB TTL Indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
- [JWT Authentication](https://jwt.io/introduction)
- [React Context API](https://react.dev/reference/react/useContext)
