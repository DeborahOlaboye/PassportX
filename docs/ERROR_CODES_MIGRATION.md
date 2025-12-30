# Error Codes Migration Guide

This guide explains how to migrate from the old error code system to the new centralized error code system.

## Overview

PassportX has migrated from inline and inconsistent error codes to a centralized error code system with well-defined ranges and descriptive documentation.

## What Changed

### Before (Old System)

**Inconsistent Error Codes:**
```clarity
;; Different contracts used different codes for similar errors
;; badge-issuer.clar
(define-constant err-unauthorized (err u104))
(define-constant err-invalid-template (err u105))
(define-constant err-mismatched-array-lengths (err u107))

;; community-manager.clar
(define-constant err-community-not-found (err u107))  ;; Conflict!
(define-constant err-already-exists (err u108))  ;; Conflict!

;; badge-metadata.clar - Inline errors
(asserts! (is-eq len1 len2) (err u201))  ;; No constant
(asserts! (<= size u50) (err u202))  ;; No constant
```

**Problems:**
- ❌ Overlapping error codes (u107, u108)
- ❌ Inconsistent naming conventions
- ❌ Some inline, some as constants
- ❌ No descriptive comments
- ❌ No centralized documentation

### After (New System)

**Centralized Error Codes:**
```clarity
;; All error codes in contracts/error-codes.clar
;; With descriptive comments and organized ranges

;; Badge-issuer uses proper imports
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-TEMPLATE-NOT-FOUND (err u600))
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))

;; Community-manager uses non-conflicting codes
(define-constant ERR-COMMUNITY-NOT-FOUND (err u300))
(define-constant ERR-COMMUNITY-ALREADY-EXISTS (err u304))

;; Badge-metadata uses constants instead of inline
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))
(define-constant ERR-BATCH-TOO-LARGE (err u700))
```

**Benefits:**
- ✅ No code conflicts
- ✅ Consistent naming (ERR-*)
- ✅ All errors as constants
- ✅ Comprehensive documentation
- ✅ Clear error categories

## Error Code Mapping

| Old Code | Old Context | New Code | New Name |
|----------|-------------|----------|----------|
| u100 | General | u100 | ERR-OWNER-ONLY |
| u101 | NFT | u101 | ERR-NOT-TOKEN-OWNER |
| u102 | General | u102 | ERR-NOT-FOUND |
| u103 | NFT | u103 | ERR-TRANSFER-DISABLED |
| u104 | General | u104 | ERR-UNAUTHORIZED |
| u105 | Badge | u601 | ERR-INVALID-TEMPLATE |
| u106 | Badge | u201 | ERR-BADGE-MINTING-FAILED |
| u107 | Badge | u702 | ERR-BATCH-MISMATCHED-LENGTHS |
| u107 | Community | u300 | ERR-COMMUNITY-NOT-FOUND |
| u108 | Badge | u700 | ERR-BATCH-TOO-LARGE |
| u108 | Community | u304 | ERR-COMMUNITY-ALREADY-EXISTS |
| u109 | Badge | u701 | ERR-BATCH-EMPTY |
| u109 | Access | u401 | ERR-INVALID-ROLE |
| u110 | Badge | u204 | ERR-INVALID-RECIPIENT |
| u111 | Badge | u601 | ERR-INVALID-TEMPLATE |
| u201 | Metadata | u702 | ERR-BATCH-MISMATCHED-LENGTHS |
| u202 | Metadata | u700 | ERR-BATCH-TOO-LARGE |
| u203 | Metadata | u701 | ERR-BATCH-EMPTY |
| u204 | Metadata | u705 | ERR-INVALID-BATCH-INDEX |
| u205 | Metadata | u501 | ERR-INVALID-METADATA |

## Migration Steps

### For Contract Developers

1. **Review Error Usage**
   ```bash
   # Find all error code usage in your contract
   grep -n "err u" contracts/your-contract.clar
   ```

2. **Update Error Constants**
   ```clarity
   ;; OLD
   (define-constant err-unauthorized (err u104))

   ;; NEW
   (define-constant ERR-UNAUTHORIZED (err u104))
   ```

3. **Update Error References**
   ```clarity
   ;; OLD
   (asserts! (is-authorized user) err-unauthorized)

   ;; NEW
   (asserts! (is-authorized user) ERR-UNAUTHORIZED)
   ```

