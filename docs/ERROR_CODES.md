# PassportX Error Codes Reference

This document provides a comprehensive reference for all error codes used across the PassportX smart contract ecosystem.

## Overview

PassportX uses a centralized error code system with ranges allocated to different functional areas. All error codes are defined in `contracts/error-codes.clar` and imported by individual contracts.

## Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| u100-u199 | General/Common | Basic errors applicable across all contracts |
| u200-u299 | NFT/Badge | Badge-specific operations and NFT handling |
| u300-u399 | Community | Community management and membership |
| u400-u499 | Access Control | Permissions and role management |
| u500-u599 | Metadata | Badge metadata operations |
| u600-u699 | Template | Badge template management |
| u700-u799 | Batch Operations | Bulk/batch processing operations |

## Error Codes by Category

### General Errors (u100-u199)

#### ERR-OWNER-ONLY (u100)
- **Description**: Action can only be performed by the contract owner
- **Usage**: When a function is restricted to contract owner only
- **Contracts**: badge-issuer, community-manager, badge-metadata, passport-nft, access-control
- **Example**:
  ```clarity
  (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
  ```

#### ERR-NOT-TOKEN-OWNER (u101)
- **Description**: Caller is not the owner of the specified token
- **Usage**: When attempting operations on tokens not owned by caller
- **Contracts**: passport-nft
- **Example**:
  ```clarity
  (asserts! (is-eq tx-sender token-owner) ERR-NOT-TOKEN-OWNER)
  ```

#### ERR-NOT-FOUND (u102)
- **Description**: Requested resource was not found
- **Usage**: When querying for non-existent data
- **Contracts**: passport-nft
- **Example**:
  ```clarity
  (unwrap! (map-get? data { id: id }) ERR-NOT-FOUND)
  ```

#### ERR-TRANSFER-DISABLED (u103)
- **Description**: Transfer operation is disabled for non-transferable NFTs
- **Usage**: When attempting to transfer soulbound NFTs
- **Contracts**: passport-nft
- **Example**:
  ```clarity
  (asserts! false ERR-TRANSFER-DISABLED)
  ```

#### ERR-UNAUTHORIZED (u104)
- **Description**: Caller is not authorized to perform this action
- **Usage**: When user lacks required permissions
- **Contracts**: badge-issuer, community-manager
- **Example**:
  ```clarity
  (asserts! (is-authorized-issuer tx-sender) ERR-UNAUTHORIZED)
  ```

#### ERR-INVALID-INPUT (u105)
- **Description**: Input parameter is invalid or malformed
- **Usage**: When function receives invalid parameters
- **Example**:
  ```clarity
  (asserts! (> value u0) ERR-INVALID-INPUT)
  ```

#### ERR-ALREADY-EXISTS (u106)
- **Description**: Resource already exists and cannot be created again
- **Usage**: When attempting to create duplicate resources
- **Example**:
  ```clarity
  (asserts! (is-none existing-resource) ERR-ALREADY-EXISTS)
  ```

#### ERR-INACTIVE (u107)
- **Description**: Resource is inactive or deactivated
- **Usage**: When attempting operations on deactivated resources
- **Example**:
  ```clarity
  (asserts! (get active resource) ERR-INACTIVE)
  ```

#### ERR-OPERATION-FAILED (u108)
- **Description**: Operation failed to complete
- **Usage**: When an operation fails for unspecified reasons
- **Example**:
  ```clarity
  (try! operation ERR-OPERATION-FAILED)
  ```

#### ERR-INVALID-STATE (u109)
- **Description**: Resource is in an invalid state for this operation
- **Usage**: When resource state prevents the operation
- **Example**:
  ```clarity
  (asserts! (is-eq state "ready") ERR-INVALID-STATE)
  ```

### NFT/Badge Errors (u200-u299)

#### ERR-INVALID-BADGE (u200)
- **Description**: Badge ID is invalid or does not exist
- **Usage**: When referencing non-existent badge

#### ERR-BADGE-MINTING-FAILED (u201)
- **Description**: Badge minting operation failed
- **Usage**: When NFT minting fails

#### ERR-BADGE-ALREADY-ISSUED (u202)
- **Description**: Badge has already been issued to this recipient
- **Usage**: When preventing duplicate badge issuance

#### ERR-BADGE-REVOKED (u203)
- **Description**: Badge has been revoked and is no longer active
- **Usage**: When attempting operations on revoked badges

