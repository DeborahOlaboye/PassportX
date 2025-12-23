# Community Approval Workflow

This document outlines the complete approval workflow for community creation with WalletConnect integration.

## Workflow Overview

```
User Creates Community
        ↓
   [PENDING]
        ↓
User Requests Approval
        ↓
  [UNDER_REVIEW]
        ↓
Moderator Reviews
        ↓
    ┌─────────┴─────────┐
    ↓                   ↓
[APPROVED]          [REJECTED]
    ↓                   ↓
Active Community   Inactive Community
```

## Status Definitions

### PENDING
- **Initial State**: Immediately after community creation
- **Owner Action Required**: Request approval from moderators
- **Characteristics**:
  - Community is created on-chain
  - Metadata stored in database
  - Not yet listed in public community directory
  - Members can be added by owner

### UNDER_REVIEW
- **Trigger**: Owner requests approval
- **Moderator Action Required**: Review and approve/reject
- **Characteristics**:
  - Community visible to approvers only
  - Cannot receive public visibility
  - Metadata is validated
  - Compliance checks are performed

### APPROVED
- **Trigger**: Moderator approves community
- **Requirements**:
  - Community passes compliance checks
  - Metadata is accurate
  - No violations detected
- **Characteristics**:
  - Community listed in directory
  - Public visibility enabled
  - Full feature access
  - Can issue badges publicly

### REJECTED
- **Trigger**: Moderator rejects community
- **Information Provided**:
  - Detailed rejection reason
  - Possible remediation steps
- **Characteristics**:
  - Community marked inactive
  - Owner notified with reason
  - Can reapply after addressing issues
  - Historical record maintained

## Detailed Process

### Phase 1: Community Creation

```
1. User navigates to /admin/create-community
2. Fills out form with:
   - Community name and description
   - Theme colors
   - Settings and preferences
   - STX payment amount
3. WalletConnect confirms transaction
4. Smart contract creates community on-chain
5. Transaction ID recorded
6. Backend registers community
7. Status set to: PENDING
8. Metadata stored with approval fields
```

### Phase 2: Approval Request

**Owner Action**:
```typescript
await requestCommunityApproval(communityId, ownerAddress)
```

**System Actions**:
1. Validates owner has authority
2. Moves status from PENDING to UNDER_REVIEW
3. Records approval request timestamp
4. Notifies approvers
5. Community moves to review queue

**Database Update**:
```typescript
{
  metadata: {
    approvalStatus: 'under_review',
    approvalRequestedAt: '2024-12-23T12:00:00Z',
    approvalRequestedBy: 'owner-address'
  }
}
```

### Phase 3: Moderation Review

**Approver Checklist**:
- [ ] Community name is appropriate
- [ ] Description is accurate and helpful
- [ ] Website URL is valid
- [ ] Theme colors are reasonable
- [ ] No trademark violations
- [ ] No inappropriate content
- [ ] Settings are valid
- [ ] No security concerns

**Metadata Validated**:
```typescript
{
  name: 'Valid community name',
  description: 'Valid description',
  website: 'https://example.com',
  theme: { valid colors },
  settings: { valid settings },
  transactionId: 'verified on blockchain',
  owner: 'verified signer'
}
```

### Phase 4A: Approval

**Approver Action**:
```typescript
await approveCommunity(communityId, approverAddress)
```

**System Actions**:
1. Validates approver has authority
2. Performs final compliance check
3. Updates status to APPROVED
4. Records approval timestamp and approver
5. Enables public visibility
6. Notifies owner of approval

**Database Update**:
```typescript
{
  metadata: {
    approvalStatus: 'approved',
    approvedAt: '2024-12-23T13:00:00Z',
    approvedBy: 'approver-address'
  },
  isActive: true
}
```

**Owner Notification**:
```
Subject: Your Community Has Been Approved!

Your community "Web3 Developers" has been approved and is now
listed in the community directory. Members can now discover
and join your community.

To manage your community, visit: /admin/community/[id]
```

### Phase 4B: Rejection

**Approver Action**:
```typescript
await rejectCommunity(communityId, approverAddress, reason)
```

**System Actions**:
1. Validates approver has authority
2. Records detailed rejection reason
3. Updates status to REJECTED
4. Marks community as inactive
5. Records rejection timestamp and rejector
6. Sends detailed notification to owner

**Database Update**:
```typescript
{
  metadata: {
    approvalStatus: 'rejected',
    rejectedAt: '2024-12-23T13:00:00Z',
    rejectedBy: 'approver-address',
    rejectionReason: 'Detailed reason for rejection'
  },
  isActive: false
}
```

**Owner Notification**:
```
Subject: Community Review Feedback

Your community "Web3 Developers" requires some changes before
it can be approved.

Reason: The website URL provided does not match the community
        name or domain. Please update this before reapplying.

Next Steps:
1. Address the issues mentioned above
2. Update your community details
3. Resubmit for approval

Contact Support: support@passportx.com
```

## API Endpoints

