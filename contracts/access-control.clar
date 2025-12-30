;; Access Control Contract
;; Centralized access control for badge issuance and management
;;
;; Error Codes Used:
;; - u100: ERR-OWNER-ONLY - Action restricted to contract owner
;; - u400: ERR-INSUFFICIENT-PERMISSIONS - Lacks required permissions
;; - u401: ERR-INVALID-ROLE - Role is invalid
;; - u403: ERR-ACCOUNT-SUSPENDED - Account is suspended
;; - u405: ERR-NOT-PLATFORM-ADMIN - Not a platform administrator

;; Import error codes from centralized error-codes contract
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-INSUFFICIENT-PERMISSIONS (err u400))
(define-constant ERR-INVALID-ROLE (err u401))
(define-constant ERR-ACCOUNT-SUSPENDED (err u403))
(define-constant ERR-NOT-PLATFORM-ADMIN (err u405))

;; Contract constants
(define-constant contract-owner tx-sender)

;; Role definitions
(define-constant ROLE-ADMIN "admin")
(define-constant ROLE-ISSUER "issuer")
(define-constant ROLE-MODERATOR "moderator")
(define-constant ROLE-MEMBER "member")

;; Global permissions
(define-map global-permissions
  { user: principal }
  { 
    can-create-communities: bool,
    can-issue-badges: bool,
    is-platform-admin: bool,
    suspended: bool
  }
)

;; Community-specific permissions
(define-map community-permissions
  { community-id: uint, user: principal }
  {
    can-issue-badges: bool,
    can-manage-members: bool,
    can-create-templates: bool,
    can-revoke-badges: bool,
    role: (string-ascii 32)
  }
)

;; Permission groups for batch management
(define-map permission-groups
  { group-id: uint }
  {
    name: (string-ascii 64),
    permissions: {
      can-issue-badges: bool,
      can-manage-members: bool,
      can-create-templates: bool,
      can-revoke-badges: bool
    }
  }
)

;; Initialize contract owner with full permissions
(map-set global-permissions
  { user: contract-owner }
  {
    can-create-communities: true,
    can-issue-badges: true,
    is-platform-admin: true,
    suspended: false
  }
)

;; Global permission management
(define-public (set-global-permissions (user principal) (permissions {can-create-communities: bool, can-issue-badges: bool, is-platform-admin: bool, suspended: bool}))
  (begin
    (asserts! (is-platform-admin tx-sender) ERR-NOT-PLATFORM-ADMIN)

    ;; Emit global permissions updated event
    (print {
      event: "global-permissions-updated",
      user: user,
      can-create-communities: (get can-create-communities permissions),
      can-issue-badges: (get can-issue-badges permissions),
      is-platform-admin: (get is-platform-admin permissions),
      suspended: (get suspended permissions),
      updated-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set global-permissions { user: user } permissions))
  )
)

;; Community permission management
(define-public (set-community-permissions (community-id uint) (user principal) (permissions {can-issue-badges: bool, can-manage-members: bool, can-create-templates: bool, can-revoke-badges: bool, role: (string-ascii 32)}))
  (begin
    (asserts! (can-manage-community-members community-id tx-sender) ERR-INSUFFICIENT-PERMISSIONS)

    ;; Emit community permissions updated event
    (print {
      event: "community-permissions-updated",
      community-id: community-id,
      user: user,
      can-issue-badges: (get can-issue-badges permissions),
      can-manage-members: (get can-manage-members permissions),
      can-create-templates: (get can-create-templates permissions),
      can-revoke-badges: (get can-revoke-badges permissions),
      role: (get role permissions),
      updated-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set community-permissions { community-id: community-id, user: user } permissions))
  )
)

;; Permission check functions
(define-read-only (is-platform-admin (user principal))
  (default-to false (get is-platform-admin (map-get? global-permissions { user: user })))
)

(define-read-only (can-create-communities (user principal))
  (let
    (
      (perms (map-get? global-permissions { user: user }))
    )
    (and 
      (is-some perms)
      (get can-create-communities (unwrap-panic perms))
      (not (get suspended (unwrap-panic perms)))
    )
  )
)

(define-read-only (can-issue-badges-globally (user principal))
  (let
    (
      (perms (map-get? global-permissions { user: user }))
    )
    (and 
      (is-some perms)
      (get can-issue-badges (unwrap-panic perms))
      (not (get suspended (unwrap-panic perms)))
    )
  )
)

(define-read-only (can-issue-badges-in-community (community-id uint) (user principal))
  (let
    (
      (community-perms (map-get? community-permissions { community-id: community-id, user: user }))
      (global-perms (map-get? global-permissions { user: user }))
    )
    (or
      ;; Has community-specific permission
      (and 
        (is-some community-perms)
        (get can-issue-badges (unwrap-panic community-perms))
      )
      ;; Has global permission and not suspended
      (and
        (is-some global-perms)
        (get can-issue-badges (unwrap-panic global-perms))
        (not (get suspended (unwrap-panic global-perms)))
      )
    )
  )
)

(define-read-only (can-manage-community-members (community-id uint) (user principal))
  (let
    (
      (community-perms (map-get? community-permissions { community-id: community-id, user: user }))
    )
    (or
      (is-platform-admin user)
      (and 
        (is-some community-perms)
        (get can-manage-members (unwrap-panic community-perms))
      )
    )
  )
)

(define-read-only (can-revoke-badges-in-community (community-id uint) (user principal))
  (let
    (
      (community-perms (map-get? community-permissions { community-id: community-id, user: user }))
    )
    (or
      (is-platform-admin user)
      (and 
        (is-some community-perms)
        (get can-revoke-badges (unwrap-panic community-perms))
      )
    )
  )
)

;; Suspend/unsuspend users
(define-public (suspend-user (user principal))
  (let
    (
      (current-perms (default-to
        { can-create-communities: false, can-issue-badges: false, is-platform-admin: false, suspended: false }
        (map-get? global-permissions { user: user })
      ))
    )
    (asserts! (is-platform-admin tx-sender) ERR-NOT-PLATFORM-ADMIN)

    ;; Emit user suspended event
    (print {
      event: "user-suspended",
      user: user,
      suspended-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set global-permissions
      { user: user }
      (merge current-perms { suspended: true })
    ))
  )
)

(define-public (unsuspend-user (user principal))
  (let
    (
      (current-perms (default-to
        { can-create-communities: false, can-issue-badges: false, is-platform-admin: false, suspended: false }
        (map-get? global-permissions { user: user })
      ))
    )
    (asserts! (is-platform-admin tx-sender) ERR-NOT-PLATFORM-ADMIN)

    ;; Emit user unsuspended event
    (print {
      event: "user-unsuspended",
      user: user,
      unsuspended-by: tx-sender,
      block-height: block-height
    })

    (ok (map-set global-permissions
      { user: user }
      (merge current-perms { suspended: false })
    ))
  )
)