# Notification System Deployment Guide

## Prerequisites

- MongoDB instance
- SMTP server for email notifications
- WebSocket server for real-time notifications

## Environment Configuration

Ensure the following environment variables are set:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@passportx.app

# WebSocket Configuration
NOTIFICATION_WEBSOCKET_PORT=3011
NOTIFICATION_WEBSOCKET_HOST=localhost
ENABLE_NOTIFICATION_WEBSOCKET=true
```

## Database Setup

The notification system uses MongoDB. Ensure your MongoDB connection string is set:

```bash
MONGODB_URI=mongodb://localhost:27017/passportx
```

The following collections will be created automatically:

- `notifications` - Stores notification records
- `notificationpreferences` - Stores user notification preferences

## Service Startup

### Backend Services

1. **Notification Service** - Handles notification CRUD operations
2. **WebSocket Service** - Manages real-time notification delivery
3. **Email Service** - Sends email notifications

### Starting the Backend

```bash
cd backend
npm install
npm start
```

The backend will start on the configured port (default: 3001).

### Starting the WebSocket Server

```bash
cd backend
node websocket-server.js
```

The WebSocket server will start on port 3011 (configurable).

## Verification

### Test Email Notifications

Send a test notification via the API:

```bash
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "badge_minted",
    "title": "Test Notification",
    "message": "This is a test email notification",
    "channels": ["email"]
  }'
```

### Test WebSocket Notifications

Connect to the WebSocket server:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3011', {
  query: { userId: 'test-user-id' },
});

socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

## Monitoring

### Notification Metrics

Monitor the following metrics:

- Notification delivery rate
- Email delivery success rate
- WebSocket connection count
- Average notification delivery time

### Logs

Check logs for:

- Failed email deliveries
- WebSocket connection errors
- Database query performance

## Troubleshooting

### Email Not Sending

1. Verify SMTP credentials
2. Check SMTP server accessibility
3. Review firewall rules
4. Check email spam folder

### WebSocket Not Connecting

1. Verify WebSocket server is running
2. Check port configuration
3. Review browser console for errors
4. Ensure userId is passed correctly

### Notifications Not Saving

1. Check MongoDB connection
2. Verify database permissions
3. Review notification service logs
4. Check for schema validation errors

## Scaling

### Horizontal Scaling

- Use MongoDB replica sets for high availability
- Deploy multiple WebSocket servers with load balancing
- Use message queue (Redis) for notification distribution

### Performance Optimization

- Add database indexes on frequently queried fields
- Implement notification caching
- Use connection pooling for database connections
- Batch email notifications

## Security

- Validate all user inputs
- Sanitize notification content
- Use environment variables for sensitive data
- Implement rate limiting on notification endpoints
- Use HTTPS for all API calls
