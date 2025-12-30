;; Community Manager Contract
;; Manages communities and their badge issuance permissions
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to contract owner
;; - u104: ERR-UNAUTHORIZED - Caller lacks required permissions
;; - u300: ERR-COMMUNITY-NOT-FOUND - Community does not exist
;; - u301: ERR-NOT-COMMUNITY-OWNER - Not the community owner
;; - u304: ERR-COMMUNITY-ALREADY-EXISTS - Community already exists

;; Import error codes from centralized error-codes contract
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-COMMUNITY-NOT-FOUND (err u300))
(define-constant ERR-NOT-COMMUNITY-OWNER (err u301))
(define-constant ERR-COMMUNITY-ALREADY-EXISTS (err u304))

;; Contract constants
(define-constant contract-owner tx-sender)

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

    ;; Emit community created event
    (print {
      event: "community-created",
      community-id: community-id,
      name: name,
      description: description,
      owner: tx-sender,
      block-height: block-height
    })

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
      (community (unwrap! (map-get? communities { community-id: community-id }) ERR-COMMUNITY-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (get owner community)) ERR-NOT-COMMUNITY-OWNER)

    ;; Emit member added event
    (print {
      event: "community-member-added",
      community-id: community-id,
      member: member,
      role: role,
      added-by: tx-sender,
      block-height: block-height
    })

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
      (community (unwrap! (map-get? communities { community-id: community-id }) ERR-COMMUNITY-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (get owner community)) ERR-NOT-COMMUNITY-OWNER)

    ;; Emit settings updated event
    (print {
      event: "community-settings-updated",
      community-id: community-id,
      public-badges: (get public-badges settings),
      allow-member-requests: (get allow-member-requests settings),
      require-approval: (get require-approval settings),
      updated-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set community-settings { community-id: community-id } settings))
  )
)

;; Deactivate community
(define-public (deactivate-community (community-id uint))
  (let
    (
      (community (unwrap! (map-get? communities { community-id: community-id }) ERR-COMMUNITY-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (get owner community)) ERR-NOT-COMMUNITY-OWNER)

    ;; Emit community deactivated event
    (print {
      event: "community-deactivated",
      community-id: community-id,
      deactivated-by: tx-sender,
      block-height: block-height
    })

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
      (community (unwrap! (map-get? communities { community-id: community-id }) ERR-COMMUNITY-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (get owner community)) ERR-NOT-COMMUNITY-OWNER)

    ;; Emit ownership transferred event
    (print {
      event: "community-ownership-transferred",
      community-id: community-id,
      old-owner: tx-sender,
      new-owner: new-owner,
      block-height: block-height
    })

    (ok (map-set communities
      { community-id: community-id }
      (merge community { owner: new-owner })
    ))
  )
)