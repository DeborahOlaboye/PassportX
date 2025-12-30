# Error Codes System - Quick Reference

## Quick Lookup Table

| Code | Name | Message | Contracts |
|------|------|---------|-----------|
| **General (100-199)** ||||
| 100 | ERR-OWNER-ONLY | Only contract owner can perform this action | All |
| 101 | ERR-NOT-TOKEN-OWNER | Not the token owner | passport-nft |
| 102 | ERR-NOT-FOUND | Resource not found | passport-nft |
| 103 | ERR-TRANSFER-DISABLED | Transfers disabled | passport-nft |
| 104 | ERR-UNAUTHORIZED | Not authorized | badge-issuer, community-manager |
| **NFT/Badge (200-299)** ||||
| 204 | ERR-INVALID-RECIPIENT | Invalid recipient address | badge-issuer |
| **Community (300-399)** ||||
| 300 | ERR-COMMUNITY-NOT-FOUND | Community not found | community-manager |
| 301 | ERR-NOT-COMMUNITY-OWNER | Not the community owner | community-manager |
| 304 | ERR-COMMUNITY-ALREADY-EXISTS | Community already exists | community-manager |
| **Access Control (400-499)** ||||
| 400 | ERR-INSUFFICIENT-PERMISSIONS | Insufficient permissions | access-control |
| 401 | ERR-INVALID-ROLE | Invalid role | access-control |
| 403 | ERR-ACCOUNT-SUSPENDED | Account suspended | access-control |
| 405 | ERR-NOT-PLATFORM-ADMIN | Not a platform admin | access-control |
| **Metadata (500-599)** ||||
| 500 | ERR-METADATA-NOT-FOUND | Metadata not found | badge-metadata |
| 501 | ERR-INVALID-METADATA | Invalid metadata | badge-metadata |
| **Template (600-699)** ||||
| 600 | ERR-TEMPLATE-NOT-FOUND | Template not found | badge-issuer |
| 601 | ERR-INVALID-TEMPLATE | Invalid template | badge-issuer |
| **Batch (700-799)** ||||
| 700 | ERR-BATCH-TOO-LARGE | Batch too large (max 50) | badge-issuer, badge-metadata |
| 701 | ERR-BATCH-EMPTY | Batch cannot be empty | badge-issuer, badge-metadata |
| 702 | ERR-BATCH-MISMATCHED-LENGTHS | Array length mismatch | badge-issuer, badge-metadata |
| 705 | ERR-INVALID-BATCH-INDEX | Invalid batch index | badge-metadata |

## By Contract

### badge-issuer.clar
- 100, 104, 204, 600, 601, 700, 701, 702

### badge-metadata.clar
- 100, 500, 501, 700, 701, 702, 705

### community-manager.clar
- 100, 104, 300, 301, 304

### passport-nft.clar
- 100, 101, 102, 103

### access-control.clar
- 100, 400, 401, 403, 405

## By Category

### Permission Errors
- 100, 101, 104, 301, 400, 403, 404, 405

### Validation Errors
- 105, 204, 305, 401, 501, 601, 604, 605, 701, 702, 705

### State Errors
- 107, 109, 303, 503, 602

### Not Found Errors
- 102, 300, 500, 600

### Operation Errors
- 103, 108, 201, 402, 502, 703, 704

## Common Use Cases

### User Not Authorized
```clarity
(asserts! (is-authorized tx-sender) ERR-UNAUTHORIZED)  ;; 104
```

### Resource Not Found
```clarity
(unwrap! (get-resource id) ERR-TEMPLATE-NOT-FOUND)  ;; 600
```

### Batch Validation
```clarity
(asserts! (is-eq len1 len2) ERR-BATCH-MISMATCHED-LENGTHS)  ;; 702
(asserts! (<= size u50) ERR-BATCH-TOO-LARGE)  ;; 700
(asserts! (> size u0) ERR-BATCH-EMPTY)  ;; 701
```

### Owner Only
```clarity
(asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)  ;; 100
```

## Frontend Integration

```typescript
import { getErrorMessage, formatError } from '@/lib/constants/errorCodes'

// Get message
const message = getErrorMessage(100)
// "Only the contract owner can perform this action"

// Format with code
const formatted = formatError(100)
// "Only the contract owner can perform this action (ERR-OWNER-ONLY)"
```

## See Also

- [Full Error Codes Reference](./ERROR_CODES.md)
- [Migration Guide](./ERROR_CODES_MIGRATION.md)
- [Contracts README](../contracts/README.md)
