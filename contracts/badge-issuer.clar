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
;; - u110: ERR-PAUSED - Contract is paused

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
(define-constant ERR-PAUSED (err u110))

;; Contract constants
(define-constant contract-owner tx-sender)

;; Data variables
(define-data-var next-badge-id uint u1)
(define-data-var batch-mint-counter uint u0)

;; Access control map
(define-map authorized-issuers principal bool)

;; Initialize contract owner as authorized issuer
(map-set authorized-issuers contract-owner true)

;; Access control functions
(define-public (authorize-issuer (issuer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)

    ;; Emit issuer authorized event
    (print {
      event: "issuer-authorized",
      issuer: issuer,
      authorized-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set authorized-issuers issuer true))
  )
)

(define-public (revoke-issuer (issuer principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)

    ;; Emit issuer revoked event
    (print {
      event: "issuer-revoked",
      issuer: issuer,
      revoked-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set authorized-issuers issuer false))
  )
)

(define-read-only (is-authorized-issuer (issuer principal))
  (default-to false (map-get? authorized-issuers issuer))
)

;; Badge template creation
(define-public (create-badge-template (name (string-ascii 64)) (description (string-ascii 256)) (category uint) (default-level uint) (community-id uint) (expiration-duration uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (asserts! (or 
      (is-authorized-issuer tx-sender)
      (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)
    ) ERR-UNAUTHORIZED)

    (let
      (
        (result (try! (contract-call? .badge-metadata create-badge-template name description category default-level expiration-duration)))
      )
      ;; Emit template created event
      (print {
        event: "template-created",
        template-id: result,
        name: name,
        description: description,
        category: category,
        default-level: default-level,
        expiration-duration: expiration-duration,
        creator: tx-sender,
        block-height: block-height
      })

      (ok result)
    )
  )
)

;; Badge minting function
(define-public (mint-badge (recipient principal) (template-id uint) (community-id uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (asserts! (or 
      (is-authorized-issuer tx-sender)
      (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)
    ) ERR-UNAUTHORIZED)

    (let
      (
        (badge-id (var-get next-badge-id))
        (template (unwrap! (contract-call? .badge-metadata get-badge-template template-id) ERR-TEMPLATE-NOT-FOUND))
        (expiration-height (if (> (get expiration-duration template) u0)
                             (+ block-height (get expiration-duration template))
                             u0))
      )
      ;; Mint NFT
      (try! (contract-call? .passport-nft mint recipient))

      ;; Set badge metadata
      (try! (contract-call? .badge-metadata set-badge-metadata
        badge-id
        {
          template-id: template-id,
          level: (get default-level template),
          category: (get category template),
          timestamp: block-height,
          expiration-height: expiration-height,
          issuer: tx-sender,
          active: true
        }
      ))

      ;; Emit badge minted event
      (print {
        event: "badge-minted",
        badge-id: badge-id,
        recipient: recipient,
        template-id: template-id,
        issuer: tx-sender,
        level: (get default-level template),
        category: (get category template),
        expiration-height: expiration-height,
        block-height: block-height
      })

      (var-set next-badge-id (+ badge-id u1))
      (ok badge-id)
    )
  )
)

;; Helper for fold in batch minting
(define-private (batch-mint-iter (item {recipient: principal, template-id: uint}) (state {current-id: uint, ids: (list 50 uint), meta: (list 50 {template-id: uint, level: uint, category: uint, timestamp: uint, expiration-height: uint, issuer: principal, active: bool})}))
  (let (
    (template (unwrap-panic (contract-call? .badge-metadata get-badge-template (get template-id item))))
    (exp-height (if (> (get expiration-duration template) u0) (+ block-height (get expiration-duration template)) u0))
    (new-meta {
      template-id: (get template-id item),
      level: (get default-level template),
      category: (get category template),
      timestamp: block-height,
      expiration-height: exp-height,
      issuer: tx-sender,
      active: true
    })
  )
  (begin 
    (unwrap-panic (contract-call? .passport-nft mint (get recipient item)))
    {
      current-id: (+ (get current-id state) u1),
      ids: (unwrap-panic (as-max-len? (append (get ids state) (get current-id state)) u50)),
      meta: (unwrap-panic (as-max-len? (append (get meta state) new-meta) u50))
    }
  ))
)

;; Batch mint badges to multiple recipients
(define-public (batch-mint-badges (recipients (list 50 principal)) (template-ids (list 50 uint)) (community-id uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (asserts! (or 
      (is-authorized-issuer tx-sender)
      (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)
    ) ERR-UNAUTHORIZED)

    (let (
        (recipients-len (len recipients))
        (template-ids-len (len template-ids))
        (batch-id (var-get batch-mint-counter))
      )
      (asserts! (is-eq recipients-len template-ids-len) ERR-BATCH-MISMATCHED-LENGTHS)
      (asserts! (> recipients-len u0) ERR-BATCH-EMPTY)

      (let (
        (input-list (map merge-recipients-templates recipients template-ids))
        (initial-state {current-id: (var-get next-badge-id), ids: (list), meta: (list)})
        (final-state (fold batch-mint-iter input-list initial-state))
      )
        (try! (contract-call? .badge-metadata batch-set-badge-metadata (get ids final-state) (get meta final-state)))
        (var-set next-badge-id (get current-id final-state))
        (var-set batch-mint-counter (+ batch-id u1))
        
        (print {
          event: "batch-badges-minted",
          batch-id: batch-id,
          issuer: tx-sender,
          count: recipients-len,
          block-height: block-height
        })
        (ok (get ids final-state))
      )
    )
  )
)

(define-private (merge-recipients-templates (r principal) (t uint))
  {recipient: r, template-id: t}
)

;; Revoke badge
(define-public (revoke-badge (badge-id uint) (community-id uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (let
      (
        (metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) ERR-INVALID-TEMPLATE))
      )
      (asserts! (or 
        (is-eq tx-sender (get issuer metadata)) 
        (is-eq tx-sender contract-owner)
        (contract-call? .access-control can-revoke-badges-in-community community-id tx-sender)
      ) ERR-UNAUTHORIZED)

      ;; Emit badge revoked event
      (print {
        event: "badge-revoked",
        badge-id: badge-id,
        issuer: (get issuer metadata),
        revoked-by: tx-sender,
        block-height: block-height
      })

      (contract-call? .badge-metadata set-badge-metadata
        badge-id
        (merge metadata { active: false })
      )
    )
  )
)

;; Update badge metadata
(define-public (update-badge-metadata (badge-id uint) (new-metadata {level: uint, category: uint, timestamp: uint, expiration-height: uint}) (community-id uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (let
      (
        (current-metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) ERR-INVALID-TEMPLATE))
      )
      (asserts! (or 
        (is-eq tx-sender (get issuer current-metadata)) 
        (is-eq tx-sender contract-owner)
        (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)
      ) ERR-UNAUTHORIZED)

      ;; Emit metadata updated event
      (print {
        event: "badge-metadata-updated",
        badge-id: badge-id,
        old-level: (get level current-metadata),
        new-level: (get level new-metadata),
        old-category: (get category current-metadata),
        new-category: (get category new-metadata),
        updated-by: tx-sender,
        block-height: block-height
      })

      (contract-call? .badge-metadata set-badge-metadata
        badge-id
        (merge current-metadata (merge new-metadata { issuer: (get issuer current-metadata), active: (get active current-metadata) }))
      )
    )
  )
)

;; Renew badge
(define-public (renew-badge (badge-id uint) (community-id uint))
  (begin
    (asserts! (not (unwrap-panic (contract-call? .access-control is-paused))) ERR-PAUSED)
    (let
      (
        (metadata (unwrap! (contract-call? .badge-metadata get-badge-metadata badge-id) ERR-INVALID-TEMPLATE))
        (template (unwrap! (contract-call? .badge-metadata get-badge-template (get template-id metadata)) ERR-TEMPLATE-NOT-FOUND))
        (expiration-duration (get expiration-duration template))
      )
      (asserts! (or 
        (is-eq tx-sender (get issuer metadata)) 
        (is-eq tx-sender contract-owner)
        (contract-call? .access-control can-issue-badges-in-community community-id tx-sender)
      ) ERR-UNAUTHORIZED)

      ;; Can only renew badges that have an expiration duration
      (asserts! (> expiration-duration u0) ERR-INVALID-TEMPLATE)

      (let
        (
          (new-expiration-height (+ block-height expiration-duration))
          (new-metadata (merge metadata { expiration-height: new-expiration-height, timestamp: block-height, active: true }))
        )
        
        ;; Update metadata
        (try! (contract-call? .badge-metadata set-badge-metadata badge-id new-metadata))

        ;; Emit badge renewed event
        (print {
          event: "badge-renewed",
          badge-id: badge-id,
          new-expiration-height: new-expiration-height,
          renewed-by: tx-sender,
          block-height: block-height
        })

        (ok true)
      )
    )
  )
)
