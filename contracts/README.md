# PassportX Smart Contracts

This directory contains the Clarity smart contracts for the PassportX achievement badge system.

## Contracts Overview

### Core Contracts

#### passport-nft.clar
- **Purpose**: SIP-12 compliant non-transferable NFT for achievement badges
- **Features**: Soulbound badges, minting, ownership tracking
- **Error Codes**: u100-u103

#### badge-metadata.clar
- **Purpose**: Manages badge metadata storage and templates
- **Features**: Badge metadata, template management, batch operations
- **Error Codes**: u100, u500-u501, u700-u702, u705

#### badge-issuer.clar
- **Purpose**: Badge creation and minting functionality
- **Features**: Template creation, badge minting, batch minting, revocation
- **Error Codes**: u100, u104, u204, u600-u601, u700-u702

### Management Contracts

#### community-manager.clar
- **Purpose**: Community and member management
- **Features**: Community creation, membership, settings, ownership transfer
- **Error Codes**: u100, u104, u300-u301, u304

#### access-control.clar
- **Purpose**: Centralized access control and permissions
- **Features**: Role management, permission checks, global/community permissions
- **Error Codes**: u100, u400-u401, u403, u405

### Utility Contracts

#### error-codes.clar
- **Purpose**: Centralized error code definitions
- **Features**: Comprehensive error codes with descriptive comments
- **Error Codes**: All error codes (u100-u799)

## Error Handling System

All contracts use a centralized error code system defined in `error-codes.clar`. Error codes are organized into ranges:

- **u100-u199**: General/Common errors
- **u200-u299**: NFT/Badge-specific errors
- **u300-u399**: Community-specific errors
- **u400-u499**: Access control errors
- **u500-u599**: Metadata errors
- **u600-u699**: Template errors
- **u700-u799**: Batch operation errors

See [ERROR_CODES.md](../docs/ERROR_CODES.md) for complete error code reference.

## Event System

All contracts emit events for critical actions using Clarity's `print` function. This enables real-time monitoring, analytics, and frontend state synchronization.

### Event Structure

All events follow a consistent structure:

```clarity
(print {
  event: "event-name",
  [relevant-fields]: values,
  block-height: block-height
})
```

### Events by Contract

#### badge-issuer.clar (7 events)
- `badge-minted`: Single badge minted
- `batch-badges-minted`: Multiple badges minted
- `template-created`: Badge template created
- `badge-revoked`: Badge revoked
- `badge-metadata-updated`: Badge metadata changed
- `issuer-authorized`: Issuer granted permissions
- `issuer-revoked`: Issuer permissions removed

#### community-manager.clar (5 events)
- `community-created`: New community created
- `community-member-added`: Member joins community
- `community-settings-updated`: Community settings changed
- `community-deactivated`: Community deactivated
- `community-ownership-transferred`: Ownership changes

#### access-control.clar (4 events)
- `global-permissions-updated`: User's global permissions changed
- `community-permissions-updated`: Community permissions changed
- `user-suspended`: User account suspended
- `user-unsuspended`: User account restored

#### passport-nft.clar (1 event)
- `passport-badge-minted`: NFT token minted

### Adding New Events

When adding new events:

1. Use consistent naming: `{noun}-{verb-past-tense}`
2. Include all relevant context in event data
3. Always include `block-height`
4. Document in contract header comments
5. Update `docs/EVENTS.md`

Example:
```clarity
;; In your public function
(define-public (perform-action (param uint))
  (begin
    ;; ... perform action logic ...

    ;; Emit event
    (print {
      event: "action-performed",
      param: param,
      performer: tx-sender,
      block-height: block-height
    })

    (ok true)
  )
)
```

See [EVENTS.md](../docs/EVENTS.md) for complete event reference and usage examples.

## Contract Relationships

```
passport-nft.clar (NFT Base)
       ↑
       |
badge-issuer.clar ←→ badge-metadata.clar
       ↑                    ↑
       |                    |
       ↓                    ↓
access-control.clar ←→ community-manager.clar
```

## Development

### Testing Contracts

```bash
# Run all contract tests
npm run test:contracts

# Run specific contract tests
clarinet test --filter badge-issuer

# Check contract syntax
clarinet check
```

### Deploying Contracts

Deployment order is important:

1. `error-codes.clar` (referenced by others)
2. `passport-nft.clar` (base NFT)
3. `badge-metadata.clar` (metadata storage)
4. `community-manager.clar` (community management)
5. `access-control.clar` (permissions)
6. `badge-issuer.clar` (issuance logic)

### Adding New Error Codes

When adding new error codes:

1. Choose appropriate range based on category
2. Add to `error-codes.clar` with descriptive comment
3. Import in your contract
4. Document in contract header
5. Update `docs/ERROR_CODES.md`
6. Add to `src/lib/constants/errorCodes.ts`

Example:
```clarity
;; In error-codes.clar
;; ERR-NEW-ERROR (u210)
;; Description: Describe the error condition
;; Usage: When this specific error occurs
(define-constant ERR-NEW-ERROR (err u210))

;; In your contract
(define-constant ERR-NEW-ERROR (err u210))
(asserts! condition ERR-NEW-ERROR)
```

## Contract Conventions

### Naming Conventions

- **Constants**: UPPER_SNAKE_CASE (e.g., `ERR-OWNER-ONLY`, `ROLE-ADMIN`)
- **Functions**: kebab-case (e.g., `mint-badge`, `create-community`)
- **Maps**: kebab-case (e.g., `badge-metadata`, `community-members`)
- **Variables**: kebab-case (e.g., `next-badge-id`)

### Error Handling

Always use named error constants:

```clarity
;; GOOD ✓
(define-constant ERR-UNAUTHORIZED (err u104))
(asserts! (is-authorized user) ERR-UNAUTHORIZED)

;; BAD ✗
(asserts! (is-authorized user) (err u104))
```

### Documentation

All contracts should include:

1. **Purpose**: What the contract does
2. **Error Codes**: List of error codes used
3. **Function Comments**: Purpose and parameters
4. **Example Usage**: How to interact with the contract

## Security Considerations

### Access Control

- All sensitive functions check authorization
- Owner-only functions verify `contract-owner`
- Permission checks use `access-control` contract

### Input Validation

- All user inputs are validated
- Batch operations check array lengths
- Numeric inputs check ranges

### Error Messages

- Never expose sensitive information in errors
- Use generic errors for security-sensitive operations
- Log detailed errors server-side only

## Testing

Each contract should have comprehensive tests covering:

- ✅ Happy path scenarios
- ✅ Edge cases
- ✅ Error conditions
- ✅ Access control
- ✅ State changes
- ✅ Event emissions

## Resources

- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [SIP-009 NFT Trait](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md)
- [Error Codes Reference](../docs/ERROR_CODES.md)
- [Migration Guide](../docs/ERROR_CODES_MIGRATION.md)

## Contributing

When contributing to contracts:

1. Follow naming conventions
2. Add comprehensive tests
3. Document all functions
4. Use centralized error codes
5. Update relevant documentation
6. Run full test suite before committing

## License

See LICENSE file in project root.
