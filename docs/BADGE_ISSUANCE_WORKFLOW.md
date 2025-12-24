# Badge Issuance Workflow Documentation

This document details the complete badge issuance workflow with WalletConnect integration.

## Workflow Overview

```
Admin Initiates Issuance
        ↓
Navigate to Issue Badge Page
        ↓
   [FORM STATE]
        ↓
Select Template & Enter Recipient
        ↓
Validate Form Data
        ↓
Submit & Connect Wallet
        ↓
   [LOADING STATE]
        ↓
WalletConnect Opens Wallet
        ↓
User Reviews & Confirms Transaction
        ↓
Sign Transaction with Private Key
        ↓
Broadcast to Blockchain
        ↓
   [BLOCKCHAIN PHASE]
        ↓
Wait for Confirmation (Block Height)
        ↓
Extract Transaction ID
        ↓
   [BACKEND REGISTRATION]
        ↓
Register in Database
        ↓
Create Badge Record
        ↓
Update Community Statistics
        ↓
Notify Backend Service
        ↓
   [SUCCESS STATE]
        ↓
Display Confirmation
        ↓
Redirect to Dashboard
```

## Phase 1: Initialization

### Admin Access

1. Admin navigates to `/admin/issue-badge`
2. Authentication check:
   - Must be signed in with Stacks account
   - Must be community admin
   - Valid session token required
3. If not authenticated, redirect to login

### Page Load

```typescript
// Frontend fetches available templates
GET /api/badges/templates?issuer={adminAddress}

Response:
{
  templates: [
    {
      id: 1,
      name: 'Python Master',
      description: 'Expert Python programmer',
      category: 'skill',
      level: 5,
      icon: '🐍',
      community: { id: 'c1', name: 'Developers' },
      createdAt: '2024-01-01'
    },
    // ... more templates
  ]
}
```

### State Initialization

```typescript
// Page states during workflow
type PageState = 'form' | 'loading' | 'success' | 'error'

// Initial state
{
  state: 'form',
  isLoading: false,
  error: null,
  txId: null,
  badgeId: null
}
```

## Phase 2: Form Submission

### Form Data Structure

```typescript
interface BadgeIssuanceFormData {
  recipientAddress: string           // SP2QVPXEWYQFT45C84WXNHQ67GVJHQ7XQEQD35Z4K
  recipientName: string              // John Doe
  recipientEmail: string             // john@example.com (optional)
  templateId: number                 // 1
  communityId: number                // 1
}
```

### Validation Process

```typescript
// Step 1: Client-side validation
const errors = {
  recipientName: validateRecipientName(formData.recipientName),
  recipientAddress: validateStacksAddress(formData.recipientAddress),
  recipientEmail: validateEmail(formData.recipientEmail),
  templateId: validateTemplateSelection(formData.templateId),
  communityId: validateCommunitySelection(formData.communityId)
}

// If validation fails, display error messages and halt
if (Object.values(errors).some(e => e !== null)) {
  displayErrors(errors)
  return
}

// Step 2: Form submission
await handleSubmit(formData)
```

### Validation Rules

| Field | Rules |
|-------|-------|
| recipientName | Min 2 chars, Max 100 chars, alphanumeric + spaces/hyphens |
| recipientAddress | Format: S[P]XXXXX..., Length: 34-35 chars |
| recipientEmail | Valid email format (optional) |
| templateId | Must be positive integer |
| communityId | Must exist and be active |

## Phase 3: Wallet Connection

### WalletConnect Integration

```typescript
// useIssueBadge hook initiates transaction
const { issueBadge, isLoading, error, success, txId } = useIssueBadge()

// Call issueBadge with form data
await issueBadge({
  recipientAddress: formData.recipientAddress,
  templateId: formData.templateId,
  communityId: formData.communityId,
  recipientName: formData.recipientName,
  recipientEmail: formData.recipientEmail
})
```

### Contract Interaction

```typescript
// badgeContractUtils.ts prepares transaction
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
const contractName = 'badge-issuer'
const functionName = 'mint-badge'

const functionArgs = [
  contractPrincipalCV(recipientAddress),
  uintCV(templateId)
]

// Transaction options
{
  contractAddress,
  contractName,
  functionName,
  functionArgs,
  network: StacksTestnet,
  postConditionMode: PostConditionMode.Allow,
  postConditions: []
}
```

### User Confirmation

1. WalletConnect opens wallet interface
2. User reviews:
   - Function being called
   - Parameters
   - Gas fees
   - Network (testnet/mainnet)
3. User signs transaction
4. Wallet broadcasts to blockchain

### Transaction Signing

```typescript
// User's wallet signs transaction
const signedTx = await userSession.signTransaction(txOptions)

// Signed transaction submitted
{
  txId: '0x123456789abcdef',
  signer: 'SP2QVPXEWYQFT45C84WXNHQ67GVJHQ7XQEQD35Z4K',
  timestamp: 1703397600000
}
```

