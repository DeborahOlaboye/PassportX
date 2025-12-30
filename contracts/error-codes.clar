;; PassportX Error Codes
;; Centralized error code definitions for the PassportX ecosystem
;;
;; Error Code Ranges:
;; - u100-u199: General/Common errors
;; - u200-u299: NFT/Badge-specific errors
;; - u300-u399: Community-specific errors
;; - u400-u499: Access control errors
;; - u500-u599: Metadata errors
;; - u600-u699: Template errors
;; - u700-u799: Batch operation errors

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; General Errors (u100-u199)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-OWNER-ONLY (u100)
;; Description: Action can only be performed by the contract owner
;; Usage: When a function is restricted to contract owner only
(define-constant ERR-OWNER-ONLY (err u100))

;; ERR-NOT-TOKEN-OWNER (u101)
;; Description: Caller is not the owner of the specified token
;; Usage: When attempting operations on tokens not owned by caller
(define-constant ERR-NOT-TOKEN-OWNER (err u101))

;; ERR-NOT-FOUND (u102)
;; Description: Requested resource was not found
;; Usage: When querying for non-existent data
(define-constant ERR-NOT-FOUND (err u102))

;; ERR-TRANSFER-DISABLED (u103)
;; Description: Transfer operation is disabled for non-transferable NFTs
;; Usage: When attempting to transfer soulbound NFTs
(define-constant ERR-TRANSFER-DISABLED (err u103))

;; ERR-UNAUTHORIZED (u104)
;; Description: Caller is not authorized to perform this action
;; Usage: When user lacks required permissions
(define-constant ERR-UNAUTHORIZED (err u104))

;; ERR-INVALID-INPUT (u105)
;; Description: Input parameter is invalid or malformed
;; Usage: When function receives invalid parameters
(define-constant ERR-INVALID-INPUT (err u105))

;; ERR-ALREADY-EXISTS (u106)
;; Description: Resource already exists and cannot be created again
;; Usage: When attempting to create duplicate resources
(define-constant ERR-ALREADY-EXISTS (err u106))

;; ERR-INACTIVE (u107)
;; Description: Resource is inactive or deactivated
;; Usage: When attempting operations on deactivated resources
(define-constant ERR-INACTIVE (err u107))

;; ERR-OPERATION-FAILED (u108)
;; Description: Operation failed to complete
;; Usage: When an operation fails for unspecified reasons
(define-constant ERR-OPERATION-FAILED (err u108))

;; ERR-INVALID-STATE (u109)
;; Description: Resource is in an invalid state for this operation
;; Usage: When resource state prevents the operation
(define-constant ERR-INVALID-STATE (err u109))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; NFT/Badge Errors (u200-u299)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-INVALID-BADGE (u200)
;; Description: Badge ID is invalid or does not exist
;; Usage: When referencing non-existent badge
(define-constant ERR-INVALID-BADGE (err u200))

;; ERR-BADGE-MINTING-FAILED (u201)
;; Description: Badge minting operation failed
;; Usage: When NFT minting fails
(define-constant ERR-BADGE-MINTING-FAILED (err u201))

;; ERR-BADGE-ALREADY-ISSUED (u202)
;; Description: Badge has already been issued to this recipient
;; Usage: When preventing duplicate badge issuance
(define-constant ERR-BADGE-ALREADY-ISSUED (err u202))

;; ERR-BADGE-REVOKED (u203)
;; Description: Badge has been revoked and is no longer active
;; Usage: When attempting operations on revoked badges
(define-constant ERR-BADGE-REVOKED (err u203))

;; ERR-INVALID-RECIPIENT (u204)
;; Description: Badge recipient address is invalid
;; Usage: When recipient principal is invalid
(define-constant ERR-INVALID-RECIPIENT (err u204))

;; ERR-INVALID-LEVEL (u205)
;; Description: Badge level is outside valid range (1-5)
;; Usage: When badge level validation fails
(define-constant ERR-INVALID-LEVEL (err u205))

;; ERR-INVALID-CATEGORY (u206)
;; Description: Badge category is invalid
;; Usage: When category ID doesn't match valid categories
(define-constant ERR-INVALID-CATEGORY (err u206))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Community Errors (u300-u399)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-COMMUNITY-NOT-FOUND (u300)
;; Description: Community with specified ID does not exist
;; Usage: When querying or operating on non-existent community
(define-constant ERR-COMMUNITY-NOT-FOUND (err u300))

;; ERR-NOT-COMMUNITY-OWNER (u301)
;; Description: Caller is not the owner of this community
;; Usage: When non-owners attempt owner-only operations
(define-constant ERR-NOT-COMMUNITY-OWNER (err u301))

;; ERR-NOT-COMMUNITY-MEMBER (u302)
;; Description: User is not a member of this community
;; Usage: When non-members attempt member-only operations
(define-constant ERR-NOT-COMMUNITY-MEMBER (err u302))

;; ERR-COMMUNITY-INACTIVE (u303)
;; Description: Community is deactivated
;; Usage: When attempting operations on inactive communities
(define-constant ERR-COMMUNITY-INACTIVE (err u303))

;; ERR-COMMUNITY-ALREADY-EXISTS (u304)
;; Description: Community with this identifier already exists
;; Usage: When creating duplicate communities
(define-constant ERR-COMMUNITY-ALREADY-EXISTS (err u304))

;; ERR-INVALID-COMMUNITY-NAME (u305)
;; Description: Community name is invalid or violates constraints
;; Usage: When community name validation fails
(define-constant ERR-INVALID-COMMUNITY-NAME (err u305))

