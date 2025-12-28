# Access Control Monitoring

This document describes the comprehensive access control monitoring system for PassportX, built on top of Chainhook predicates.

## Overview

The access control monitoring system provides:
- Real-time detection of permission changes
- Immutable audit trail for all access control events
- Suspicious activity detection and alerting
- WebSocket notifications for UI updates
- Comprehensive API for querying audit logs

## Architecture

### Components

1. **Chainhook Predicates** - Monitor smart contract events
2. **Event Handlers** - Process and route events
3. **Audit Service** - Immutable logging
4. **Security Monitor** - Suspicious activity detection
5. **Notification Service** - Real-time WebSocket updates
6. **API Endpoints** - Query and export audit data

### Contract Address

Access Control Contract: `SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control`

## Monitored Events

### Global Permissions

**Event**: `global-permission-set`
**Webhook**: `/api/access-control/webhook/global-permission`
**Monitors**: Platform-wide permission changes

```typescript
{
  can-create-communities: boolean
  can-issue-badges: boolean
  is-platform-admin: boolean
  suspended: boolean
}
```

### Community Permissions

**Event**: `community-permission-set`
**Webhook**: `/api/access-control/webhook/community-permission`
**Monitors**: Community-specific role assignments

**Roles**:
- `admin` - Full community control
- `issuer` - Can issue badges
- `moderator` - Can moderate content
- `member` - Basic membership

### User Suspensions

**Events**:
- `suspend-user` → `/api/access-control/webhook/user-suspended`
- `unsuspend-user` → `/api/access-control/webhook/user-unsuspended`

**Security Considerations**:
- High severity events
- Triggers security monitoring
- Requires manual review

### Issuer Authorization

**Events**:
- `authorize-issuer` → `/api/access-control/webhook/issuer-authorized`
- `revoke-issuer` → `/api/access-control/webhook/issuer-revoked`

**Contract**: `badge-issuer`

### Community Admin Changes

**Detected via**: `add-community-member` with admin role
**Webhook**: `/api/access-control/webhook/member-role-changed`

**Critical Events**:
- Admin additions (severity: critical)
- Admin removals (severity: critical)
- Ownership transfers (severity: critical)

## Audit Logging

### Audit Log Model

All access control events are stored in an immutable audit log:

```typescript
{
  eventType: AccessControlEventType
  transactionHash: string (unique)
  blockHeight: number
  timestamp: Date
  principal: string // Who performed the action
  targetPrincipal?: string // Who was affected
  contractAddress: string
  method: string
  communityId?: string
  role?: Role
  permission?: GlobalPermission
  previousValue?: any
  newValue?: any
  reason?: string
  suspicious: boolean
  suspiciousReasons?: string[]
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  rawEventData: object
  createdAt: Date
}
```

### Severity Levels

- **Critical**: Admin changes, ownership transfers, platform admin changes
- **High**: User suspensions, global permission changes
- **Medium**: Issuer authorizations, community permissions
- **Low**: Role assignments, permission group changes
- **Info**: General events

### Querying Audit Logs

```bash
# Get all logs for a principal
GET /api/access-control/audit/logs?principal=SP1PRINCIPAL

# Get community history
GET /api/access-control/audit/community/:communityId

# Get user history
GET /api/access-control/audit/user/:principal

# Get suspicious activity
GET /api/access-control/audit/suspicious

# Get statistics
GET /api/access-control/audit/statistics

# Export logs
GET /api/access-control/audit/export?communityId=comm-1
```

## Security Monitoring

### Suspicious Activity Detection

The security monitor automatically detects:

1. **Privilege Escalation**
   - Self-granting admin rights
   - Rapid permission elevations (3+ in 24 hours)
   - Severity: Critical

2. **Mass Suspensions**
   - Multiple user suspensions (3+ per hour)
   - Severity: Critical

3. **Rapid Changes**
   - Excessive permission changes (15+ in 5 minutes)
   - Severity: Medium

4. **Anomalous Patterns**
   - Off-hours critical activity (outside 9AM-5PM)
   - Severity: Low

### Security Alerts

```bash
# Get security alerts
GET /api/access-control/security/alerts

# Filter by severity
GET /api/access-control/security/alerts?severity=critical

# Acknowledge alert
POST /api/access-control/security/alerts/:alertId/acknowledge

# Get security metrics
GET /api/access-control/security/metrics
```

### Alert Structure

```typescript
{
  id: string
  type: 'privilege_escalation' | 'mass_suspension' | 'rapid_changes' | 'unauthorized_access' | 'anomalous_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  principal: string
  affectedUsers?: string[]
  affectedCommunities?: string[]
  evidence: [{
    transactionHash: string
    timestamp: Date
    eventType: AccessControlEventType
  }]
  timestamp: Date
  acknowledged: boolean
}
```

## Real-Time Notifications

### WebSocket Connection

```typescript
import { usePermissionState } from '@/hooks/usePermissionState';

function MyComponent() {
  const {
    notifications,
    securityAlerts,
    isConnected,
    subscribeToUser,
    subscribeToCommunity
  } = usePermissionState({
    userPrincipal: 'SP1PRINCIPAL',
    communityId: 'community-1',
    subscribeToSecurity: true
  });

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.transactionHash}>
          {notification.eventType}: {notification.principal}
        </div>
      ))}
    </div>
  );
}
```