4. **Add Error Documentation**
   ```clarity
   ;; Add to contract header:
   ;;
   ;; Error Codes Used:
   ;; - u100: ERR-OWNER-ONLY - Description
   ;; - u104: ERR-UNAUTHORIZED - Description
   ```

5. **Replace Inline Errors**
   ```clarity
   ;; OLD
   (asserts! (> len u0) (err u203))

   ;; NEW
   (define-constant ERR-BATCH-EMPTY (err u701))
   (asserts! (> len u0) ERR-BATCH-EMPTY)
   ```

### For Frontend Developers

1. **Import Error Code Map**
   ```typescript
   import { ERROR_CODES, getErrorMessage, formatError } from '@/lib/constants/errorCodes'
   ```

2. **Update Error Handling**
   ```typescript
   // OLD
   if (error.code === 100) {
     showError("Permission denied")
   }

   // NEW
   import { getErrorMessage } from '@/lib/constants/errorCodes'

   if (error.code) {
     showError(getErrorMessage(error.code))
   }
   ```

3. **Use Helper Functions**
   ```typescript
   import { formatError, isPermissionError } from '@/lib/constants/errorCodes'

   const message = formatError(error.code)  // "Message (ERR-CODE)"
   const isPermError = isPermissionError(error.code)  // true/false
   ```

### For Test Writers

1. **Use Named Constants**
   ```typescript
   // OLD
   expect(result).toBeErr(107)

   // NEW
   import { ERROR_CODES } from '@/lib/constants/errorCodes'

   expect(result).toBeErr(702)  // ERR-BATCH-MISMATCHED-LENGTHS
   ```

2. **Test Error Messages**
   ```typescript
   import { getErrorMessage } from '@/lib/constants/errorCodes'

   it('should return proper error message', () => {
     expect(getErrorMessage(100)).toBe('Only the contract owner can perform this action')
   })
   ```

## Backward Compatibility

The migration maintains backward compatibility:

- ✅ Common error codes (u100-u109) remain unchanged
- ✅ Only contract-specific codes were reorganized
- ✅ Error numbers in ranges avoid existing deployed contracts
- ✅ No changes to contract interfaces

## Testing Migration

### 1. Run Contract Tests
```bash
npm run test:contracts
```

### 2. Check for Conflicts
```bash
# Find any remaining old-style error codes
grep -r "err-" contracts/
grep -r "(err u[0-9]" contracts/ | grep -v "ERR-"
```

### 3. Verify Frontend Integration
```bash
npm run test
npm run typecheck
```

## Common Issues

### Issue: Old Error Code References

**Problem:**
```clarity
(asserts! condition err-not-found)  ;; Old style
```

**Solution:**
```clarity
(asserts! condition ERR-NOT-FOUND)  ;; New style
```

### Issue: Inline Error Codes

**Problem:**
```clarity
(asserts! (> x u0) (err u203))
```

**Solution:**
```clarity
(define-constant ERR-BATCH-EMPTY (err u701))
(asserts! (> x u0) ERR-BATCH-EMPTY)
```

### Issue: Conflicting Error Codes

**Problem:**
```clarity
;; Two different meanings for u107
(define-constant err-batch-issue (err u107))  ;; Badge context
(define-constant err-not-found (err u107))    ;; Community context
```

**Solution:**
```clarity
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))
(define-constant ERR-COMMUNITY-NOT-FOUND (err u300))
```

## Checklist

- [ ] Update all error constant names to ERR-* format
- [ ] Replace inline error codes with named constants
- [ ] Add error documentation to contract headers
- [ ] Update all error code references in contract functions
- [ ] Update frontend error handling
- [ ] Update test assertions
- [ ] Run full test suite
- [ ] Update documentation

## Resources

- [Error Codes Reference](./ERROR_CODES.md) - Complete error code documentation
- [contracts/error-codes.clar](../contracts/error-codes.clar) - Central error definitions
- [src/lib/constants/errorCodes.ts](../src/lib/constants/errorCodes.ts) - Frontend error mapping

## Support

If you encounter issues during migration:

1. Check the [Error Codes Reference](./ERROR_CODES.md)
2. Review example contracts in `/contracts`
3. Open an issue on GitHub

## Version History

- **v1.0.0** - Initial centralized error code system
- Migration completed: 2025-12-30