#### ERR-INVALID-RECIPIENT (u204)
- **Description**: Badge recipient address is invalid
- **Usage**: When recipient principal is invalid
- **Contracts**: badge-issuer
- **Example**:
  ```clarity
  (unwrap! (element-at recipients i) ERR-INVALID-RECIPIENT)
  ```

#### ERR-INVALID-LEVEL (u205)
- **Description**: Badge level is outside valid range (1-5)
- **Usage**: When badge level validation fails

#### ERR-INVALID-CATEGORY (u206)
- **Description**: Badge category is invalid
- **Usage**: When category ID doesn't match valid categories

### Community Errors (u300-u399)

#### ERR-COMMUNITY-NOT-FOUND (u300)
- **Description**: Community with specified ID does not exist
- **Usage**: When querying or operating on non-existent community
- **Contracts**: community-manager
- **Example**:
  ```clarity
  (unwrap! (map-get? communities { community-id: id }) ERR-COMMUNITY-NOT-FOUND)
  ```

#### ERR-NOT-COMMUNITY-OWNER (u301)
- **Description**: Caller is not the owner of this community
- **Usage**: When non-owners attempt owner-only operations
- **Contracts**: community-manager
- **Example**:
  ```clarity
  (asserts! (is-eq tx-sender (get owner community)) ERR-NOT-COMMUNITY-OWNER)
  ```

#### ERR-NOT-COMMUNITY-MEMBER (u302)
- **Description**: User is not a member of this community
- **Usage**: When non-members attempt member-only operations

#### ERR-COMMUNITY-INACTIVE (u303)
- **Description**: Community is deactivated
- **Usage**: When attempting operations on inactive communities

#### ERR-COMMUNITY-ALREADY-EXISTS (u304)
- **Description**: Community with this identifier already exists
- **Usage**: When creating duplicate communities
- **Contracts**: community-manager

#### ERR-INVALID-COMMUNITY-NAME (u305)
- **Description**: Community name is invalid or violates constraints
- **Usage**: When community name validation fails

#### ERR-MEMBER-ALREADY-EXISTS (u306)
- **Description**: User is already a member of this community
- **Usage**: When adding duplicate members

#### ERR-MEMBER-LIMIT-REACHED (u307)
- **Description**: Community has reached maximum member limit
- **Usage**: When community member capacity is exceeded

### Access Control Errors (u400-u499)

#### ERR-INSUFFICIENT-PERMISSIONS (u400)
- **Description**: User lacks required permissions for this action
- **Usage**: When permission check fails
- **Contracts**: access-control
- **Example**:
  ```clarity
  (asserts! (can-manage-members user) ERR-INSUFFICIENT-PERMISSIONS)
  ```

#### ERR-INVALID-ROLE (u401)
- **Description**: Specified role is invalid or does not exist
- **Usage**: When role validation fails
- **Contracts**: access-control

#### ERR-ROLE-ASSIGNMENT-FAILED (u402)
- **Description**: Failed to assign role to user
- **Usage**: When role assignment operation fails

#### ERR-ACCOUNT-SUSPENDED (u403)
- **Description**: User account is suspended
- **Usage**: When suspended users attempt operations
- **Contracts**: access-control

#### ERR-PERMISSION-DENIED (u404)
- **Description**: Permission explicitly denied for this action
- **Usage**: When access is explicitly forbidden

#### ERR-NOT-PLATFORM-ADMIN (u405)
- **Description**: Caller is not a platform administrator
- **Usage**: When admin-only operations are attempted by non-admins
- **Contracts**: access-control
- **Example**:
  ```clarity
  (asserts! (is-platform-admin tx-sender) ERR-NOT-PLATFORM-ADMIN)
  ```

### Metadata Errors (u500-u599)

#### ERR-METADATA-NOT-FOUND (u500)
- **Description**: Metadata for specified badge does not exist
- **Usage**: When querying non-existent metadata
- **Contracts**: badge-metadata

#### ERR-INVALID-METADATA (u501)
- **Description**: Metadata structure or values are invalid
- **Usage**: When metadata validation fails
- **Contracts**: badge-metadata
- **Example**:
  ```clarity
  (unwrap! (element-at metadatas i) ERR-INVALID-METADATA)
  ```

#### ERR-METADATA-UPDATE-FAILED (u502)
- **Description**: Failed to update badge metadata
- **Usage**: When metadata update operation fails

#### ERR-METADATA-LOCKED (u503)
- **Description**: Metadata is locked and cannot be modified
- **Usage**: When attempting to modify immutable metadata

### Template Errors (u600-u699)