## Phase 4: Blockchain Execution

### Transaction Broadcast

```
Signed Transaction
        ↓
Submit to Stacks Node
        ↓
Mempool Processing
        ↓
Block Building
        ↓
Block Confirmation (6-9 blocks)
        ↓
Transaction Finalized
```

### Block Confirmation

- **Testnet**: 10-30 seconds
- **Mainnet**: 60-120 seconds
- Confirmation requires 6+ block confirmations

### Transaction Verification

```typescript
// Check transaction status
const txStatus = await fetch(
  `https://api.testnet.hiro.so/v1/tx/${txId}`
)

// Possible statuses
{
  status: 'pending' | 'success' | 'failed' | 'abort_by_response'
}
```

## Phase 5: Backend Registration

### Payment & Flow

```
Block Height: 12345
Transaction ID: 0x123456...
Timestamp: 1703397600
        ↓
Extract Transaction Details
        ↓
POST /api/badges/issuance
        ↓
Register Badge Issuance
```

### Registration Payload

```typescript
interface BadgeIssuancePayload {
  txId: string                       // '0x123456...'
  recipientAddress: string           // 'SP2RECIPIENT...'
  templateId: number                 // 1
  communityId: number                // 1
  issuerAddress: string              // 'SP2ISSUER...'
  recipientName?: string             // 'John Doe'
  recipientEmail?: string            // 'john@example.com'
  network: 'testnet' | 'mainnet'    // 'testnet'
  createdAt: string                  // '2024-12-24T07:41:00Z'
}
```

### Backend Processing

```typescript
// Step 1: Validate template
const template = await BadgeTemplate.findById(templateId)
if (!template || !template.isActive) {
  throw new Error('Badge template not found or inactive')
}

// Step 2: Check authorization
const community = await Community.findById(communityId)
if (!community.admins.includes(issuerAddress)) {
  throw new Error('Only community admin can issue badges')
}

// Step 3: Prevent duplicates
const existingBadge = await Badge.findOne({
  templateId,
  owner: recipientAddress
})
if (existingBadge) {
  throw new Error('This recipient already has this badge')
}

// Step 4: Create user if not exists
let recipient = await User.findOne({ stacksAddress: recipientAddress })
if (!recipient) {
  recipient = await User.create({
    stacksAddress: recipientAddress,
    name: recipientName || 'Anonymous',
    email: recipientEmail,
    joinDate: new Date(createdAt)
  })
}

// Step 5: Create badge record
const badge = new Badge({
  templateId,
  owner: recipientAddress,
  issuer: issuerAddress,
  community: community._id,
  transactionId: txId,
  issuedAt: new Date(createdAt),
  metadata: {
    level: template.level,
    category: template.category,
    timestamp: Math.floor(new Date(createdAt).getTime() / 1000)
  }
})
await badge.save()

// Step 6: Update user record
await User.findOneAndUpdate(
  { stacksAddress: recipientAddress },
  {
    $addToSet: { badges: badge._id },
    $push: { badgeActivity: { badgeId: badge._id, action: 'received', date: new Date() } }
  }
)

// Step 7: Update community statistics
await Community.findByIdAndUpdate(
  community._id,
  {
    $addToSet: { issuedBadges: badge._id },
    $inc: { badgeCount: 1 }
  }
)

// Return confirmation
{
  id: badge._id,
  txId,
  recipient: recipientAddress,
  template: template.name,
  status: 'issued',
  issuedAt: badge.issuedAt
}
```

## Phase 6: Confirmation & Completion

### Success State

```typescript
{
  state: 'success',
  isLoading: false,
  error: null,
  txId: '0x123456...',
  badgeId: 1,
  recipientName: 'John Doe'
}
```

### Success Display

```
Badge Issued Successfully!
✓ The badge has been issued to John Doe
✓ Transaction ID: 0x123456...
✓ Redirecting to admin dashboard...
```

### Post-Issuance Actions

1. **Update Admin Dashboard**
   - Refresh badge statistics
   - Add badge to recent issuances
   - Update total issued count

2. **Notify Systems**
   - Emit badge issuance event
   - Queue notification email (if email provided)
   - Update community statistics

3. **Redirect**
   - After 3 seconds, redirect to admin dashboard
   - User can view badge in recent issuance table

## Error Scenarios

### Scenario 1: Invalid Recipient Address

```
User Input: "not-a-valid-address"
        ↓
Validation Error
        ↓
Display: "Invalid Stacks address format. Must start with S or SP"
        ↓
User Corrects Input
        ↓
Resubmit Form
```

### Scenario 2: Duplicate Badge

```
User Attempts to Issue Same Badge to Same Recipient
        ↓
Backend Check: Badge Exists
        ↓
Return Error: "This recipient already has this badge"
        ↓
Display Error State
        ↓
User Chooses Different Template or Recipient
```

### Scenario 3: Transaction Cancelled

```
User Confirms in Wallet
        ↓
