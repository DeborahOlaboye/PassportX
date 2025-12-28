;; BadgeReader Trait
;; Defines the interface for badge lookup and reading

(define-trait badge-reader
  (
    ;; Get badge metadata by ID
    (get-badge-metadata (uint) (response (optional {level: uint, category: uint, timestamp: uint, issuer: principal, active: bool}) uint))

    ;; Get badge owner
    (get-badge-owner (uint) (response (optional principal) uint))

    ;; Get all badges for a user
    (get-user-badges (principal) (response (list 100 uint) uint))

    ;; Check if badge exists
    (badge-exists (uint) (response bool uint))

    ;; Get badge template info
    (get-badge-template (uint) (response (optional {name: (string-ascii 64), description: (string-ascii 256), category: uint, default-level: uint}) uint))
  )
)