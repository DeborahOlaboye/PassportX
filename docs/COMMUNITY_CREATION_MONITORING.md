# Community Creation Monitoring (Issue #35)

This document provides comprehensive information about monitoring and syncing community creation events from the blockchain to the PassportX database.

## Overview

The community creation monitoring system automatically tracks new communities created through the `community-manager` contract and:
- Syncs community data to MongoDB
- Sends welcome notifications to admins
- Invalidates community list caches
- Provides real-time updates to the UI

## Architecture

### Components

#### 1. **CommunityCreationHandler** - Event Detection
- Detects `create-community` contract calls from the Chainhook service
- Filters and processes blockchain events
- Creates notification payloads for new communities

**File**: `src/chainhook/handlers/communityCreationHandler.ts`

#### 2. **CommunityCreationService** - Database Sync
- Syncs community events to MongoDB
- Creates community records with blockchain metadata
- Associates owners as community admins
- Handles duplicate detection

**File**: `backend/src/services/communityCreationService.ts`

#### 3. **CommunityCreationNotificationService** - Admin Notifications
- Generates welcome notifications for community creators
- Creates admin confirmation messages
- Validates notification payloads

**File**: `backend/src/services/communityCreationNotificationService.ts`

#### 4. **CommunityCacheService** - Cache Management
- Manages in-memory cache for community lists
- Invalidates caches when new communities are created
- Supports pattern-based cache invalidation

**File**: `backend/src/services/communityCacheService.ts`

#### 5. **Predicate Configuration** - Blockchain Filtering
- Configures Chainhook predicates for community creation events
- Manages webhook URLs and authentication
- Network-aware configuration (mainnet/testnet/devnet)

**File**: `backend/src/config/predicates.ts`

## File Structure

```
src/
├── chainhook/
│   ├── handlers/
│   │   ├── communityCreationHandler.ts      # Event detection
│   │   └── __tests__/
│   │       └── communityCreationHandler.test.ts
│   ├── types/
│   │   └── handlers.ts                       # Type definitions
│   └── utils/
│       └── eventMapper.ts                    # Event mapping utilities

backend/src/
├── config/
│   └── predicates.ts                         # Predicate configuration
├── services/
│   ├── communityCreationService.ts          # Database sync
│   ├── communityCreationNotificationService.ts  # Notifications
│   ├── communityCacheService.ts             # Cache management
│   └── communityCreationIntegration.ts      # Integration layer
├── routes/
│   └── communityCreation.ts                 # API endpoints
├── models/
│   └── Community.ts                         # Updated with metadata
├── types/
│   └── index.ts                             # Type definitions
└── __tests__/
    └── integration/
        └── communityCreation.test.ts        # Integration tests

docs/
└── COMMUNITY_CREATION_MONITORING.md         # This file
```

## Setup & Configuration

### Environment Variables

```env
# Chainhook Configuration
CHAINHOOK_NODE_URL=http://localhost:20456
CHAINHOOK_WEBHOOK_URL=http://localhost:3010/chainhook/events
CHAINHOOK_AUTH_TOKEN=your-auth-token

# Network Configuration
STACKS_NETWORK=devnet

# Community Manager Contract
DEVNET_COMMUNITY_MANAGER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

### Initialization

```typescript
import CommunityCreationService from './services/communityCreationService';
import CommunityCreationNotificationService from './services/communityCreationNotificationService';
import CommunityCacheService from './services/communityCacheService';
import communityCreationRoutes, { initializeCommunityCreationRoutes } from './routes/communityCreation';

const app = express();

// Initialize services
const communityService = new CommunityCreationService();
const notificationService = new CommunityCreationNotificationService();
const cacheService = new CommunityCacheService({ enabled: true, ttl: 300 });

