# Batch Badge Minting

This document provides an overview of the batch badge minting functionality in the PassportX system.

## Overview

The batch minting feature allows issuers to mint multiple badges in a single transaction, which is more gas-efficient than individual mints and provides better atomicity (all mints succeed or none do).

## Function Signature

```clarity
(define-public (batch-mint-badges (recipients (list 50 principal)) (template-ids (list 50 uint))))
```

## Parameters

- `recipients`: A list of up to 50 principal addresses that will receive the badges
- `template-ids`: A list of template IDs corresponding to the badges to be minted

## Return Value

Returns a list of `(response uint uint)` where each element is either:
- `(ok badge-id)` on success
- `(err error-code)` on failure

## Events

A `batch-mint` event is emitted for each batch mint operation:

```clarity
(define-event batch-mint 
  (batch-id uint) 
  (issuer principal) 
  (recipients (list 50 principal)) 
  (template-ids (list 50 uint))
  (badge-ids (list 50 uint))
  (timestamp uint)
)
```

## Error Codes

- `u107`: Mismatched array lengths between recipients and template-ids
- `u108`: Batch size exceeds maximum limit (50)
- `u109`: Empty batch (no recipients provided)
- `u110`: Invalid recipient address
- `u111`: Invalid template ID
- `u104`: Unauthorized caller (not an authorized issuer)

## Usage Examples

### Minting Multiple Badges

```clarity
;; Define recipients and template IDs
(define-constant recipients 
  (list 
    'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC
  )
)

(define-constant template-ids (list u1 u1 u2))

;; Execute batch mint
(contract-call? .badge-issuer batch-mint-badges recipients template-ids)
```

### Handling the Response

```clarity
(define-public (batch-mint-and-process (recipients (list 10 principal)) (template-ids (list 10 uint)))
  (let ((results (try! (contract-call? .badge-issuer batch-mint-badges recipients template-ids))))
    (map process-badge-mint results)
  )
)

(define-private (process-badge-mint (result (response uint uint)))
  (match result
    (ok badge-id) (ok badge-id)
    (err error-code) (err error-code)
  )
)
```

## Gas Optimization

The batch minting function includes several optimizations:
1. Batches metadata updates into a single transaction
2. Uses efficient list operations
3. Minimizes storage operations
4. Includes input validation to fail fast on invalid inputs

## Best Practices

1. **Batch Size**: Keep batch sizes reasonable (10-20 items) to avoid hitting block gas limits
2. **Error Handling**: Always check the response array for individual mint failures
3. **Event Monitoring**: Use the `batch-mint` event to track successful mints
4. **Testing**: Test with small batches before moving to production
5. **Gas Estimation**: Estimate gas costs before submitting large batches

## Security Considerations

- Only authorized issuers can call this function
- Input validation is performed to prevent invalid states
- The function maintains atomicity (all mints succeed or none do)
- Event emissions help with off-chain tracking and auditing
