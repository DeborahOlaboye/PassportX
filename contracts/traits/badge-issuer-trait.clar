;; BadgeIssuer Trait
;; Defines the interface for badge creation and minting

(define-trait badge-issuer
  (
    ;; Create a new badge template
    (create-badge-template ((string-ascii 64) (string-ascii 256) uint uint) (response uint uint))

    ;; Mint a badge to a user
    (mint-badge (principal uint) (response uint uint))

    ;; Mint multiple badges in a single transaction
    (batch-mint-badges ((list 50 principal) (list 50 uint)) (response (list 50 (response uint uint)) uint))

    ;; Revoke a badge
    (revoke-badge (uint) (response bool uint))

    ;; Update badge metadata
    (update-badge-metadata (uint {level: uint, category: uint, timestamp: uint}) (response bool uint))
  )
)