// Register routes
initializeCommunityCreationRoutes(communityService, notificationService, cacheService);
app.use('/api/community-creation', communityCreationRoutes);
```

## API Endpoints

### Webhook Events

**POST** `/api/community-creation/webhook/events`

Receives and processes community creation events from Chainhook.

**Request Body**:
```json
{
  "communityId": "community-1",
  "communityName": "My Community",
  "description": "Community description",
  "ownerAddress": "SP123456789...",
  "createdAtBlockHeight": 100,
  "contractAddress": "SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager",
  "transactionHash": "abc123def456",
  "blockHeight": 100,
  "timestamp": 1234567890
}
```

**Response**:
```json
{
  "success": true,
  "communityId": "507f1f77bcf86cd799439011",
  "message": "Community 'My Community' created successfully",
  "notificationsSent": 1
}
```

### Sync Community

**POST** `/api/community-creation/sync` (requires auth)

Manually sync a community from the blockchain.

**Request Body**:
```json
{
  "blockchainId": "community-1",
  "contractAddress": "SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager",
  "ownerAddress": "SP123456789...",
  "communityName": "My Community",
  "description": "Community description"
}
```

**Response**:
```json
{
  "success": true,
  "communityId": "507f1f77bcf86cd799439011",
  "message": "Community synced successfully"
}
```

### Check Sync Status

**GET** `/api/community-creation/status/:blockchainId?contractAddress=...` (public)

Check if a blockchain community is synced to the database.

**Response**:
```json
{
  "success": true,
  "synced": true,
  "communityId": "507f1f77bcf86cd799439011",
  "communityName": "My Community",
  "slug": "my-community",
  "admin": "SP123456789...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Test Notifications

**POST** `/api/community-creation/notifications/test` (requires auth)

Generate test notification payload.

**Request Body**:
```json
{
  "communityId": "community-1",
  "communityName": "Test Community",
  "ownerAddress": "SP123456789..."
}
```

**Response**:
```json
{
  "success": true,
  "notification": {
    "userId": "SP123456789...",
    "type": "community_created",
    "title": "🎉 Test Community Created",
    "message": "Welcome...",
    "data": { }
  }
}
```

### Cache Statistics

**GET** `/api/community-creation/cache/stats` (requires auth)

Get current cache statistics.

**Response**:
```json
{
  "success": true,
  "cache": {
    "cacheSize": 45,
    "enabled": true,
    "ttl": 300,
    "provider": "memory"
  }
}
```

### Clear Cache

**POST** `/api/community-creation/cache/clear` (requires auth)

Manually clear all community caches.

**Response**:
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

## Event Flow

### Community Creation Workflow

```
1. User creates community on blockchain
   ↓
2. Chainhook detects create-community transaction
   ↓
3. Webhook sends event to /api/community-creation/webhook/events
   ↓
4. CommunityCreationHandler validates and processes event
   ↓
5. CommunityCreationService syncs to MongoDB
   ↓
6. CommunityCreationNotificationService creates welcome notification
   ↓
7. CommunityCacheService invalidates community list caches
   ↓
8. Response sent to webhook with success status
   ↓
9. UI automatically updates community list
```

## Type Definitions

### CommunityCreationEvent

```typescript
interface CommunityCreationEvent {
  communityId: string;
  communityName: string;
  description: string;
  ownerAddress: string;
  createdAtBlockHeight: number;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}
```

### ICommunityMetadata

```typescript
interface ICommunityMetadata {
  blockchainId?: string;
  contractAddress?: string;
  createdAtBlockHeight?: number;
  createdAtTransactionHash?: string;
  createdAtTimestamp?: Date;
}
```

## Usage Examples

### Processing Chainhook Events

```typescript
import { CommunityCreationHandler } from '@/chainhook/handlers/communityCreationHandler';
import { ChainhookEventPayload } from '@/chainhook/types/handlers';

const handler = new CommunityCreationHandler();

const event: ChainhookEventPayload = { /* ... */ };

if (handler.canHandle(event)) {
  const notifications = await handler.handle(event);
  // Send notifications to users...
}
```

### Creating Welcome Notifications

```typescript
import CommunityCreationNotificationService from '@/services/communityCreationNotificationService';
import { CommunityCreationEvent } from '@/chainhook/types/handlers';

const notificationService = new CommunityCreationNotificationService();

const event: CommunityCreationEvent = { /* ... */ };

const notification = notificationService.createWelcomeNotification(event, {
  includeInstructions: true,
  includeDashboardLink: true
});
```

### Invalidating Community Cache

```typescript
import CommunityCacheService from '@/services/communityCacheService';
import { CommunityCreationEvent } from '@/chainhook/types/handlers';

const cacheService = new CommunityCacheService();

const event: CommunityCreationEvent = { /* ... */ };

// Automatically invalidates all related community caches
cacheService.onCommunityCreated(event);
```

## Testing

### Running Unit Tests

```bash
npm run test -- src/chainhook/handlers/__tests__/communityCreationHandler.test.ts
```

### Running Integration Tests

```bash
npm run test -- backend/src/__tests__/integration/communityCreation.test.ts
```

### Test Coverage

- Event handler detection and processing
- Notification creation and validation
- Cache invalidation patterns
- Database sync operations
- Error handling and edge cases

## Monitoring & Debugging

### Logging

All services include detailed logging at multiple levels:

```typescript
this.logger.debug('Processing community creation event', { data });
this.logger.info('Community created from blockchain event', { data });
this.logger.warn('Community already exists in database', { data });
this.logger.error('Failed to process community creation event', error);
```

### Health Check Endpoints

Monitor service health through the Chainhook manager:

```bash
GET /api/chainhook/health
```

### Event Verification

Verify events are being received:

```bash
GET /api/community-creation/status/:blockchainId?contractAddress=...
```

## Troubleshooting

### Community Not Syncing

1. **Check Chainhook Connection**
   - Verify Chainhook node is running and accessible
   - Check `CHAINHOOK_NODE_URL` environment variable
   - Review Chainhook health endpoint

2. **Verify Webhook URL**
   - Ensure `CHAINHOOK_WEBHOOK_URL` is correctly configured
   - Test webhook manually using test endpoint
   - Check server logs for webhook receipt

3. **Validate Event Data**
   - Verify community creation transaction was mined
   - Check blockchain explorer for transaction status
   - Review event payload structure

### Notifications Not Sent

1. **Check Notification Service**
   - Verify notification service is initialized
   - Check user preferences are enabled
   - Review notification delivery logs

2. **Validate Payload**
   - Use test endpoint to verify notification generation
   - Check WebSocket connection is active
   - Verify user is subscribed to notifications

### Cache Issues

1. **Clear Cache Manually**
   ```bash
   POST /api/community-creation/cache/clear
   ```

2. **Check Cache Stats**
   ```bash
   GET /api/community-creation/cache/stats
   ```

3. **Monitor Cache Hit Rate**
   - Enable debug logging
   - Track cache hit/miss ratios
   - Adjust TTL if needed

## Performance Considerations

- **Database Indexes**: Blockchain metadata is indexed for fast lookups
- **Cache TTL**: Configured to 300 seconds (5 minutes) by default
- **Batch Processing**: Events processed in order of receipt
- **Connection Pooling**: Database connections are reused
- **Async Operations**: All I/O operations are non-blocking

## Security

- **Webhook Authentication**: CHAINHOOK_AUTH_TOKEN validates event source
- **Database Validation**: Duplicate community names are rejected
- **User Creation**: Auto-creates user records if needed
- **Admin Assignment**: Only original creator becomes initial admin
- **Access Control**: Protected endpoints require authentication

## Migration Guide

If upgrading from previous versions:

1. **Add Metadata Field**
   ```bash
   npm run migrate:add-community-metadata
   ```

2. **Sync Existing Communities** (optional)
   ```bash
   npm run sync:existing-communities
   ```

3. **Verify Indexes**
   ```bash
   npm run verify:indexes
   ```

## Related Documentation

- [Chainhook Integration](./CHAINHOOK_EVENT_OBSERVER.md)
- [Notification System](./CHAINHOOK_NOTIFICATION_INTEGRATION.md)
- [Community Management](../README.md)
- [Smart Contracts](../contracts/community-manager.clar)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review test files for usage examples
3. Check server logs for error messages
4. Open an issue on GitHub with logs and context
