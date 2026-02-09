# Contract Call Type Definitions

This document describes the type definitions for contract calls in PassportX.

## Overview

All contract calls in PassportX are now fully typed to provide:
- IDE autocomplete support
- Type safety at compile time
- Clear documentation of expected response structures
- Better error handling

## Core Types

### ContractCallStatus

```typescript
type ContractCallStatus = 'pending' | 'confirmed' | 'failed';
```

Represents the status of a contract call transaction.

### BaseContractResponse

```typescript
interface BaseContractResponse {
  txId: string;
  status: ContractCallStatus;
}
```

Base interface that all contract responses extend from.

### BadgeIssuerResponse

```typescript
interface BadgeIssuerResponse extends BaseContractResponse {
  badgeId?: number;
}
```

Response from badge issuance operations.

### CommunityContractResponse

```typescript
interface CommunityContractResponse extends BaseContractResponse {
  communityId?: number;
}
```

Response from community creation operations.

## Backend Integration Types

### BadgeIssuanceBackendPayload

```typescript
interface BadgeIssuanceBackendPayload {
  txId: string;
  recipientAddress: string;
  templateId: number;
  communityId: number;
  issuerAddress: string;
  recipientName?: string;
  recipientEmail?: string;
  network: 'testnet' | 'mainnet';
  createdAt: string;
}
```

Payload for registering badge issuance on the backend.

### CommunityBackendPayload

```typescript
interface CommunityBackendPayload {
  txId: string;
  name: string;
  description: string;
  about?: string;
  website?: string;
  stxPayment: number;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    allowBadgeIssuance: boolean;
    allowCustomBadges: boolean;
  };
  tags?: string[];
  owner: string;
  createdAt: string;
  network: 'testnet' | 'mainnet';
}
```

Payload for registering community creation on the backend.

### BackendApiResponse

```typescript
interface BackendApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

Generic wrapper for all backend API responses.

## Transaction Types

### TransactionStatusResponse

```typescript
interface TransactionStatusResponse {
  tx_id: string;
  tx_status: 'pending' | 'success' | 'abort_by_response' | 'abort_by_post_condition';
  tx_result?: {
    hex: string;
    repr: string;
  };
  block_height?: number;
  block_hash?: string;
  block_time?: number;
  burn_block_time?: number;
}
```

Response from Stacks API transaction status endpoint.

### ContractCallArgs

```typescript
interface ContractCallArgs {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
}
```

Arguments for contract call operations.

## Usage Examples

### Badge Issuance

```typescript
import { useIssueBadge } from '@/hooks/useIssueBadge';

const { issueBadge, txId, badgeId } = useIssueBadge();

const result = await issueBadge({
  recipientAddress: 'ST1234...',
  templateId: 1,
  communityId: 1,
  recipientName: 'John Doe',
  recipientEmail: 'john@example.com'
});

// result is typed as BadgeIssuerResponse
console.log(result.txId); // string
console.log(result.status); // 'pending' | 'confirmed' | 'failed'
console.log(result.badgeId); // number | undefined
```

### Community Creation

```typescript
import { useCreateCommunity } from '@/hooks/useCreateCommunity';

const { createCommunity, txId, communityId } = useCreateCommunity();

const result = await createCommunity({
  name: 'My Community',
  description: 'A great community',
  stxPayment: 100,
  settings: {
    allowMemberInvites: true,
    requireApproval: false,
    allowBadgeIssuance: true,
    allowCustomBadges: true
  }
});

// result is typed as CommunityContractResponse
console.log(result.txId); // string
console.log(result.status); // 'pending' | 'confirmed' | 'failed'
console.log(result.communityId); // number | undefined
```

### Contract Calls

```typescript
import { useContractCall } from '@/hooks/useTransactionSigning';
import { uintCV, stringAsciiCV } from '@stacks/transactions';

const { callContract } = useContractCall();

// functionArgs is now typed as ClarityValue[]
const result = await callContract(
  'ST1234...',
  'my-contract',
  'my-function',
  [uintCV(1), stringAsciiCV('test')]
);
```

## Type Safety Benefits

1. **Compile-time checks**: TypeScript will catch type errors before runtime
2. **IDE support**: Full autocomplete and inline documentation
3. **Refactoring safety**: Changes to types are caught across the codebase
4. **Documentation**: Types serve as living documentation
5. **Error prevention**: Prevents passing wrong data types to functions

## Related Files

- `/src/types/contract.ts` - Core contract type definitions
- `/src/types/transaction-signing.ts` - Transaction signing types
- `/src/lib/contracts/badgeContractUtils.ts` - Badge contract utilities
- `/src/lib/contracts/communityContractUtils.ts` - Community contract utilities
- `/src/hooks/useIssueBadge.ts` - Badge issuance hook
- `/src/hooks/useCreateCommunity.ts` - Community creation hook
- `/src/hooks/useTransactionSigning.ts` - Transaction signing hooks
