# Badge Issuance via WalletConnect - Setup Guide

This guide walks you through setting up and using the badge issuance feature with WalletConnect integration.

## Overview

The badge issuance feature allows community admins to award badges to members via WalletConnect transactions. The process includes:

1. **Template Selection**: Choose a pre-created badge template
2. **Recipient Configuration**: Enter recipient details and Stacks address
3. **Wallet Connection**: Confirm transaction via WalletConnect
4. **Blockchain Registration**: Badge is recorded on-chain
5. **Backend Registration**: Badge metadata is stored in the database
6. **User Notification**: Badge appears in recipient's profile

## Environment Setup

### Required Environment Variables

#### Frontend (.env.local)

```bash
# WalletConnect Configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_ENABLED=true

# Badge Issuer Contract
NEXT_PUBLIC_BADGE_ISSUER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_TESTNET_BADGE_ISSUER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_MAINNET_BADGE_ISSUER_ADDRESS=SP2EXAMPLE.badge-issuer

# Backend Configuration
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_API_KEY=your-api-key-here
```

#### Backend (.env)

```bash
NODE_ENV=development
STACKS_NETWORK=testnet
DATABASE_URL=mongodb://localhost:27017/passportx

# Badge Configuration
BADGE_ISSUER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
MAX_BADGES_PER_BATCH=100
```

## File Structure

```
src/
├── app/
│   └── admin/
│       └── issue-badge/
│           └── page.tsx              # Badge issuance page
├── components/
│   └── forms/
│       └── BadgeIssuanceForm.tsx      # Issuance form component
├── hooks/
│   └── useIssueBadge.ts               # Badge issuance hook
├── lib/
│   ├── contracts/
│   │   └── badgeContractUtils.ts      # Contract interactions
│   ├── metadata/
│   │   └── badgeMetadata.ts           # Metadata handling
│   └── validation/
│       └── badgeValidation.ts         # Form validation
└── types/
    └── badge.ts                       # TypeScript types

backend/src/
├── services/
│   └── badgeTransactionService.ts     # Transaction service
├── routes/
│   └── badges.ts                      # API routes (extended)
└── models/
    ├── Badge.ts                       # Badge model
    └── BadgeTemplate.ts               # Badge template model
```

## Issuing a Badge - Step by Step

### 1. Navigate to Badge Issuance Page

```bash
# Visit this URL
http://localhost:3000/admin/issue-badge
```

### 2. Select Badge Template

- Choose a badge template from the dropdown
- Templates are pre-created by community admins
- Each template includes:
  - Name and description
  - Category (skill, contribution, achievement, etc.)
  - Level (1-5)
  - Community association

### 3. Enter Recipient Information

- **Recipient Name**: Full name of the badge recipient (2-100 characters)
- **Recipient Stacks Address**: Valid Stacks address (SP format)
- **Recipient Email** (optional): Email for notification purposes

### 4. Review Badge Preview

- Live preview shows:
  - Badge name and icon
  - Recipient name
  - Category and level
  - Description
  - Status (Ready to Issue)

### 5. Submit Form

The form validates all fields before submission:

```typescript
const validation = validateBadgeIssuanceForm({
  recipientName: 'John Doe',
  recipientAddress: 'SP2QVPXEWYQFT45C84WXNHQ67GVJHQ7XQEQD35Z4K',
  recipientEmail: 'john@example.com',
  templateId: 1,
  communityId: 'community-123'
})

if (!validation.valid) {
  // Show validation errors
  validation.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`)
  })
  return
}
```

### 6. Confirm Transaction in Wallet

- WalletConnect opens wallet for confirmation
- User reviews transaction details
- Approves or rejects the transaction
- Transaction is signed and broadcast

### 7. Badge Issuance Confirmation

After successful transaction:

```typescript
{
  id: 'badge-123',
  txId: '0x123456789abcdef',
  recipient: 'SP2RECIPIENT...',
  template: 'Python Master',
  status: 'issued',
  issuedAt: 2024-12-24T07:41:00Z
}
```

## Badge Validation Rules

### Recipient Name Validation

- Required field
- Minimum 2 characters
- Maximum 100 characters
- Alphanumeric characters, spaces, hyphens, and apostrophes allowed

### Stacks Address Validation

- Required field
- Must start with 'S' or 'SP'
- Valid Stacks address format
- Must be 34-35 characters long

### Email Validation (Optional)

- When provided, must be valid email format
- Used for notification purposes only

### Template Validation

- Must select a valid template
- Template must be active
- Template must belong to a community

## Badge Metadata Structure

```typescript
interface BadgeMetadata {
  level: 1 | 2 | 3 | 4 | 5
  category: 'skill' | 'participation' | 'contribution' | 'leadership' | 'learning' | 'achievement' | 'milestone'
  timestamp: number
  issuer: string
  recipient: string
  templateName?: string
  templateDescription?: string
  communityName?: string
  isActive: boolean
  ipfsHash?: string
  additionalData?: Record<string, unknown>
}
```

## API Endpoints

### Issue Badge

```bash
POST /api/badges/issuance

