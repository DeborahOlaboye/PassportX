# Error Handling Best Practices

## Overview

PassportX uses a centralized error code system for consistent error handling across smart contracts and the frontend application.

## For Clarity Contract Developers

### 1. Use Centralized Error Codes

Always import error codes from the centralized `error-codes.clar` contract:

```clarity
;; GOOD ✓
(define-constant ERR-UNAUTHORIZED (err u104))
(asserts! (is-authorized user) ERR-UNAUTHORIZED)

;; BAD ✗
(define-constant err-unauthorized (err u104))
(asserts! (is-authorized user) (err u104))
```

### 2. Document Error Codes in Contract Headers

```clarity
;; Contract Name
;; Description
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to owner
;; - u104: ERR-UNAUTHORIZED - Insufficient permissions
;; - u600: ERR-TEMPLATE-NOT-FOUND - Template does not exist
```

### 3. Choose Appropriate Error Codes

- Use specific error codes when available
- Use general error codes as fallback
- Never reuse error codes for different meanings

### 4. Provide Context in Assertions

```clarity
;; GOOD ✓
(asserts! (> (len items) u0) ERR-BATCH-EMPTY)

;; Better with helper
(define-private (validate-batch-size (items (list 50 uint)))
  (begin
    (asserts! (> (len items) u0) ERR-BATCH-EMPTY)
    (asserts! (<= (len items) u50) ERR-BATCH-TOO-LARGE)
    (ok true)
  )
)
```

## For Frontend Developers

### 1. Use Error Code Utilities

```typescript
import {
  getErrorMessage,
  formatError,
  isPermissionError,
  parseContractError
} from '@/lib/constants'

try {
  await contract.callFunction()
} catch (error) {
  const contractError = parseContractError(error)
  const message = getErrorAdvice(contractError)
  showNotification(message)
}
```

### 2. Display User-Friendly Messages

```typescript
import { createErrorNotification } from '@/lib/utils/contractErrors'

try {
  await issueBadge(data)
} catch (error) {
  const contractError = parseContractError(error)
  const notification = createErrorNotification(contractError)
  toast.error(notification.message, { title: notification.title })
}
```

### 3. Handle Different Error Categories

```typescript
import { getErrorCategory } from '@/lib/constants'

const handleContractError = (error: unknown) => {
  const contractError = parseContractError(error)

  switch (contractError.category) {
    case 'PERMISSION':
      // Suggest checking wallet connection or permissions
      showPermissionError(contractError)
      break

    case 'VALIDATION':
      // Highlight form fields with validation issues
      showValidationError(contractError)
      break

    case 'STATE':
      // Suggest refreshing data or waiting
      showStateError(contractError)
      break

    default:
      // Generic error handling
      showGenericError(contractError)
  }
}
```

### 4. Log Errors for Debugging

```typescript
import { logContractError } from '@/lib/utils/contractErrors'

try {
  await mintBadge(recipient, templateId)
} catch (error) {
  const contractError = parseContractError(error)

  logContractError(contractError, {
    function: 'mintBadge',
    recipient,
    templateId,
    timestamp: new Date().toISOString()
  })

  // Show user-friendly error
  showError(getErrorAdvice(contractError))
}
```

## For Test Writers

### 1. Test Error Conditions

```typescript
import { ERROR_CODES } from '@/lib/constants/errorCodes'

describe('Badge Minting', () => {
  it('should fail with ERR-UNAUTHORIZED for non-issuers', async () => {
    const result = await contract.mintBadge({
      sender: unauthorizedUser,
      args: [recipient, templateId]
    })

    expect(result).toBeErr(104) // ERR-UNAUTHORIZED
  })

  it('should fail with ERR-TEMPLATE-NOT-FOUND for invalid template', async () => {
    const result = await contract.mintBadge({
      sender: authorizedIssuer,
      args: [recipient, 999999]
    })

    expect(result).toBeErr(600) // ERR-TEMPLATE-NOT-FOUND
  })
})
```

### 2. Test Error Messages

```typescript
import { getErrorMessage } from '@/lib/constants/errorCodes'

describe('Error Messages', () => {
  it('should return correct message for ERR-OWNER-ONLY', () => {
    expect(getErrorMessage(100)).toBe(
      'Only the contract owner can perform this action'
    )
  })

  it('should return correct message for ERR-BATCH-TOO-LARGE', () => {
    expect(getErrorMessage(700)).toContain('maximum limit')
  })
})
```

## Common Patterns

### Pattern 1: Owner-Only Functions

```clarity
(define-public (admin-function (param uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    ;; Function logic
    (ok true)
  )
)
```

### Pattern 2: Authorization Checks

```clarity
(define-public (restricted-function (param uint))
  (begin
    (asserts! (is-authorized tx-sender) ERR-UNAUTHORIZED)
    ;; Function logic
    (ok true)
  )
)
```

### Pattern 3: Resource Validation

```clarity
(define-public (use-resource (resource-id uint))
  (let
    (
      (resource (unwrap! (get-resource resource-id) ERR-TEMPLATE-NOT-FOUND))
    )
    (asserts! (get active resource) ERR-INACTIVE)
    ;; Use resource
    (ok true)
  )
)
```

### Pattern 4: Batch Validation

```clarity
(define-public (batch-operation (items (list 50 uint)))
  (let
    (
      (items-len (len items))
    )
    (asserts! (> items-len u0) ERR-BATCH-EMPTY)
    (asserts! (<= items-len u50) ERR-BATCH-TOO-LARGE)
    ;; Process batch
    (ok true)
  )
)
```

## Error Recovery

### Retryable Errors

Some errors are retryable (temporary failures):

```typescript
const RETRYABLE_ERRORS = [108] // ERR-OPERATION-FAILED

const executeWithRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      const contractError = parseContractError(error)

      if (!RETRYABLE_ERRORS.includes(contractError.code)) {
        throw error // Don't retry non-retryable errors
      }

      if (i === maxRetries - 1) {
        throw error // Max retries reached
      }

      await sleep(1000 * (i + 1)) // Exponential backoff
    }
  }
}
```

### User Action Required

Some errors require user action:

```typescript
const requiresUserAction = (errorCode: number): boolean => {
  const actionRequiredCodes = [
    100, // Need contract owner
    104, // Need authorization
    300, // Community not found - select different community
    600, // Template not found - select different template
    700, // Batch too large - reduce size
    701, // Batch empty - add items
    702  // Array mismatch - fix arrays
  ]

  return actionRequiredCodes.includes(errorCode)
}
```

## Resources

- [Full Error Codes Reference](../docs/ERROR_CODES.md)
- [Quick Reference Summary](../docs/ERROR_CODES_SUMMARY.md)
- [Migration Guide](../docs/ERROR_CODES_MIGRATION.md)
- [Contract README](../contracts/README.md)

## Support

For questions or issues:
- Check the documentation above
- Review example code in `/contracts` and `/src`
- Open an issue on GitHub with error code and context