;; ERR-MEMBER-ALREADY-EXISTS (u306)
;; Description: User is already a member of this community
;; Usage: When adding duplicate members
(define-constant ERR-MEMBER-ALREADY-EXISTS (err u306))

;; ERR-MEMBER-LIMIT-REACHED (u307)
;; Description: Community has reached maximum member limit
;; Usage: When community member capacity is exceeded
(define-constant ERR-MEMBER-LIMIT-REACHED (err u307))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Access Control Errors (u400-u499)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-INSUFFICIENT-PERMISSIONS (u400)
;; Description: User lacks required permissions for this action
;; Usage: When permission check fails
(define-constant ERR-INSUFFICIENT-PERMISSIONS (err u400))

;; ERR-INVALID-ROLE (u401)
;; Description: Specified role is invalid or does not exist
;; Usage: When role validation fails
(define-constant ERR-INVALID-ROLE (err u401))

;; ERR-ROLE-ASSIGNMENT-FAILED (u402)
;; Description: Failed to assign role to user
;; Usage: When role assignment operation fails
(define-constant ERR-ROLE-ASSIGNMENT-FAILED (err u402))

;; ERR-ACCOUNT-SUSPENDED (u403)
;; Description: User account is suspended
;; Usage: When suspended users attempt operations
(define-constant ERR-ACCOUNT-SUSPENDED (err u403))

;; ERR-PERMISSION-DENIED (u404)
;; Description: Permission explicitly denied for this action
;; Usage: When access is explicitly forbidden
(define-constant ERR-PERMISSION-DENIED (err u404))

;; ERR-NOT-PLATFORM-ADMIN (u405)
;; Description: Caller is not a platform administrator
;; Usage: When admin-only operations are attempted by non-admins
(define-constant ERR-NOT-PLATFORM-ADMIN (err u405))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Metadata Errors (u500-u599)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-METADATA-NOT-FOUND (u500)
;; Description: Metadata for specified badge does not exist
;; Usage: When querying non-existent metadata
(define-constant ERR-METADATA-NOT-FOUND (err u500))

;; ERR-INVALID-METADATA (u501)
;; Description: Metadata structure or values are invalid
;; Usage: When metadata validation fails
(define-constant ERR-INVALID-METADATA (err u501))

;; ERR-METADATA-UPDATE-FAILED (u502)
;; Description: Failed to update badge metadata
;; Usage: When metadata update operation fails
(define-constant ERR-METADATA-UPDATE-FAILED (err u502))

;; ERR-METADATA-LOCKED (u503)
;; Description: Metadata is locked and cannot be modified
;; Usage: When attempting to modify immutable metadata
(define-constant ERR-METADATA-LOCKED (err u503))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Template Errors (u600-u699)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-TEMPLATE-NOT-FOUND (u600)
;; Description: Badge template with specified ID does not exist
;; Usage: When querying or using non-existent templates
(define-constant ERR-TEMPLATE-NOT-FOUND (err u600))

;; ERR-INVALID-TEMPLATE (u601)
;; Description: Template data is invalid or malformed
;; Usage: When template validation fails
(define-constant ERR-INVALID-TEMPLATE (err u601))

;; ERR-TEMPLATE-INACTIVE (u602)
;; Description: Template is deactivated and cannot be used
;; Usage: When using inactive templates
(define-constant ERR-TEMPLATE-INACTIVE (err u602))

;; ERR-TEMPLATE-ALREADY-EXISTS (u603)
;; Description: Template with this identifier already exists
;; Usage: When creating duplicate templates
(define-constant ERR-TEMPLATE-ALREADY-EXISTS (err u603))

;; ERR-INVALID-TEMPLATE-NAME (u604)
;; Description: Template name is invalid or violates constraints
;; Usage: When template name validation fails
(define-constant ERR-INVALID-TEMPLATE-NAME (err u604))

;; ERR-INVALID-TEMPLATE-DESCRIPTION (u605)
;; Description: Template description is invalid or too long
;; Usage: When description validation fails
(define-constant ERR-INVALID-TEMPLATE-DESCRIPTION (err u605))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Batch Operation Errors (u700-u799)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; ERR-BATCH-TOO-LARGE (u700)
;; Description: Batch size exceeds maximum allowed limit
;; Usage: When batch operations exceed size limits
(define-constant ERR-BATCH-TOO-LARGE (err u700))

;; ERR-BATCH-EMPTY (u701)
;; Description: Batch operation received empty array
;; Usage: When batch array has no elements
(define-constant ERR-BATCH-EMPTY (err u701))

;; ERR-BATCH-MISMATCHED-LENGTHS (u702)
;; Description: Batch arrays have different lengths
;; Usage: When parallel arrays don't match in size
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))

;; ERR-BATCH-OPERATION-FAILED (u703)
;; Description: One or more batch operations failed
;; Usage: When batch processing encounters errors
(define-constant ERR-BATCH-OPERATION-FAILED (err u703))

;; ERR-BATCH-PARTIAL-SUCCESS (u704)
;; Description: Some batch operations succeeded, others failed
;; Usage: When batch has mixed results
(define-constant ERR-BATCH-PARTIAL-SUCCESS (err u704))

;; ERR-INVALID-BATCH-INDEX (u705)
;; Description: Batch index is out of bounds
;; Usage: When accessing invalid array indices
(define-constant ERR-INVALID-BATCH-INDEX (err u705))
