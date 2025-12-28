# Badge Verification Feature

## Overview

The Badge Verification feature allows users to verify the authenticity of badges issued on the PassportX platform. This feature includes smart contract verification, API endpoints, and a public verification page for sharing verified badges.

## Features

### 1. Smart Contract Verification

The verification logic is implemented in the `badge-reader.clar` contract with the following functions:

#### `verify-badge-ownership`
Verifies that a claimed owner actually owns a specific badge.

```clarity
(verify-badge-ownership (badge-id uint) (claimed-owner principal))
```

**Returns:** `(ok bool)` - true if ownership is verified, false otherwise

#### `verify-badge-authenticity`
Checks if a badge exists and is active (not revoked).

```clarity
(verify-badge-authenticity (badge-id uint))
```

**Returns:** `(ok { exists: bool, active: bool, issuer: principal, timestamp: uint })`

#### `get-verification-status`
Retrieves complete verification information for a badge.

```clarity
(get-verification-status (badge-id uint))
```

**Returns:** Full badge verification status including owner, issuer, level, category, and active status

### 2. API Endpoints

All verification endpoints are available under `/api/verify`:

#### `POST /api/verify/badge`
Verify a single badge with optional ownership check.

**Request:**
```json
{
  "badgeId": "string",
  "claimedOwner": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "badgeId": "string",
    "verified": true,
    "active": true,
    "owner": "SP...",
    "issuer": "SP...",
    "level": 3,
    "category": "skill",
    "timestamp": 1234567890,
    "templateName": "Badge Name",
    "communityName": "Community Name",
    "verifiedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `GET /api/verify/badge/:badgeId`
Get verification status for a specific badge.

#### `GET /api/verify/public/:badgeId`
Get public verification info (excludes sensitive data like owner address).

#### `POST /api/verify/batch`
Verify multiple badges at once (max 50).

**Request:**
```json
{
  "badgeIds": ["id1", "id2", "id3"]
}
```

#### `GET /api/verify/user/:address`
Get verification status for all badges owned by a user.

#### `GET /api/verify/blockchain/:badgeId`
Check if a badge is verified on the blockchain (has tokenId and transactionId).

### 3. Public Verification Page

Users can share verified badges using the public verification page:

**URL Format:** `/verify/:badgeId`

The page displays:
- Verification status (Verified/Unverified/Revoked)
- Badge details (name, community, level, category)
- Issue date
- Verification timestamp
- Share and print options

### 4. Visual Indicators

#### VerificationBadge Component

A reusable component for displaying verification status:

```tsx
import VerificationBadge from '@/components/VerificationBadge'

<VerificationBadge
  verified={true}
  active={true}
  size="md"
  showLabel={true}
/>
```

**Props:**
- `verified`: boolean - Whether the badge is verified
- `active`: boolean - Whether the badge is active (not revoked)
- `size`: 'sm' | 'md' | 'lg' - Size of the badge
- `showLabel`: boolean - Whether to show the text label

#### BadgeCard Integration

The `BadgeCard` component now includes:
- Verification shield icon for verified badges
- "View Verification" link
- Visual status indicator in the corner

## Frontend API Client

Use the verification API client for frontend integration:

```typescript
import {
  verifyBadge,
  getBadgeVerificationStatus,
  getPublicVerificationInfo,
  verifyBadgeBatch,
  verifyUserBadges,
  checkBlockchainVerification,
  getVerificationUrl,
  copyVerificationUrl
} from '@/lib/api/verification'

// Verify a badge
const result = await verifyBadge('badgeId123')

// Check blockchain verification
const isOnChain = await checkBlockchainVerification('badgeId123')

// Get shareable URL
const url = getVerificationUrl('badgeId123')
```

## Security Considerations

1. **Rate Limiting**: Verification endpoints are rate-limited to prevent abuse
2. **Validation**: All inputs are validated for correct format
3. **Error Handling**: Proper error messages without exposing sensitive information
4. **Public Data**: Public verification page only shows non-sensitive information

## Gas Optimization

The verification functions are read-only (`define-read-only`) and don't consume gas, making verification free for users.

## Testing

### Smart Contract Tests
Located in `/tests/unit/badge-verification_test.ts`

Run tests:
```bash
clarinet test tests/unit/badge-verification_test.ts
```

### API Integration Tests
Located in `/tests/integration/verification-api.test.ts`

Run tests:
```bash
npm test tests/integration/verification-api.test.ts
```

## Usage Examples

### Example 1: Verify Badge on Badge Display

```tsx
import { useState, useEffect } from 'react'
import { verifyBadge } from '@/lib/api/verification'
import VerificationBadge from '@/components/VerificationBadge'

function BadgeDisplay({ badgeId }) {
  const [verification, setVerification] = useState(null)

  useEffect(() => {
    verifyBadge(badgeId).then(result => {
      if (result.success) {
        setVerification(result.verification)
      }
    })
  }, [badgeId])

  return (
    <div>
      {verification && (
        <VerificationBadge
          verified={verification.verified}
          active={verification.active}
        />
      )}
    </div>
  )
}
```

### Example 2: Batch Verify User Badges

```tsx
import { verifyUserBadges } from '@/lib/api/verification'

async function getUserVerifiedBadges(userAddress: string) {
  const verifications = await verifyUserBadges(userAddress)

  const verifiedBadges = verifications.filter(v => v.verified && v.active)
  console.log(`User has ${verifiedBadges.length} verified badges`)

  return verifiedBadges
}
```

### Example 3: Share Verification Link

```tsx
import { copyVerificationUrl } from '@/lib/api/verification'

async function shareVerification(badgeId: string) {
  const success = await copyVerificationUrl(badgeId)

  if (success) {
    alert('Verification link copied to clipboard!')
  } else {
    alert('Failed to copy link')
  }
}
```

## Error Codes

- `102` - Badge not found
- `400` - Invalid request (missing or malformed parameters)
- `404` - Resource not found
- `500` - Internal server error

## Future Enhancements

- [ ] QR code generation for verification links
- [ ] Badge verification certificates (PDF generation)
- [ ] Revocation history tracking
- [ ] Multi-signature verification for high-value badges
- [ ] Integration with decentralized identity protocols
- [ ] Verification analytics dashboard
