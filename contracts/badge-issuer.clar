;; Badge Issuer Contract
;; Implements badge creation and minting functionality
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to contract owner
;; - u104: ERR-UNAUTHORIZED - Caller lacks required permissions
;; - u204: ERR-INVALID-RECIPIENT - Invalid recipient address
;; - u600: ERR-TEMPLATE-NOT-FOUND - Template does not exist
;; - u601: ERR-INVALID-TEMPLATE - Template data is invalid
;; - u700: ERR-BATCH-TOO-LARGE - Batch exceeds size limit
;; - u701: ERR-BATCH-EMPTY - Batch array is empty
;; - u702: ERR-BATCH-MISMATCHED-LENGTHS - Array length mismatch

(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)

;; Import error codes from centralized error-codes contract
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-INVALID-RECIPIENT (err u204))
(define-constant ERR-TEMPLATE-NOT-FOUND (err u600))
(define-constant ERR-INVALID-TEMPLATE (err u601))
(define-constant ERR-BATCH-TOO-LARGE (err u700))
(define-constant ERR-BATCH-EMPTY (err u701))
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))

;; Contract constants
(define-constant contract-owner tx-sender)

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
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    (ok (map-set authorized-issuers issuer true))
  )
)

(define-public (revoke-issuer (issuer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    (ok (map-set authorized-issuers issuer false))
  )
)

(define-read-only (is-authorized-issuer (issuer principal))
  (default-to false (map-get? authorized-issuers issuer))
)

;; Badge template creation
(define-public (create-badge-template (name (string-ascii 64)) (description (string-ascii 256)) (category uint) (default-level uint))
  (begin
    (asserts! (is-authorized-issuer tx-sender) ERR-UNAUTHORIZED)
    (contract-call? .badge-metadata create-badge-template name description category default-level)
  )
)

;; Badge minting function
(define-public (mint-badge (recipient principal) (template-id uint))
  (let
    (
      (badge-id (var-get next-badge-id))
      (template (unwrap! (contract-call? .badge-metadata get-badge-template template-id) ERR-TEMPLATE-NOT-FOUND))
    )
    (asserts! (is-authorized-issuer tx-sender) ERR-UNAUTHORIZED)
    
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
    (asserts! (is-eq recipients-len template-ids-len) ERR-BATCH-MISMATCHED-LENGTHS)
    (asserts! (<= recipients-len u50) ERR-BATCH-TOO-LARGE)
    (asserts! (> recipients-len u0) ERR-BATCH-EMPTY)
    (asserts! (is-authorized-issuer tx-sender) ERR-UNAUTHORIZED)
    
    ;; Process each mint in the batch - Mint NFTs first
    (let ((i u0))
      (while (< i recipients-len)
        (let (
            (recipient (unwrap! (element-at recipients i) ERR-INVALID-RECIPIENT))
            (template-id (unwrap! (element-at template-ids i) ERR-INVALID-TEMPLATE))
            (template (unwrap! (contract-call? .badge-metadata get-badge-template template-id) ERR-TEMPLATE-NOT-FOUND))
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
      (metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) ERR-INVALID-TEMPLATE))
    )
    (asserts! (or (is-eq tx-sender (get issuer metadata)) (is-eq tx-sender contract-owner)) ERR-UNAUTHORIZED)
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
      (current-metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) ERR-INVALID-TEMPLATE))
    )
    (asserts! (or (is-eq tx-sender (get issuer current-metadata)) (is-eq tx-sender contract-owner)) ERR-UNAUTHORIZED)
    (contract-call? .badge-metadata set-badge-metadata 
      badge-id 
      (merge current-metadata new-metadata)
    )
  )
)