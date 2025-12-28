# Community Creation with WalletConnect - Setup Guide

This guide walks you through setting up and using the community creation feature with WalletConnect integration.

## Overview

The community creation feature allows users to create new communities on the blockchain using WalletConnect. The process includes:

1. **Form Submission**: User fills out community details
2. **Wallet Connection**: User connects via WalletConnect
3. **STX Payment**: Transaction is signed and confirmed
4. **Blockchain Registration**: Community is created on-chain
5. **Backend Registration**: Community metadata is stored in the database
6. **Approval Workflow**: Community enters approval queue for moderation

## Environment Setup

### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_ENABLED=true
NEXT_PUBLIC_COMMUNITY_MANAGER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_TESTNET_COMMUNITY_MANAGER_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
NEXT_PUBLIC_MAINNET_COMMUNITY_MANAGER_ADDRESS=SP2EXAMPLE.community-manager
BACKEND_API_URL=http://localhost:3001
BACKEND_API_KEY=your-api-key-here

# Backend (.env)
NODE_ENV=development
STACKS_NETWORK=testnet
COMMUNITY_APPROVERS=SP2EXAMPLE.admin1,SP2EXAMPLE.admin2
DATABASE_URL=mongodb://localhost:27017/passportx
```

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── create-community/
│   │   │   └── page.tsx          # Community creation page
│   │   └── page.tsx              # Updated dashboard
│   └── api/
│       └── communities/
│           ├── route.ts          # Community creation/listing API
│           └── [communityId]/
│               └── approval/
│                   └── route.ts  # Community approval API
├── components/
│   └── forms/
│       └── CommunityCreationForm.tsx  # Form component
├── hooks/
│   └── useCreateCommunity.ts    # Community creation hook
├── lib/
│   ├── contracts/
│   │   └── communityContractUtils.ts  # Contract interactions
│   ├── metadata/
│   │   └── communityMetadata.ts       # Metadata handling
│   ├── stx/
│   │   └── paymentUtils.ts            # STX payment utilities
│   └── validation/
│       └── communityValidation.ts     # Form validation
└── types/
    └── community.ts              # TypeScript types

backend/src/
├── services/
│   ├── communityService.ts           # Existing community service
│   └── communityTransactionService.ts # New transaction service
└── controllers/
    └── communityController.ts   # Community controller
```

## Creating a Community - Step by Step

### 1. Navigate to Create Community Page

```typescript
// Navigate to /admin/create-community
```

### 2. Fill Out Community Details

- **Name**: Community name (3-100 characters)
- **Description**: Short description (10-2000 characters)
- **About**: Detailed information (optional, max 5000 chars)
- **Website**: Community website URL (optional)
- **Tags**: Comma-separated tags (max 20)
- **Theme**: Primary and secondary colors
- **Settings**: Configuration options
- **STX Payment**: Creation fee in STX

### 3. Submit Form

The form validates all fields before submission:

```typescript
const { createCommunity } = useCreateCommunity()

await createCommunity({
  name: formData.name,
  description: formData.description,
  about: formData.about,
  website: formData.website,
  stxPayment: formData.stxPayment,
  theme: {
    primaryColor: formData.primaryColor,
    secondaryColor: formData.secondaryColor
  },
  settings: {
    allowMemberInvites: formData.allowMemberInvites,
    requireApproval: formData.requireApproval,
    allowBadgeIssuance: formData.allowBadgeIssuance,
    allowCustomBadges: formData.allowCustomBadges
  },
  tags: tags
})
```

### 4. Confirm Transaction

User sees a waiting screen while WalletConnect processes the transaction:

```
Creating Community...
Please confirm the transaction in your wallet
```

### 5. Transaction Confirmation

Transaction is recorded and stored:

```typescript
{
  txId: "0x1234...",
  status: "pending",
  network: "testnet",
  amount: "100 STX"
}
```

### 6. Community Registration

Community data is saved to backend:

```typescript
{
  name: "Web3 Developers",
  slug: "web3-developers",
  description: "A community for Web3 developers",
  owner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  metadata: {
    transactionId: "0x1234...",
    network: "testnet",
    approvalStatus: "pending"
  }
}
```

## Form Validation Rules

