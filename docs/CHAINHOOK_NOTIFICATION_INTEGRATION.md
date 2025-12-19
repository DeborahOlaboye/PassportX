# Chainhook Notification Integration

This document provides comprehensive information about integrating Chainhook events with the PassportX real-time notification system.

## Overview

The Chainhook notification integration allows PassportX to automatically trigger real-time push notifications when blockchain events occur. This includes badge mint events, badge verification events, and community updates.

## Architecture

### Components

1. **Event Handlers** - Specialized handlers for different event types:
   - `BadgeMintHandler` - Handles badge issuance events
   - `BadgeVerificationHandler` - Handles badge verification events
   - `CommunityUpdateHandler` - Handles community update events

2. **Services**:
   - `NotificationService` - Core service for processing events and managing preferences
   - `ChainhookNotificationIntegration` - Orchestrates the notification flow
   - `WebSocketEventEmitter` - Emits real-time events via WebSocket
   - `NotificationDeliveryService` - Stores and manages notifications
   - `NotificationService` - Manages notification preferences

3. **Utilities**:
   - `EventMapper` - Converts Chainhook events to notification payloads
   - `ChainhookErrorHandler` - Handles and logs errors

4. **Contexts**:
   - `NotificationPreferencesContext` - React context for managing user preferences

## File Structure

```
src/
├── chainhook/
│   ├── handlers/
│   │   ├── badgeMintHandler.ts
│   │   ├── badgeVerificationHandler.ts
│   │   └── communityUpdateHandler.ts
│   ├── services/
│   │   ├── notificationService.ts
│   │   ├── chainhookNotificationIntegration.ts
│   │   ├── webSocketEventEmitter.ts
│   │   └── notificationDeliveryService.ts
│   ├── types/
│   │   └── handlers.ts
│   └── utils/
│       ├── eventMapper.ts
│       └── errorHandler.ts
├── contexts/
│   └── NotificationPreferencesContext.tsx
└── components/
    └── NotificationPreferencesPanel.tsx
```

## Usage Guide

### Initializing the Integration

```typescript
import { ChainhookNotificationIntegration } from '@/chainhook/services/chainhookNotificationIntegration'

// Initialize with default handlers
ChainhookNotificationIntegration.initialize()
```

### Processing Chainhook Events

```typescript
import { ChainhookNotificationIntegration } from '@/chainhook/services/chainhookNotificationIntegration'

const chainhookEvent = {
  block_identifier: { index: 100, hash: 'abc123' },
  // ... rest of event payload
}

// Process the event (generates notifications automatically)
await ChainhookNotificationIntegration.processChainhookEvent(chainhookEvent, eventPayload)
```

### Registering Custom Handlers

```typescript
import { ChainhookNotificationIntegration } from '@/chainhook/services/chainhookNotificationIntegration'
import { ChainhookEventHandler } from '@/chainhook/types/handlers'

class CustomEventHandler implements ChainhookEventHandler {
  canHandle(event) { /* ... */ }
  async handle(event) { /* ... */ }
  getEventType() { return 'custom-event' }
}

ChainhookNotificationIntegration.registerHandler('custom-event', new CustomEventHandler())
```

### Managing User Preferences

```typescript
import { useNotificationPreferences } from '@/contexts/NotificationPreferencesContext'

function MySettings() {
  const {
    preferences,
    toggleBadgeNotifications,
    toggleCommunityNotifications,
    resetToDefaults
  } = useNotificationPreferences()

  return (
    <div>
      <button onClick={() => toggleBadgeNotifications(!preferences?.badges.enabled)}>
        Toggle Badge Notifications
      </button>
    </div>
  )
}
```

### Using the Notification Preferences Panel

```typescript
import { NotificationPreferencesPanel } from '@/components/NotificationPreferencesPanel'

function SettingsPage() {
  return (
    <div>
      <NotificationPreferencesPanel />
    </div>
  )
}
```

## Event Types

The integration supports the following notification types:

1. **Badge Events**:
   - `badge_received` - User received a new badge
   - `badge_issued` - Badge was officially issued
   - `badge_verified` - Badge verification completed

2. **Community Events**:
   - `community_update` - Community announcement or update
   - `community_invite` - User invited to community

3. **System Events**:
   - `system_announcement` - System-wide announcement

## User Preferences

Users can configure notifications for:

### Badge Notifications
- Enable/disable all badge notifications
- Enable/disable badge mint notifications
- Enable/disable badge verification notifications

### Community Notifications
- Enable/disable all community notifications
- Enable/disable community update notifications
- Enable/disable community invite notifications

### System Notifications
- Enable/disable all system notifications
- Enable/disable system announcement notifications

## WebSocket Integration

Notifications are delivered via WebSocket in real-time. The notification system uses Socket.io for bidirectional communication.