### WebSocket Events

**Client → Server**:
- `subscribe:user` - Subscribe to user's permission changes
- `subscribe:community` - Subscribe to community changes
- `subscribe:security` - Subscribe to security alerts
- `unsubscribe:user`
- `unsubscribe:community`

**Server → Client**:
- `permission:updated` - Any permission change
- `permission:user_updated` - User-specific change
- `permission:community_updated` - Community-specific change
- `permission:critical_change` - High/critical severity
- `permission:security_alert` - User-specific security alert
- `security:alert` - Security channel alert

## Dashboard Component

```tsx
import AccessControlDashboard from '@/components/AccessControlDashboard';

function AdminPage() {
  return (
    <AccessControlDashboard
      userPrincipal={user.stacksAddress}
      showSecurityAlerts={true}
    />
  );
}
```

**Features**:
- Real-time connection status
- Critical notification alerts
- Security alerts display
- Detailed event history
- Filterable by severity
- Expandable event details

## API Reference

### Webhook Endpoints

- `POST /api/access-control/webhook/global-permission`
- `POST /api/access-control/webhook/community-permission`
- `POST /api/access-control/webhook/user-suspended`
- `POST /api/access-control/webhook/user-unsuspended`
- `POST /api/access-control/webhook/issuer-authorized`
- `POST /api/access-control/webhook/issuer-revoked`
- `POST /api/access-control/webhook/permission-group-created`
- `POST /api/access-control/webhook/member-role-changed`
- `POST /api/access-control/webhook/ownership-transferred`

### Audit API

- `GET /api/access-control/audit/logs` - Query audit logs
- `GET /api/access-control/audit/statistics` - Get statistics
- `GET /api/access-control/audit/suspicious` - Get suspicious activity
- `GET /api/access-control/audit/user/:principal` - User history
- `GET /api/access-control/audit/community/:communityId` - Community history
- `GET /api/access-control/audit/export` - Export logs as JSON

### Security API

- `GET /api/access-control/security/alerts` - Get alerts
- `POST /api/access-control/security/alerts/:alertId/acknowledge` - Acknowledge
- `GET /api/access-control/security/metrics` - Get metrics

## Configuration

### Environment Variables

```env
# WebSocket server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3010

# Chainhook webhook base URL
CHAINHOOK_WEBHOOK_URL=http://localhost:3010/api

# Chainhook auth token
CHAINHOOK_AUTH_TOKEN=your_token_here

# Access control contract
ACCESS_CONTROL_CONTRACT=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control

# Community manager contract
COMMUNITY_MANAGER_CONTRACT=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager

# Badge issuer contract
BADGE_ISSUER_CONTRACT=SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer
```

### Starting the Security Monitor

```typescript
import AccessControlSecurityMonitor from './services/AccessControlSecurityMonitor';

// Start monitoring with 1-minute interval
AccessControlSecurityMonitor.startMonitoring(60000);
```

## Best Practices

### 1. Subscribe to Relevant Channels

Only subscribe to WebSocket channels you need:

```typescript
// For admins - subscribe to security alerts
usePermissionState({ subscribeToSecurity: true });

// For community pages - subscribe to specific community
usePermissionState({ communityId: 'community-1' });

// For user dashboard - subscribe to own principal
usePermissionState({ userPrincipal: user.stacksAddress });
```

### 2. Regular Audit Reviews

- Review suspicious activity daily
- Export monthly audit logs for compliance
- Acknowledge security alerts promptly

### 3. Monitor Critical Events

Set up external alerting for critical events:

```typescript
// In your backend
AccessControlSecurityMonitor.startMonitoring();

// Listen for critical events
eventEmitter.on('security:critical', (alert) => {
  // Send email/Slack notification
  notifyAdmins(alert);
});
```

### 4. Maintain Immutable Audit Trail

- Never delete audit logs manually
- Export logs before purging
- Keep backups of exported audit data

## Troubleshooting

### WebSocket Not Connecting

1. Check `NEXT_PUBLIC_SOCKET_URL` environment variable
2. Verify server is running and WebSocket endpoint is active
3. Check for CORS issues in browser console

### Missing Events

1. Verify Chainhook predicates are registered
2. Check Chainhook webhook URL configuration
3. Review Chainhook logs for delivery errors
4. Verify auth token is correct

### High Alert Volume

1. Review alert thresholds in `AccessControlSecurityMonitor`
2. Adjust monitoring intervals
3. Implement alert deduplication
4. Set up alert suppression for known patterns

## Testing

```bash
# Run access control tests
npm test backend/src/__tests__/accessControl/

# Individual test suites
npm test AccessControlEventHandler.test.ts
npm test AccessControlAuditService.test.ts
```

## Maintenance

### Daily
- Review security alerts
- Check suspicious activity
- Monitor audit log volume

### Weekly
- Export audit logs
- Review alert patterns
- Update security thresholds

### Monthly
- Archive old audit logs
- Generate compliance reports
- Review and update documentation
