# Type Safety Guide

## Overview

This guide documents the type safety improvements made to eliminate `any` types from the codebase.

## Progress

- **Initial**: ~196 instances of `any` type
- **Current**: ~164 instances remaining
- **Fixed**: 32+ instances across 10+ files

## Fixed Files

1. `src/types/transaction-signing.ts` - ClarityValue[] for function args
2. `src/types/chainhook.ts` - Specific types for metadata
3. `src/contexts/NotificationContext.tsx` - NotificationData interface
4. `src/utils/eventHandlerRegistry.ts` - EventContext and ActionData
5. `src/utils/sessionTokens.ts` - unknown for type guards
6. `src/utils/networkManager.ts` - Generic types for HTTP methods
7. `src/utils/mobileWalletConnectionManager.ts` - WalletConnectionData
8. `src/utils/retry.ts` - Error | unknown
9. `src/utils/transactionValidation.ts` - unknown[] for args
10. `src/app/admin/page.tsx` - Community and RecentBadge interfaces

## Type Patterns

### Use `unknown` instead of `any`

```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

### Use Generic Types

```typescript
// ❌ Bad
async function get(url: string): Promise<any> {}

// ✅ Good
async function get<T>(url: string): Promise<T> {}
```

### Create Specific Interfaces

```typescript
// ❌ Bad
interface Response {
  data: any;
}

// ✅ Good
interface Response<T> {
  data: T;
}
```

## ESLint Configuration

- `@typescript-eslint/no-explicit-any`: `error`
- Prevents new `any` types from being added

## TypeScript Configuration

- `noImplicitAny`: true
- `strictNullChecks`: true
- `strictFunctionTypes`: true

## Next Steps

Continue replacing remaining `any` types in:

- Test files
- Component props
- Event handlers
- API responses

Related to #146