#### ERR-TEMPLATE-NOT-FOUND (u600)
- **Description**: Badge template with specified ID does not exist
- **Usage**: When querying or using non-existent templates
- **Contracts**: badge-issuer
- **Example**:
  ```clarity
  (unwrap! (get-badge-template template-id) ERR-TEMPLATE-NOT-FOUND)
  ```

#### ERR-INVALID-TEMPLATE (u601)
- **Description**: Template data is invalid or malformed
- **Usage**: When template validation fails
- **Contracts**: badge-issuer
- **Example**:
  ```clarity
  (unwrap! (element-at template-ids i) ERR-INVALID-TEMPLATE)
  ```

#### ERR-TEMPLATE-INACTIVE (u602)
- **Description**: Template is deactivated and cannot be used
- **Usage**: When using inactive templates

#### ERR-TEMPLATE-ALREADY-EXISTS (u603)
- **Description**: Template with this identifier already exists
- **Usage**: When creating duplicate templates

#### ERR-INVALID-TEMPLATE-NAME (u604)
- **Description**: Template name is invalid or violates constraints
- **Usage**: When template name validation fails

#### ERR-INVALID-TEMPLATE-DESCRIPTION (u605)
- **Description**: Template description is invalid or too long
- **Usage**: When description validation fails

### Batch Operation Errors (u700-u799)

#### ERR-BATCH-TOO-LARGE (u700)
- **Description**: Batch size exceeds maximum allowed limit
- **Usage**: When batch operations exceed size limits
- **Contracts**: badge-issuer, badge-metadata
- **Example**:
  ```clarity
  (asserts! (<= batch-size u50) ERR-BATCH-TOO-LARGE)
  ```

#### ERR-BATCH-EMPTY (u701)
- **Description**: Batch operation received empty array
- **Usage**: When batch array has no elements
- **Contracts**: badge-issuer, badge-metadata
- **Example**:
  ```clarity
  (asserts! (> (len items) u0) ERR-BATCH-EMPTY)
  ```

#### ERR-BATCH-MISMATCHED-LENGTHS (u702)
- **Description**: Batch arrays have different lengths
- **Usage**: When parallel arrays don't match in size
- **Contracts**: badge-issuer, badge-metadata
- **Example**:
  ```clarity
  (asserts! (is-eq (len array1) (len array2)) ERR-BATCH-MISMATCHED-LENGTHS)
  ```

#### ERR-BATCH-OPERATION-FAILED (u703)
- **Description**: One or more batch operations failed
- **Usage**: When batch processing encounters errors

#### ERR-BATCH-PARTIAL-SUCCESS (u704)
- **Description**: Some batch operations succeeded, others failed
- **Usage**: When batch has mixed results

#### ERR-INVALID-BATCH-INDEX (u705)
- **Description**: Batch index is out of bounds
- **Usage**: When accessing invalid array indices
- **Contracts**: badge-metadata
- **Example**:
  ```clarity
  (unwrap! (element-at array index) ERR-INVALID-BATCH-INDEX)
  ```

## Usage Guidelines

### 1. Choosing the Right Error Code

- Use specific error codes when available
- Fall back to general error codes when no specific code exists
- Consider creating new error codes for new error scenarios

### 2. Error Messages in Frontend

When displaying errors to users, map error codes to user-friendly messages:

```typescript
const ERROR_MESSAGES = {
  100: "Only the contract owner can perform this action",
  104: "You don't have permission to perform this action",
  300: "Community not found",
  600: "Badge template not found",
  700: "Batch size is too large (max: 50)",
  // ... etc
}
```

### 3. Backward Compatibility

The centralized error code system is backward compatible with existing contracts. Old error codes have been mapped to their new equivalents.

## Testing Error Codes

When writing tests, always verify error codes:

```typescript
it('should return ERR-UNAUTHORIZED for non-owner', async () => {
  const result = await contract.ownerOnlyFunction({ sender: nonOwner })
  expect(result).toBeErr(100) // ERR-OWNER-ONLY
})
```

## Future Additions

When adding new error codes:

1. Choose the appropriate range based on the error category
2. Add the code to `contracts/error-codes.clar`
3. Document it in this file
4. Update affected contracts
5. Add tests for the new error scenario

## Related Files

- `contracts/error-codes.clar` - Central error code definitions
- `contracts/badge-issuer.clar` - Badge issuance errors
- `contracts/badge-metadata.clar` - Metadata errors
- `contracts/community-manager.clar` - Community errors
- `contracts/passport-nft.clar` - NFT errors
- `contracts/access-control.clar` - Permission errors

## Support

For questions or issues regarding error codes, please open an issue on GitHub.