### Request Approval
```
POST /api/communities/:communityId/approval
Content-Type: application/json

{
  approved: false,  // Just requesting, not approving
  approverAddress: "owner-address"
}

Response:
{
  success: true,
  message: "Approval request submitted",
  approvalStatus: "under_review"
}
```

### Approve Community
```
POST /api/communities/:communityId/approval
Content-Type: application/json

{
  approved: true,
  approverAddress: "approver-address"
}

Response:
{
  success: true,
  message: "Community approved successfully",
  approvalStatus: "approved"
}
```

### Reject Community
```
POST /api/communities/:communityId/approval
Content-Type: application/json

{
  approved: false,
  reason: "Community name contains inappropriate content",
  approverAddress: "approver-address"
}

Response:
{
  success: true,
  message: "Community rejected",
  approvalStatus: "rejected",
  reason: "..."
}
```

### Get Approval Status
```
GET /api/communities/:communityId/approval

Response:
{
  communityId: "...",
  communityName: "...",
  status: "under_review",
  requestedAt: "2024-12-23T12:00:00Z",
  approvedAt: null,
  rejectedAt: null,
  admins: ["admin1", "admin2"]
}
```

## Moderator Interface

### View Pending Communities
```
GET /api/communities/pending?limit=20&offset=0

Response:
{
  data: [
    {
      _id: "...",
      name: "Web3 Developers",
      description: "...",
      admins: ["..."],
      memberCount: 1,
      createdAt: "2024-12-23T12:00:00Z",
      metadata: { ... }
    }
  ],
  pagination: { total, limit, offset, hasMore }
}
```

### View Under Review Communities
```
GET /api/communities/under-review?limit=20&offset=0

Response:
{
  data: [
    {
      _id: "...",
      name: "...",
      metadata: {
        approvalStatus: "under_review",
        approvalRequestedAt: "...",
        approvalRequestedBy: "..."
      }
    }
  ],
  pagination: { ... }
}
```

## Configuration

### Set Authorized Approvers

In `.env`:
```bash
# Comma-separated list of approver addresses
COMMUNITY_APPROVERS=SP2APPROVER1.admin,SP2APPROVER2.admin,SP2APPROVER3.admin
```

### Development Mode

In development, any authenticated user can approve communities:
```typescript
const isApprover = (address: string) => {
  const approvers = process.env.COMMUNITY_APPROVERS?.split(',') || []
  return approvers.includes(address) || process.env.NODE_ENV === 'development'
}
```

## Security Measures

### 1. Authorization
- Only designated approvers can approve/reject
- Moderator address is recorded for audit trail
- Admin addresses verified on blockchain

### 2. Validation
- All metadata re-validated before approval
- Transaction signature verified
- Smart contract call confirmed

### 3. Immutability
- Approval decisions cannot be reversed
- Historical record maintained
- All changes logged with timestamps

### 4. Notification
- Both owner and approver receive notifications
- Detailed feedback provided for rejections
- Reapplication instructions included

## Audit Trail

Every approval action is recorded:

```typescript
{
  communityId: "...",
  action: "approved|rejected|requested",
  performedBy: "address",
  performedAt: "2024-12-23T13:00:00Z",
  previousStatus: "pending",
  newStatus: "approved",
  metadata: {
    reason: "Only for rejections",
    notes: "Additional context"
  }
}
```

## Reapplication After Rejection

**Owner Process**:
1. Review rejection reason
2. Address all issues mentioned
3. Update community details
4. Resubmit for approval
5. Status automatically resets to UNDER_REVIEW

**System Handling**:
```typescript
// When updating a rejected community
if (community.metadata?.approvalStatus === 'rejected') {
  // Reset to allow reapplication
  community.metadata.approvalStatus = 'pending'
  community.metadata.rejectionReason = null
  community.metadata.rejectedAt = null
  // ... save and notify owner
}
```

## Metrics & Reporting

### Approval Statistics
- Total communities created
- Pending approval count
- Average approval time
- Approval/rejection ratio
- Moderator performance metrics

### Sample Report
```
Community Approval Report
==========================
Period: Last 30 Days

Total Applications: 45
Approved: 38 (84%)
Rejected: 5 (11%)
Pending: 2 (5%)

Average Review Time: 2.3 days
Fastest Approval: 1 hour
Slowest Approval: 7 days

Top Approvers by Volume:
1. approver@passportx.com - 22 reviewed
2. moderator@passportx.com - 16 reviewed
```

## Troubleshooting

### Approval Request Fails
**Problem**: Cannot request approval

**Solutions**:
- Verify you are the community owner
- Check internet connection
- Ensure community exists on blockchain
- Clear browser cache

### Approval Takes Too Long
**Problem**: Community still pending after several days

**Solutions**:
- Check approval request was submitted
- Verify email notifications
- Contact support team
- Check for rejection that needs addressing

### Cannot Reapply After Rejection
**Problem**: Cannot resubmit after rejection

**Solutions**:
- Update community details first
- Wait for notification confirmation
- Verify changes address feedback
- Contact support if issue persists
