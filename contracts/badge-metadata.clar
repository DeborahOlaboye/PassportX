;; Badge Metadata Contract
;; Manages typed maps for badge metadata storage

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u102))
(define-constant err-unauthorized (err u104))

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
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set badge-metadata { id: badge-id } metadata))
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