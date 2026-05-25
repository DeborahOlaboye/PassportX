# Notification API Documentation

## Overview

The notification system provides a comprehensive API for managing user notifications across multiple channels.

## Base URL

`/api/notifications`

## Endpoints

### GET /api/notifications

Get all notifications for the authenticated user.

**Query Parameters:**

- `status` (optional): Filter by status (unread, read, archived)
- `limit` (optional): Maximum number of notifications to return (default: 50)

**Response:**

```json
[
  {
    "id": "string",
    "userId": "string",
    "type": "badge_minted",
    "title": "string",
    "message": "string",
    "status": "unread",
    "channels": ["in_app"],
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "readAt": null
  }
]
```

### POST /api/notifications

Create a new notification.

**Request Body:**

```json
{
  "type": "badge_minted",
  "title": "New Badge Earned",
  "message": "You earned the Python Beginner badge",
  "channels": ["in_app", "email"],
  "metadata": {}
}
```

**Response:** Returns the created notification object.

### PUT /api/notifications/:id/read

Mark a notification as read.

**Response:** Returns the updated notification object.

### DELETE /api/notifications/:id

Delete a notification.

**Response:** Returns the deleted notification object.

### PUT /api/notifications/read-all

Mark all notifications as read for the authenticated user.

**Response:**

```json
{
  "modifiedCount": 5
}
```

### GET /api/notifications/unread-count

Get the count of unread notifications.

**Response:**

```json
{
  "count": 10
}
```

### GET /api/notifications/preferences

Get user notification preferences.

**Response:**

```json
[
  {
    "userId": "string",
    "type": "badge_minted",
    "channels": ["in_app", "email"],
    "enabled": true
  }
]
```

### PUT /api/notifications/preferences

Update notification preferences.

**Request Body:**

```json
{
  "type": "badge_minted",
  "channels": ["in_app", "email"],
  "enabled": true
}
```

**Response:** Returns the updated preference object.

## Notification Types

- `badge_minted`: A new badge has been minted
- `badge_revoked`: A badge has been revoked
- `community_invitation`: Invitation to join a community
- `achievement_milestone`: Achievement milestone reached
- `system_announcement`: System-wide announcement
- `admin_notification`: Admin-specific notification

## Notification Channels

- `in_app`: Display in the application UI
- `email`: Send via email
- `websocket`: Real-time push notification

## Authentication

All endpoints require authentication. Include the user's authentication token in the request headers.
