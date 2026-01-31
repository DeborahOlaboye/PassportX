;; Pausable Trait
;; Defines the interface for pausing and unpausing contract functionality

(define-trait pausable
  (
    ;; Check if the contract is paused
    (is-paused () (response bool uint))

    ;; Pause/Unpause the contract
    (set-paused (bool) (response bool uint))
  )
)
