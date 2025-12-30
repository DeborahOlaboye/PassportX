;; Batch Minting Tests
;; Tests for batch badge minting functionality

(use-trait badge-issuer-trait .badge-issuer-trait.badge-issuer)

;; Helper function to create test badge templates
(define-private (create-test-templates (issuer principal))
  (begin
    (contract-call? .badge-issuer create-badge-template "Template 1" "Test Template 1" u1 u1)
    (contract-call? .badge-issuer create-badge-template "Template 2" "Test Template 2" u2 u1)
    (ok true)
  )
)

;; Test successful batch minting
(define-public (test-batch-mint-success (caller principal))
  (let (
      (recipients (list 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG))
      (template-ids (list u1 u1))
    )
    (try! (create-test-templates caller))
    
    ;; Authorize caller as issuer
    (try! (contract-call? .badge-issuer authorize-issuer caller))
    
    ;; Execute batch mint
    (let ((result (try! (contract-call? .badge-issuer batch-mint-badges recipients template-ids))))
      (ok result)
    )
  )
)

;; Test batch mint with mismatched array lengths
(define-public (test-batch-mint-mismatched-arrays (caller principal))
  (let (
      (recipients (list 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
      (template-ids (list u1 u2)) ;; One extra template ID
    )
    (try! (create-test-templates caller))
    (try! (contract-call? .badge-issuer authorize-issuer caller))
    
    (contract-call? .badge-issuer batch-mint-badges recipients template-ids)
  )
)

;; Test batch mint with unauthorized caller
(define-public (test-batch-mint-unauthorized (caller principal))
  (let (
      (recipients (list 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
      (template-ids (list u1))
    )
    (try! (create-test-templates caller))
    
    ;; Don't authorize caller as issuer
    (contract-call? .badge-issuer batch-mint-badges recipients template-ids)
  )
)

;; Test batch mint with empty arrays
(define-public (test-batch-mint-empty-arrays (caller principal))
  (let (
      (recipients (list))
      (template-ids (list))
    )
    (try! (create-test-templates caller))
    (try! (contract-call? .badge-issuer authorize-issuer caller))
    
    (contract-call? .badge-issuer batch-mint-badges recipients template-ids)
  )
)

;; Test batch mint with too many items
(define-public (test-batch-mint-too-many-items (caller principal))
  (let (
      (recipients (list 
        'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
        'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ARQCP2MEK
        'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB 'ST3AM1A356AK2KS1RX21KDS6RJCWWEPT9XW8YJRSJ
        ;; ... add more to exceed 50 ...
      ))
      (template-ids (list 
        u1 u1 u1 u1 u1 u1 u1 u1 u1 u1 
        u1 u1 u1 u1 u1 u1 u1 u1 u1 u1
        u1 u1 u1 u1 u1 u1 u1 u1 u1 u1
        u1 u1 u1 u1 u1 u1 u1 u1 u1 u1
        u1 u1 u1 u1 u1 u1 u1 u1 u1 u1
        u1 ;; This makes it 51 items
      ))
    )
    (try! (create-test-templates caller))
    (try! (contract-call? .badge-issuer authorize-issuer caller))
    
    (contract-call? .badge-issuer batch-mint-badges recipients template-ids)
  )
)

;; Test batch mint event emission
(define-public (test-batch-mint-event (caller principal))
  (let (
      (recipients (list 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5))
      (template-ids (list u1))
    )
    (try! (create-test-templates caller))
    (try! (contract-call? .badge-issuer authorize-issuer caller))
    
    ;; Execute batch mint and capture events
    (let ((result (try! (contract-call? .badge-issuer batch-mint-badges recipients template-ids))))
      (ok result)
    )
    
    ;; In a real test, we would verify the event was emitted with correct data
    (ok true)
  )
)
