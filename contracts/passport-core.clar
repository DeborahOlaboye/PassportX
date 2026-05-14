;; PassportX Core Integration Contract
;; Main contract that integrates all components
;; Updated with comprehensive error handling

;; Import traits
(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)
(use-trait badge-reader-trait .badge-reader-trait.badge-reader)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u104))
(define-constant err-invalid-recipient (err u105))
(define-constant err-mint-failed (err u106))
(define-constant err-badge-read-failed (err u107))
(define-constant err-issuer-setup-failed (err u108))
(define-constant ERR-PAUSED (err u110))

;; Main passport functions
;; Function to create a passport badge with proper error handling
(define-public (create-passport-badge (recipient principal) (template-id uint) (community-id uint))
  (begin
    ;; Check paused state
    (asserts! (not (try! (contract-call? .access-control is-paused))) ERR-PAUSED)

    ;; Check permissions
    (asserts! (try! (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)) err-unauthorized)

    ;; Mint badge through issuer
    (contract-call? .badge-issuer mint-badge recipient template-id community-id)
  )
)

;; Function to get passport summary with error handling
(define-public (get-passport-summary (user principal))
  (let
    (
      (badges-result (contract-call? .badge-reader get-user-badges user))
      (active-count-result (contract-call? .badge-reader get-active-badges-count user))
    )
    (match badges-result
      badges (match active-count-result
        active-count (ok {
          total-badges: (len badges),
          active-badges: active-count,
          badge-ids: badges
        })
        error err-badge-read-failed)
      error err-badge-read-failed)
  )
)

;; Function to setup community issuer with error handling
(define-public (setup-community-issuer (community-id uint) (issuer principal))
  (begin
    (asserts! (not (try! (contract-call? .access-control is-paused))) ERR-PAUSED)
    (asserts! (try! (contract-call? .access-control can-manage-community-members community-id tx-sender)) err-unauthorized)
    (match (contract-call? .badge-issuer authorize-issuer issuer)
      success (ok success)
      error err-issuer-setup-failed)
  )
)