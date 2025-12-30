;; Badge Metadata Contract
;; Manages typed maps for badge metadata storage
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to contract owner
;; - u500: ERR-METADATA-NOT-FOUND - Metadata not found
;; - u501: ERR-INVALID-METADATA - Invalid metadata
;; - u700: ERR-BATCH-TOO-LARGE - Batch exceeds size limit
;; - u701: ERR-BATCH-EMPTY - Batch array is empty
;; - u702: ERR-BATCH-MISMATCHED-LENGTHS - Array length mismatch
;; - u705: ERR-INVALID-BATCH-INDEX - Invalid array index

;; Import error codes from centralized error-codes contract
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-METADATA-NOT-FOUND (err u500))
(define-constant ERR-INVALID-METADATA (err u501))
(define-constant ERR-BATCH-TOO-LARGE (err u700))
(define-constant ERR-BATCH-EMPTY (err u701))
(define-constant ERR-BATCH-MISMATCHED-LENGTHS (err u702))
(define-constant ERR-INVALID-BATCH-INDEX (err u705))

;; Contract constants
(define-constant contract-owner tx-sender)

;; Badge metadata structure using typed maps
(define-map badge-metadata 
  { id: uint }
  { 
    level: uint, 
    category: uint, 
    timestamp: uint,
    issuer: principal,
    active: bool
  }
)

;; Badge template information
(define-map badge-templates
  { template-id: uint }
  {
    name: (string-ascii 64),
    description: (string-ascii 256),
    category: uint,
    default-level: uint,
    creator: principal
  }
)

;; User badge ownership tracking
(define-map user-badges
  { owner: principal }
  { badge-ids: (list 100 uint) }
)

;; Data variables
(define-data-var next-template-id uint u1)

;; Read functions
(define-read-only (get-badge-metadata (badge-id uint))
  (map-get? badge-metadata { id: badge-id })
)

(define-read-only (get-badge-template (template-id uint))
  (map-get? badge-templates { template-id: template-id })
)

(define-read-only (get-user-badges (user principal))
  (default-to { badge-ids: (list) } (map-get? user-badges { owner: user }))
)

;; Write functions
(define-public (set-badge-metadata (badge-id uint) (metadata {level: uint, category: uint, timestamp: uint, issuer: principal, active: bool}))
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    (ok (map-set badge-metadata { id: badge-id } metadata))
  )
)

;; Batch update badge metadata
(define-public (batch-set-badge-metadata (badge-ids (list 50 uint)) (metadatas (list 50 {level: uint, category: uint, timestamp: uint, issuer: principal, active: bool}))) 
  (let (
      (badge-ids-len (len badge-ids))
      (metadatas-len (len metadatas))
    )
    ;; Input validation
    (asserts! (is-eq badge-ids-len metadatas-len) ERR-BATCH-MISMATCHED-LENGTHS)
    (asserts! (<= badge-ids-len u50) ERR-BATCH-TOO-LARGE)
    (asserts! (> badge-ids-len u0) ERR-BATCH-EMPTY)
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)

    ;; Process each metadata update
    (let ((i u0))
      (while (< i badge-ids-len)
        (let (
            (badge-id (unwrap! (element-at badge-ids i) ERR-INVALID-BATCH-INDEX))
            (metadata (unwrap! (element-at metadatas i) ERR-INVALID-METADATA))
          )
          (try! (ok (map-set badge-metadata { id: badge-id } metadata)))
        )
        (set! i (+ i u1))
      )
    )
    
    (ok true)
  )
)

(define-public (create-badge-template (name (string-ascii 64)) (description (string-ascii 256)) (category uint) (default-level uint))
  (let
    (
      (template-id (var-get next-template-id))
    )
    (map-set badge-templates 
      { template-id: template-id }
      {
        name: name,
        description: description,
        category: category,
        default-level: default-level,
        creator: tx-sender
      }
    )
    (var-set next-template-id (+ template-id u1))
    (ok template-id)
  )
)