Request body:
{
  txId: string
  recipientAddress: string
  templateId: number
  communityId: number
  issuerAddress: string
  recipientName?: string
  recipientEmail?: string
  network: 'testnet' | 'mainnet'
  createdAt: string
}

Response:
{
  id: string
  txId: string
  recipient: string
  template: string
  status: 'issued'
  issuedAt: Date
}
```

### Get Issued Badges

```bash
GET /api/badges/issued-by/:issuer

Response:
{
  issuer: string
  count: number
  badges: Badge[]
}
```

### Get Received Badges

```bash
GET /api/badges/received-by/:recipient

Response:
{
  recipient: string
  count: number
  badges: Badge[]
}
```

## Error Handling

### Common Errors

#### Invalid Recipient Address

```
Error: Invalid Stacks address format. Must start with S or SP
```

**Solution**: Verify the Stacks address format

#### Template Not Found

```
Error: Badge template not found or inactive
```

**Solution**: Ensure template exists and is active

#### Duplicate Badge

```
Error: This recipient already has this badge
```

**Solution**: Choose a different template or recipient

#### Transaction Cancelled

```
Error: Badge issuance cancelled
```

**Solution**: User cancelled the transaction in wallet - try again

#### Network Timeout

```
Error: Failed to register badge issuance
```

**Solution**: Check network connection and try again

## Transaction Flow

```
User Submits Form
        ↓
Validation Check
        ↓
WalletConnect Opens
        ↓
User Confirms in Wallet
        ↓
Contract Transaction Executed
        ↓
Transaction Confirmed (Block Height)
        ↓
Backend Registers Badge
        ↓
Badge Metadata Stored
        ↓
Confirmation Display
        ↓
Redirect to Admin Dashboard
```

## Testing Badge Issuance

### Unit Tests

```bash
# Run validation tests
npm run test -- badgeValidation.test.ts

# Run metadata tests
npm run test -- badgeMetadata.test.ts
```

### Integration Tests

```bash
# Run badge issuance integration tests
npm run test -- tests/integration/badge-issuance.test.ts

# Run all integration tests
npm run test -- tests/integration/
```

### Manual Testing

1. **Test with Testnet**
   - Use testnet badge issuer contract
   - Issue badges to testnet addresses
   - Verify in Stacks Explorer

2. **Test Error Scenarios**
   - Invalid recipient address
   - Missing required fields
   - Duplicate badge issuance
   - Cancelled transactions

3. **Test Performance**
   - Issue badges to multiple recipients
   - Monitor transaction confirmation times
   - Check database performance

## Troubleshooting

### Badge Not Appearing in Recipient's Profile

**Cause**: Backend registration failed or delayed

**Solution**:
- Check transaction ID in Stacks Explorer
- Verify backend is running
- Check database connectivity
- Retry badge registration

### Transaction Pending Too Long

**Cause**: Network congestion or high fee

**Solution**:
- Check network status
- Increase transaction fee
- Wait for next block
- Try again with different template

### Cannot Access Issue Badge Page

**Cause**: User not authenticated or not admin

**Solution**:
- Log in with admin account
- Verify admin permissions in community
- Check authentication token

### WalletConnect Not Opening

**Cause**: WalletConnect not initialized or wallet not available

**Solution**:
- Refresh page
- Check wallet browser extension
- Verify WalletConnect configuration
- Try different browser

## Security Considerations

### Authorization

- Only community admins can issue badges
- User must be signed in with valid Stacks account
- Backend validates issuer authorization

### Data Validation

- All inputs validated on frontend and backend
- Recipient address format verified
- Template existence confirmed
- Metadata structure validated

### Transaction Security

- Transactions signed by user's private key
- No private keys stored on backend
- Post-conditions enforce payment amounts
- Transaction IDs tracked for audit

### Rate Limiting

- API endpoints rate-limited to prevent abuse
- Maximum 100 badges per batch operation
- Transaction throttling per user

## Performance Optimization

### Caching

- Badge templates cached on frontend
- Recent badges fetched and cached
- Community data cached with TTL

### Database Optimization

- Indexes on common queries (issuer, recipient, template)
- Bulk operations for batch issuance
- Archiving old transactions

### API Optimization

- Pagination for large badge lists
- Filtering by date, category, level
- Aggregation for statistics

## Related Documentation

- [Community Creation Setup](./COMMUNITY_CREATION_SETUP.md)
- [Badge Issuance Workflow](./BADGE_ISSUANCE_WORKFLOW.md)
- [WalletConnect Integration](./WALLETCONNECT_CI_CD_INTEGRATION_SUMMARY.md)
- [API Documentation](../backend/API_DOCUMENTATION.md)