### WebSocket Events

- `notification:new` - New notification received
- `chainhook:event` - Raw Chainhook event
- `chainhook:broadcast` - Broadcast Chainhook event
- `event:acknowledgment` - Event processing acknowledgment

## Error Handling

The integration includes comprehensive error handling:

```typescript
import { ChainhookErrorHandler, ChainhookErrorType } from '@/chainhook/utils/errorHandler'

// Get error summary
const summary = ChainhookErrorHandler.getErrorSummary()

// Get recent errors
const recentErrors = ChainhookErrorHandler.getRecentErrors(5) // last 5 minutes

// Check if specific error type occurred recently
const hasParseErrors = ChainhookErrorHandler.isRecentError(ChainhookErrorType.PARSE_ERROR)
```

## Notification Delivery

### Manual Notification Delivery

```typescript
import { NotificationDeliveryService } from '@/chainhook/services/notificationDeliveryService'

const notification = {
  userId: 'user-123',
  type: 'badge_received',
  title: 'Badge Received',
  message: 'You received a new badge!',
  data: { /* ... */ }
}

const delivered = await NotificationDeliveryService.deliverNotification(notification)
```

### Retrieving Notifications

```typescript
// Get user's notifications
const notifications = await NotificationDeliveryService.getUserNotifications('user-123', 50, 0)

// Get unread count
const unreadCount = await NotificationDeliveryService.getUnreadCount('user-123')

// Get unread notifications only
const unread = await NotificationDeliveryService.getUnreadNotifications('user-123')

// Get notifications by type
const badges = await NotificationDeliveryService.getNotificationsByType('user-123', 'badge_received')
```

### Managing Notifications

```typescript
// Mark as read
await NotificationDeliveryService.markNotificationAsRead('user-123', 'notif-id')

// Mark all as read
await NotificationDeliveryService.markAllNotificationsAsRead('user-123')

// Delete notification
await NotificationDeliveryService.deleteNotification('user-123', 'notif-id')

// Clear old notifications (older than 7 days)
await NotificationDeliveryService.clearOldNotifications('user-123', 7)
```

## Testing

### Unit Tests

Run unit tests for event handlers:

```bash
npm test tests/unit/chainhook/handlers/
```

### Integration Tests

Run integration tests for the notification flow:

```bash
npm test tests/integration/chainhook/
```

## Environment Variables

```env
# Chainhook Configuration
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_API_KEY=your-api-key
CHAINHOOK_SERVER_HOST=localhost
CHAINHOOK_SERVER_PORT=3010

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_CHAINHOOK_ENABLED=true
NEXT_PUBLIC_CHAINHOOK_DEBUG=false
```

## Best Practices

1. **Always initialize the integration** before processing events
2. **Register custom handlers** before processing related events
3. **Respect user preferences** when delivering notifications
4. **Handle errors gracefully** and log appropriately
5. **Test integration thoroughly** before deployment
6. **Monitor error logs** regularly for issues
7. **Clean up old notifications** periodically to manage storage
8. **Use WebSocket events** for real-time updates instead of polling

## Troubleshooting

### Notifications not being delivered

1. Check if `ChainhookNotificationIntegration` is initialized
2. Verify user preferences are not disabling the notification type
3. Check WebSocket connection status
4. Review error logs with `ChainhookErrorHandler.getErrorLog()`

### Events not being processed

1. Verify event handler is registered for the event type
2. Check if event matches handler's `canHandle()` criteria
3. Review Chainhook event structure
4. Check for parsing errors in error log

### Preferences not being saved

1. Verify API endpoint `/api/notification-preferences` is available
2. Check user authentication token is valid
3. Verify request payload structure
4. Check backend validation logic

## API Endpoints

The integration expects the following API endpoints:

- `GET /api/notification-preferences` - Get user preferences
- `PUT /api/notification-preferences` - Update user preferences
- `POST /api/notification-preferences/reset` - Reset to defaults
- `GET /api/notifications?limit=50&sortBy=newest` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{id}` - Delete notification

## Performance Considerations

1. **Notification batching** - Process multiple events efficiently
2. **Preference caching** - Cache user preferences to reduce API calls
3. **Old notification cleanup** - Periodically remove old notifications
4. **WebSocket optimization** - Use broadcast events sparingly

## Future Enhancements

- [ ] Notification templates system
- [ ] Email notification support
- [ ] Push notification via Firebase Cloud Messaging
- [ ] Notification scheduling
- [ ] Advanced filtering and search
- [ ] Notification groups/threads
- [ ] Analytics and reporting

## References

- [Chainhook Documentation](https://docs.hiro.so/chainhook/overview)
- [Socket.io Documentation](https://socket.io/docs/)
- [PassportX Real-time Notifications](./REAL_TIME_NOTIFICATIONS.md)