Wallet Opens for Signature
        ↓
User Cancels/Rejects
        ↓
Return Error: "Badge issuance cancelled"
        ↓
Display Error State
        ↓
User Can Try Again
```

### Scenario 4: Network Failure

```
Transaction Broadcast
        ↓
Network Timeout
        ↓
Return Error: "Failed to register badge issuance"
        ↓
Display Error State with Retry Option
        ↓
User Can Retry or Check Status Manually
```

### Scenario 5: Template Not Found

```
Admin Loads Page
        ↓
Template Deleted or Deactivated
        ↓
Template Not in Dropdown
        ↓
Display: "No Badge Templates Found"
        ↓
Suggest Creating Badge Template
```

## State Transitions

```
INITIAL
  ├── form state
  │   ├── User fills form
  │   │   └── Form validation
  │   │       ├── Valid → Submit
  │   │       └── Invalid → Show errors
  │   │
  │   └── Submit
  │       └── loading state
  │           ├── WalletConnect
  │           ├── User confirms
  │           ├── Blockchain broadcast
  │           └── Backend registration
  │               ├── Success → success state
  │               │   └── Display confirmation
  │               │       └── Redirect after 3s
  │               │
  │               └── Error → error state
  │                   ├── Display error message
  │                   └── Retry or go back
  │
  └── Error
      ├── Show error details
      ├── Provide troubleshooting steps
      └── Offer retry option
```

## Database Changes

### Badge Record Created

```javascript
// Badge.insert()
{
  templateId: ObjectId('...'),
  owner: 'SP2RECIPIENT...',
  issuer: 'SP2ISSUER...',
  community: ObjectId('...'),
  tokenId: null,
  transactionId: '0x123456...',
  issuedAt: ISODate("2024-12-24T07:41:00Z"),
  metadata: {
    level: 5,
    category: 'skill',
    timestamp: 1703397600
  },
  createdAt: ISODate("2024-12-24T07:41:00Z"),
  updatedAt: ISODate("2024-12-24T07:41:00Z")
}
```

### User Record Updated

```javascript
// User.updateOne()
{
  $addToSet: { 
    badges: ObjectId('badge-id') 
  },
  $push: {
    badgeActivity: {
      badgeId: ObjectId('badge-id'),
      action: 'received',
      date: ISODate("2024-12-24T07:41:00Z")
    }
  }
}
```

### Community Record Updated

```javascript
// Community.updateOne()
{
  $addToSet: { 
    issuedBadges: ObjectId('badge-id') 
  },
  $inc: { 
    badgeCount: 1 
  }
}
```

## Audit Trail

All badge issuances are tracked for compliance:

```typescript
interface AuditEntry {
  timestamp: Date
  action: 'badge_issued'
  issuer: string
  recipient: string
  template: string
  community: string
  txId: string
  status: 'success' | 'failed'
  metadata?: Record<string, unknown>
}
```

## Performance Metrics

### Expected Timing

| Phase | Duration |
|-------|----------|
| Form Submission | <1 second |
| WalletConnect Open | 1-2 seconds |
| User Confirmation | Variable (user-dependent) |
| Transaction Broadcast | <2 seconds |
| Blockchain Confirmation | 10-30 seconds (testnet) |
| Backend Registration | <2 seconds |
| **Total** | **~15-40 seconds** |

### Optimization

- Frontend validation: <100ms
- WalletConnect initialization: 1-2 seconds
- Backend DB operations: <500ms per operation
- API response time: <1 second

## Monitoring & Logging

### Logged Events

```typescript
// Issue badge initiated
logger.info('Badge issuance initiated', {
  issuer: 'SP2ISSUER...',
  template: 'Python Master',
  recipient: 'SP2RECIPIENT...'
})

// Transaction confirmed
logger.info('Badge transaction confirmed', {
  txId: '0x123456...',
  blockHeight: 12345
})

// Badge registered
logger.info('Badge registered in database', {
  badgeId: 'badge-123',
  txId: '0x123456...'
})

// Badge issuance completed
logger.info('Badge issuance completed', {
  badgeId: 'badge-123',
  status: 'success',
  duration: '32 seconds'
})
```

### Error Logging

```typescript
// Validation error
logger.warn('Badge issuance validation failed', {
  errors: [...],
  issuer: 'SP2ISSUER...'
})

// Transaction failed
logger.error('Badge transaction failed', {
  txId: '0x123456...',
  error: 'Transaction aborted',
  reason: '...'
})

// Backend registration failed
logger.error('Badge registration failed', {
  txId: '0x123456...',
  error: 'Database error'
})
```

## Related Documentation

- [Badge Issuance Setup](./BADGE_ISSUANCE_SETUP.md)
- [Community Creation Workflow](./COMMUNITY_APPROVAL_WORKFLOW.md)
- [Contract Documentation](../contracts/deploy.md)
