;; PassportX NFT Contract
;; SIP-12 compliant non-transferable NFT for achievement badges

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-not-found (err u102))
(define-constant err-transfer-disabled (err u103))

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
    (asserts! false err-transfer-disabled)
    (ok true)
  )
)

;; Mint function - only contract owner can mint
(define-public (mint (recipient principal))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (try! (nft-mint? passport-badge token-id recipient))
    (var-set last-token-id token-id)
    (ok token-id)
  )
)