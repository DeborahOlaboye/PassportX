# Notification System Architecture

## Overview
The PassportX notification system provides real-time, email, and in-app notifications for users and communities.

## Components

### 1. Notification Types
- Badge minted
- Badge revoked
- Community invitation
- Achievement milestone
- System announcements
- Admin notifications

### 2. Delivery Channels
- Real-time (WebSocket)
- Email
- In-app notifications

### 3. Database Models
- Notification
- NotificationPreference
- NotificationTemplate

### 4. API Endpoints
- GET /api/notifications
- POST /api/notifications
- PUT /api/notifications/:id/read
- DELETE /api/notifications/:id
- GET /api/notifications/preferences
- PUT /api/notifications/preferences

### 5. WebSocket Events
- notification:new
- notification:read
- notification:deleted

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ WebSocket/HTTP
┌──────▼──────┐
│   API Layer │
└──────┬──────┘
       │
┌──────▼──────┐
│ Notification│
│   Service   │
└──────┬──────┘
       │
┌──────▼──────┐
│   Database  │
└─────────────┘
```
