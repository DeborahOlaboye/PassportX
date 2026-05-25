;; Badge Reader Contract
;; Implements badge lookup and reading functionality

(use-trait badge-reader-trait .badge-reader-trait.badge-reader)

;; Constants
(define-constant err-not-found (err u102))

;; Read badge metadata by ID
(define-read-only (get-badge-metadata (badge-id uint))
  (match (contract-call? .badge-metadata get-badge-metadata badge-id)
    metadata (ok {
      level: (get level metadata),
      category: (get category metadata),
      timestamp: (get timestamp metadata),
      issuer: (get issuer metadata),
      active: (get active metadata)
    })
    (err err-not-found)
  )
)

;; Get badge owner from NFT contract
(define-read-only (get-badge-owner (badge-id uint))
  (contract-call? .passport-nft get-owner badge-id)
)

;; Get all badges for a user
(define-read-only (get-user-badges (user principal))
  (ok (get badge-ids (contract-call? .badge-metadata get-user-badges user)))
)

;; Check if badge exists and is active
(define-read-only (badge-exists (badge-id uint))
  (match (contract-call? .badge-metadata get-badge-metadata badge-id)
    metadata (ok (get active metadata))
    (ok false)
  )
)

;; Get badge template information
(define-read-only (get-badge-template (template-id uint))
  (match (contract-call? .badge-metadata get-badge-template template-id)
    template (ok {
      name: (get name template),
      description: (get description template),
      category: (get category template),
      default-level: (get default-level template),
      expiration-duration: (get expiration-duration template),
      creator: (get creator template)
    })
    (err err-not-found)
  )
)

;; Get full badge information (metadata + template)
(define-read-only (get-full-badge-info (badge-id uint))
  (let
    (
      (metadata (contract-call? .badge-metadata get-badge-metadata badge-id))
      (owner (contract-call? .passport-nft get-owner badge-id))
    )
    (match metadata
      meta
        (match owner
          owner-val
            (ok {
              id: badge-id,
              owner: (default-to 'ST1000000000000000000000000000000 owner-val),
              level: (get level meta),
              category: (get category meta),
              timestamp: (get timestamp meta),
              issuer: (get issuer meta),
              active: (get active meta)
            })
          (err err-not-found)
        )
      (err err-not-found)
    )
  )
)

;; Get badges by category for a user
(define-read-only (get-user-badges-by-category (user principal) (category uint))
  (let
    (
      (user-badges (get badge-ids (contract-call? .badge-metadata get-user-badges user)))
    )
    (ok (filter (check-badge-category category) user-badges))
  )
)

;; Helper function to check badge category (fixed: accepts target-category parameter)
(define-private (check-badge-category (badge-id uint) (target-category uint))
  (match (contract-call? .badge-metadata get-badge-metadata badge-id)
    metadata (is-eq (get category metadata) target-category)
    false
  )
)

;; Get active badges count for user
(define-read-only (get-active-badges-count (user principal))
  (let
    (
      (user-badges (get badge-ids (contract-call? .badge-metadata get-user-badges user)))
    )
    (ok (len (filter check-badge-active user-badges)))
  )
)

;; Helper function to check if badge is active
(define-private (check-badge-active (badge-id uint))
  (match (contract-call? .badge-metadata get-badge-metadata badge-id)
    metadata (get active metadata)
    false
  )
)

;; Verify badge ownership and authenticity (fixed: removed double unwrap)
(define-read-only (verify-badge-ownership (badge-id uint) (claimed-owner principal))
  (let
    (
      (owner-response (contract-call? .passport-nft get-owner badge-id))
    )
    (match owner-response
      owner-result (ok (is-eq (default-to 'ST1000000000000000000000000000000 owner-result) claimed-owner))
      (err err-not-found)
    )
  )
)

;; Verify badge is authentic and not revoked
(define-read-only (verify-badge-authenticity (badge-id uint))
  (match (contract-call? .badge-metadata get-badge-metadata badge-id)
    metadata (ok {
      exists: true,
      active: (get active metadata),
      issuer: (get issuer metadata),
      timestamp: (get timestamp metadata)
    })
    (err err-not-found)
  )
)

;; Get complete verification status for a badge (fixed: removed triple unwrap)
(define-read-only (get-verification-status (badge-id uint))
  (let
    (
      (metadata (contract-call? .badge-metadata get-badge-metadata badge-id))
      (owner-response (contract-call? .passport-nft get-owner badge-id))
    )
    (match metadata
      meta
        (match owner-response
          owner
            (ok {
              verified: true,
              active: (get active meta),
              owner: (default-to 'ST1000000000000000000000000000000 owner),
              issuer: (get issuer meta),
              level: (get level meta),
              category: (get category meta),
              timestamp: (get timestamp meta)
            })
          (err err-not-found)
        )
      (err err-not-found)
    )
  )
)