;; Badge Issuer Contract
;; Implements badge creation and minting functionality

(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u104))
(define-constant err-invalid-template (err u105))
(define-constant err-mint-failed (err u106))
(define-constant err-mismatched-array-lengths (err u107))
(define-constant err-batch-too-large (err u108))
(define-constant err-empty-batch (err u109))
(define-constant err-invalid-recipient (err u110))
(define-constant err-invalid-template-id (err u111))

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

;; Events
(define-data-var batch-mint-event-version uint u1)
(define-event batch-mint 
  (batch-id uint) 
  (issuer principal) 
  (recipients (list 50 principal)) 
  (template-ids (list 50 uint))
  (badge-ids (list 50 uint))
  (timestamp uint)
)

;; Batch mint badges to multiple recipients with corresponding template IDs
(define-public (batch-mint-badges (recipients (list 50 principal)) (template-ids (list 50 uint)))
  (let (
      (recipients-len (len recipients))
      (template-ids-len (len template-ids))
      (results (list))
      (badge-ids (list))
      (metadatas (list))
      (current-badge-id (var-get next-badge-id))
      (batch-id (var-get batch-mint-event-version))
    )
    ;; Input validation
    (asserts! (is-eq recipients-len template-ids-len) err-mismatched-array-lengths)
    (asserts! (<= recipients-len u50) err-batch-too-large)
    (asserts! (> recipients-len u0) err-empty-batch)
    (asserts! (is-authorized-issuer tx-sender) err-unauthorized)
    
    ;; Process each mint in the batch - Mint NFTs first
    (let ((i u0))
      (while (< i recipients-len)
        (let (
            (recipient (unwrap! (element-at recipients i) err-invalid-recipient))
            (template-id (unwrap! (element-at template-ids i) err-invalid-template-id))
            (template (unwrap! (contract-call? .badge-metadata get-badge-template template-id) err-invalid-template))
          )
          ;; Mint NFT
          (try! (contract-call? .passport-nft mint recipient))
          
          ;; Prepare metadata for batch update
          (set! badge-ids (append badge-ids current-badge-id))
          (set! metadatas (append metadatas {
            level: (get default-level template),
            category: (get category template),
            timestamp: block-height,
            issuer: tx-sender,
            active: true
          }))
          
          ;; Add success result
          (set! results (append results (ok current-badge-id)))
          (set! current-badge-id (+ current-badge-id u1))
        )
        (set! i (+ i u1))
      )
    )
    
    ;; Batch update all metadata in a single transaction
    (try! (contract-call? .badge-metadata batch-set-badge-metadata badge-ids metadatas))
    
    ;; Update the next badge ID
    (var-set next-badge-id current-badge-id)
    
    ;; Emit batch mint event
    (var-set batch-mint-event-version (+ batch-id u1))
    (emit-raw (event batch-mint 
      batch-id 
      tx-sender 
      recipients 
      template-ids 
      badge-ids 
      block-height
    ))
    
    (ok results)
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