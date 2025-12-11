;; Community Manager Contract
;; Manages communities and their badge issuance permissions

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-unauthorized (err u104))
(define-constant err-community-not-found (err u107))
(define-constant err-already-exists (err u108))

;; Data variables
(define-data-var next-community-id uint u1)

;; Community information
(define-map communities
  { community-id: uint }
  {
    name: (string-ascii 64),
    description: (string-ascii 256),
    owner: principal,
    active: bool,
    created-at: uint
  }
)

;; Community members and roles
(define-map community-members
  { community-id: uint, member: principal }
  { role: (string-ascii 32), joined-at: uint }
)

;; Community badge templates
(define-map community-templates
  { community-id: uint }
  { template-ids: (list 50 uint) }
)

;; Community settings
(define-map community-settings
  { community-id: uint }
  {
    public-badges: bool,
    allow-member-requests: bool,
    require-approval: bool
  }
)

;; Create a new community
(define-public (create-community (name (string-ascii 64)) (description (string-ascii 256)))
  (let
    (
      (community-id (var-get next-community-id))
    )
    (map-set communities
      { community-id: community-id }
      {
        name: name,
        description: description,
        owner: tx-sender,
        active: true,
        created-at: block-height
      }
    )
    
    ;; Set default community settings
    (map-set community-settings
      { community-id: community-id }
      {
        public-badges: true,
        allow-member-requests: true,
        require-approval: false
      }
    )
    
    ;; Add creator as admin member
    (map-set community-members
      { community-id: community-id, member: tx-sender }
      { role: "admin", joined-at: block-height }
    )
    
    (var-set next-community-id (+ community-id u1))
    (ok community-id)
  )
)

;; Get community information
(define-read-only (get-community (community-id uint))
  (map-get? communities { community-id: community-id })
)

;; Add member to community
(define-public (add-community-member (community-id uint) (member principal) (role (string-ascii 32)))
  (let
    (
      (community (unwrap! (map-get? communities { community-id: community-id }) err-community-not-found))
    )
    (asserts! (is-eq tx-sender (get owner community)) err-unauthorized)
    (ok (map-set community-members
      { community-id: community-id, member: member }
      { role: role, joined-at: block-height }
    ))
  )
)

;; Check if user is community member
(define-read-only (is-community-member (community-id uint) (member principal))
  (is-some (map-get? community-members { community-id: community-id, member: member }))
)

;; Get member role in community
(define-read-only (get-member-role (community-id uint) (member principal))
  (map-get? community-members { community-id: community-id, member: member })
)

;; Update community settings
(define-public (update-community-settings (community-id uint) (settings {public-badges: bool, allow-member-requests: bool, require-approval: bool}))
  (let
    (
      (community (unwrap! (map-get? communities { community-id: community-id }) err-community-not-found))
    )
    (asserts! (is-eq tx-sender (get owner community)) err-unauthorized)
    (ok (map-set community-settings { community-id: community-id } settings))
  )
)

;; Deactivate community
(define-public (deactivate-community (community-id uint))
  (let
    (
      (community (unwrap! (map-get? communities { community-id: community-id }) err-community-not-found))
    )
    (asserts! (is-eq tx-sender (get owner community)) err-unauthorized)
    (ok (map-set communities 
      { community-id: community-id }
      (merge community { active: false })
    ))
  )
)

;; Transfer community ownership
(define-public (transfer-community-ownership (community-id uint) (new-owner principal))
  (let
    (
      (community (unwrap! (map-get? communities { community-id: community-id }) err-community-not-found))
    )
    (asserts! (is-eq tx-sender (get owner community)) err-unauthorized)
    (ok (map-set communities 
      { community-id: community-id }
      (merge community { owner: new-owner })
    ))
  )
)