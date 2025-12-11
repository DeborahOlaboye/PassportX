;; PassportX Core Integration Contract
;; Main contract that integrates all components

;; Import traits
(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)
(use-trait badge-reader-trait .badge-reader-trait.badge-reader)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u104))

;; Main passport functions
(define-public (create-passport-badge (recipient principal) (template-id uint) (community-id uint))
  (begin
    ;; Check permissions
    (asserts! (contract-call? .access-control can-issue-badges-in-community community-id tx-sender) err-unauthorized)
    
    ;; Mint badge through issuer
    (contract-call? .badge-issuer mint-badge recipient template-id)
  )
)

(define-read-only (get-passport-summary (user principal))
  (let
    (
      (badges (unwrap-panic (contract-call? .badge-reader get-user-badges user)))
      (active-count (unwrap-panic (contract-call? .badge-reader get-active-badges-count user)))
    )
    {
      total-badges: (len badges),
      active-badges: active-count,
      badge-ids: badges
    }
  )
)

(define-public (setup-community-issuer (community-id uint) (issuer principal))
  (begin
    (asserts! (contract-call? .access-control can-manage-community-members community-id tx-sender) err-unauthorized)
    (contract-call? .badge-issuer authorize-issuer issuer)
  )
)