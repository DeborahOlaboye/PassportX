;; Badge Issuer Contract
;; Implements badge creation and minting functionality

(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u104))
(define-constant err-invalid-template (err u105))
(define-constant err-mint-failed (err u106))

;; Data variables
(define-data-var next-badge-id uint u1)

;; Access control map
(define-map authorized-issuers principal bool)

;; Community badge issuers
(define-map community-issuers 
  { community-id: uint }
  { issuer: principal, active: bool }
)

;; Initialize contract owner as authorized issuer
(map-set authorized-issuers contract-owner true)

;; Access control functions
(define-public (authorize-issuer (issuer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set authorized-issuers issuer true))
  )
)

(define-public (revoke-issuer (issuer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set authorized-issuers issuer false))
  )
)

(define-read-only (is-authorized-issuer (issuer principal))
  (default-to false (map-get? authorized-issuers issuer))
)

;; Badge template creation
(define-public (create-badge-template (name (string-ascii 64)) (description (string-ascii 256)) (category uint) (default-level uint))
  (begin
    (asserts! (is-authorized-issuer tx-sender) err-unauthorized)
    (contract-call? .badge-metadata create-badge-template name description category default-level)
  )
)

;; Badge minting function
(define-public (mint-badge (recipient principal) (template-id uint))
  (let
    (
      (badge-id (var-get next-badge-id))
      (template (unwrap! (contract-call? .badge-metadata get-badge-template template-id) err-invalid-template))
    )
    (asserts! (is-authorized-issuer tx-sender) err-unauthorized)
    
    ;; Mint NFT
    (try! (contract-call? .passport-nft mint recipient))
    
    ;; Set badge metadata
    (try! (contract-call? .badge-metadata set-badge-metadata 
      badge-id 
      {
        level: (get default-level template),
        category: (get category template),
        timestamp: block-height,
        issuer: tx-sender,
        active: true
      }
    ))
    
    (var-set next-badge-id (+ badge-id u1))
    (ok badge-id)
  )
)

;; Badge revocation
(define-public (revoke-badge (badge-id uint))
  (let
    (
      (metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) err-invalid-template))
    )
    (asserts! (or (is-eq tx-sender (get issuer metadata)) (is-eq tx-sender contract-owner)) err-unauthorized)
    (contract-call? .badge-metadata set-badge-metadata 
      badge-id 
      (merge metadata { active: false })
    )
  )
)

;; Update badge metadata
(define-public (update-badge-metadata (badge-id uint) (new-metadata {level: uint, category: uint, timestamp: uint}))
  (let
    (
      (current-metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) err-invalid-template))
    )
    (asserts! (or (is-eq tx-sender (get issuer current-metadata)) (is-eq tx-sender contract-owner)) err-unauthorized)
    (contract-call? .badge-metadata set-badge-metadata
      badge-id
      (merge current-metadata new-metadata)
    )
  )
)

;; Bulk badge minting (mint multiple badges in one transaction)
(define-private (mint-badge-internal (mint-data {recipient: principal, template-id: uint}))
  (let
    (
      (badge-id (var-get next-badge-id))
      (template (unwrap! (contract-call? .badge-metadata get-badge-template (get template-id mint-data)) err-invalid-template))
    )
    ;; Mint NFT
    (try! (contract-call? .passport-nft mint (get recipient mint-data)))

    ;; Set badge metadata
    (try! (contract-call? .badge-metadata set-badge-metadata
      badge-id
      {
        level: (get default-level template),
        category: (get category template),
        timestamp: block-height,
        issuer: tx-sender,
        active: true
      }
    ))

    (var-set next-badge-id (+ badge-id u1))
    (ok badge-id)
  )
)

(define-public (mint-multiple-badges (badge-list (list 10 {recipient: principal, template-id: uint})))
  (begin
    (asserts! (is-authorized-issuer tx-sender) err-unauthorized)
    (ok (map mint-badge-internal badge-list))
  )
)

;; Bulk badge revocation
(define-private (revoke-badge-internal (badge-id uint))
  (let
    (
      (metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) err-invalid-template))
    )
    (asserts! (or (is-eq tx-sender (get issuer metadata)) (is-eq tx-sender contract-owner)) err-unauthorized)
    (contract-call? .badge-metadata set-badge-metadata
      badge-id
      (merge metadata { active: false })
    )
  )
)

(define-public (revoke-multiple-badges (badge-ids (list 10 uint)))
  (ok (map revoke-badge-internal badge-ids))
)
