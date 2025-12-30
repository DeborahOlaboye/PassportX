;; PassportX NFT Contract
;; SIP-12 compliant non-transferable NFT for achievement badges
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to contract owner
;; - u101: ERR-NOT-TOKEN-OWNER - Caller is not token owner
;; - u102: ERR-NOT-FOUND - Token not found
;; - u103: ERR-TRANSFER-DISABLED - Transfers are disabled

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Import error codes from centralized error-codes contract
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-TRANSFER-DISABLED (err u103))

;; Contract constants
(define-constant contract-owner tx-sender)

;; Data Variables
(define-data-var last-token-id uint u0)

;; Maps
(define-map token-count principal uint)
(define-map market {token-id: uint} {price: uint, commission: principal})

;; Non-Fungible Token Definition
(define-non-fungible-token passport-badge uint)

;; SIP-12 Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok none)
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? passport-badge token-id))
)

;; Transfer function - DISABLED for non-transferable NFTs
(define-public (transfer (id uint) (sender principal) (recipient principal))
  (begin
    (asserts! false ERR-TRANSFER-DISABLED)
    (ok true)
  )
)

;; Mint function - only contract owner can mint
(define-public (mint (recipient principal))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    (try! (nft-mint? passport-badge token-id recipient))

    ;; Emit passport badge minted event
    (print {
      event: "passport-badge-minted",
      token-id: token-id,
      recipient: recipient,
      minted-by: tx-sender,
      block-height: block-height
    })

    (var-set last-token-id token-id)
    (ok token-id)
  )
)