### Name Validation
- Required field
- 3-100 characters
- Alphanumeric with spaces, hyphens, ampersands

### Description Validation
- Required field
- 10-2000 characters
- Free-form text

### Website Validation
- Optional field
- Must be valid HTTPS URL
- Format: `https://example.com`

### Tags Validation
- Optional field
- Maximum 20 tags
- Max 50 characters per tag
- Alphanumeric with hyphens and underscores

### Color Validation
- Hex color format
- Format: `#RRGGBB`

### STX Payment Validation
- Non-negative number
- Maximum 1,000,000 STX

## Community Approval Workflow

### Statuses

1. **pending**: Awaiting approval request
2. **under_review**: Approval requested, awaiting moderator action
3. **approved**: Community is approved and active
4. **rejected**: Community was rejected with reason

### Approval Process

```typescript
// Request approval (by community admin)
await requestCommunityApproval(communityId, adminAddress)

// Approve (by authorized approver)
await approveCommunity(communityId, approverAddress)

// Reject (by authorized approver)
await rejectCommunity(communityId, approverAddress, reason)
```

## Testing

### Unit Tests

```bash
npm run test -- src/lib/validation/communityValidation.ts
npm run test -- src/lib/metadata/communityMetadata.ts
npm run test -- src/lib/stx/paymentUtils.ts
```

### Integration Tests

```bash
npm run test -- tests/integration/community-creation.test.ts
```

### Manual Testing

1. **Create a test community**
   - Fill out all required fields
   - Verify form validation works
   - Submit form

2. **Verify transaction**
   - Check transaction ID in console
   - Verify in blockchain explorer

3. **Check backend**
   - Verify community was created
   - Check metadata is correct
   - Confirm approval status

## Troubleshooting

### Transaction Fails

**Problem**: "Transaction failed or was cancelled"

**Solutions**:
- Ensure sufficient STX balance
- Check network is correct (testnet vs mainnet)
- Verify WalletConnect connection
- Check contract address configuration

### Form Validation Errors

**Problem**: Form shows validation error

**Solutions**:
- Check field length requirements
- Verify URL format for website
- Ensure tags are comma-separated
- Check special characters in name

### Community Not Appearing in List

**Problem**: Created community doesn't appear in dashboard

**Solutions**:
- Wait for blockchain confirmation
- Verify admin address in API call
- Check backend is running
- Clear browser cache

## Community Settings Explained

### Allow Member Invites
- **Enabled**: Members can invite others
- **Disabled**: Only admins can add members

### Require Approval
- **Enabled**: New members need admin approval
- **Disabled**: Members can join freely

### Allow Badge Issuance
- **Enabled**: Admins can issue badges
- **Disabled**: Badge issuance disabled

### Allow Custom Badges
- **Enabled**: Members can create custom badges
- **Disabled**: Only predefined badges allowed

## Advanced Configuration

### Custom Contract Address

```typescript
const contractAddress = process.env.NEXT_PUBLIC_COMMUNITY_MANAGER_ADDRESS
const manager = new CommunityContractManager(contractAddress, userSession, 'testnet')
```

### Custom Validation Rules

```typescript
import { validateCommunityName } from '@/lib/validation/communityValidation'

const error = validateCommunityName('My Community')
if (error) {
  console.error(error.message)
}
```

### Custom Payment Handling

```typescript
import { stxUtils } from '@/lib/stx/paymentUtils'

const microStx = stxUtils.stxToMicroStx(100)
const stx = stxUtils.microStxToStx(BigInt(100_000_000))
```

## Security Considerations

1. **WalletConnect**: Uses secure connection to wallet
2. **Post-Conditions**: Transaction amount is verified
3. **Admin Verification**: Only authorized admins can approve
4. **Metadata Validation**: All fields validated before storage
5. **Rate Limiting**: Consider implementing rate limiting for production

## Performance Optimization

1. **Lazy Loading**: Community cards load on demand
2. **Pagination**: Dashboard supports pagination
3. **Caching**: Cache community list when possible
4. **Memoization**: Form components use React.memo

## Additional Resources

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Stacks Blockchain Documentation](https://docs.stacks.co/)
- [Community Contract](./contracts/community-manager.clar)
- [Backend Integration](../BACKEND_INTEGRATION.md)
