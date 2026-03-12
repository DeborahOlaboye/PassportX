/**
 * Post-condition validation tests
 * Tests for smart contract post-condition validation in badge and community operations
 */

import {
  PostConditionValidator,
  MockTransactionFactory,
  TransactionErrorFactory,
} from '../__tests__/transaction-mocks';

describe('Post-Condition Validation Tests', () => {
  describe('STX Post-Condition Validation', () => {
    it('should validate STX send-greater-than condition', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      // Valid case: amount > required
      expect(PostConditionValidator.validateSTX(condition, 1001).valid).toBe(
        true
      );

      // Invalid case: amount <= required
      expect(PostConditionValidator.validateSTX(condition, 1000).valid).toBe(
        false
      );
      expect(PostConditionValidator.validateSTX(condition, 999).valid).toBe(
        false
      );
    });

    it('should validate STX send-greater-than-or-equal condition', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than-or-equal'
      );

      // Valid cases
      expect(PostConditionValidator.validateSTX(condition, 1001).valid).toBe(
        true
      );
      expect(PostConditionValidator.validateSTX(condition, 1000).valid).toBe(
        true
      );

      // Invalid case
      expect(PostConditionValidator.validateSTX(condition, 999).valid).toBe(
        false
      );
    });

    it('should validate STX send-less-than condition', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-less-than'
      );

      // Valid case
      expect(PostConditionValidator.validateSTX(condition, 999).valid).toBe(
        true
      );

      // Invalid cases
      expect(PostConditionValidator.validateSTX(condition, 1000).valid).toBe(
        false
      );
      expect(PostConditionValidator.validateSTX(condition, 1001).valid).toBe(
        false
      );
    });

    it('should validate STX send-less-than-or-equal condition', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-less-than-or-equal'
      );

      // Valid cases
      expect(PostConditionValidator.validateSTX(condition, 999).valid).toBe(
        true
      );
      expect(PostConditionValidator.validateSTX(condition, 1000).valid).toBe(
        true
      );

      // Invalid case
      expect(PostConditionValidator.validateSTX(condition, 1001).valid).toBe(
        false
      );
    });

    it('should validate STX send-equal condition', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-equal'
      );

      // Valid case
      expect(PostConditionValidator.validateSTX(condition, 1000).valid).toBe(
        true
      );

      // Invalid cases
      expect(PostConditionValidator.validateSTX(condition, 999).valid).toBe(
        false
      );
      expect(PostConditionValidator.validateSTX(condition, 1001).valid).toBe(
        false
      );
    });

    it('should provide reason for validation failures', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateSTX(condition, 500);
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('500');
      expect(result.reason).toContain('1000');
    });
  });

  describe('Fungible Token Post-Condition Validation', () => {
    it('should validate FT post-conditions', () => {
      const condition = MockTransactionFactory.createFTPostCondition(
        'ST123',
        'ST234.token-contract',
        'MY-TOKEN',
        5000,
        'send-greater-than'
      );

      // Valid case
      expect(PostConditionValidator.validateFT(condition, 5001).valid).toBe(
        true
      );

      // Invalid case
      expect(PostConditionValidator.validateFT(condition, 4999).valid).toBe(
        false
      );
    });

    it('should reject non-FT post-conditions', () => {
      const stxCondition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateFT(stxCondition, 1001);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Not an FT post-condition');
    });
  });

  describe('NFT Post-Condition Validation', () => {
    it('should validate NFT post-conditions', () => {
      const condition = MockTransactionFactory.createNFTPostCondition(
        'ST123',
        'ST234.nft-contract',
        'MY-NFT',
        'owns'
      );

      const result = PostConditionValidator.validateNFT(condition);
      expect(result.valid).toBe(true);
    });

    it('should reject non-NFT post-conditions', () => {
      const stxCondition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateNFT(stxCondition);
      expect(result.valid).toBe(false);
    });

    it('should require asset details for NFT validation', () => {
      const condition = {
        type: 'NFT' as const,
        principal: 'ST123',
        condition: 'owns',
      };

      const result = PostConditionValidator.validateNFT(condition);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Missing asset details');
    });
  });

  describe('Badge Issuance Post-Conditions', () => {
    it('should validate badge issuance fee post-condition', () => {
      // Typical badge issuance fee: 100 microSTX
      const feeCondition = MockTransactionFactory.createSTXPostCondition(
        'SPTest.badge-issuer',
        100,
        'send-greater-than-or-equal'
      );

      // Valid: paying exactly the fee
      expect(PostConditionValidator.validateSTX(feeCondition, 100).valid).toBe(
        true
      );

      // Valid: paying more than the fee
      expect(PostConditionValidator.validateSTX(feeCondition, 200).valid).toBe(
        true
      );

      // Invalid: paying less than the fee
      expect(PostConditionValidator.validateSTX(feeCondition, 99).valid).toBe(
        false
      );
    });

    it('should validate multiple post-conditions for badge issuance', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.badge-issuer',
          100,
          'send-greater-than-or-equal'
        ),
        MockTransactionFactory.createNFTPostCondition(
          'ST123',
          'SPTest.badge-nft',
          'BADGE-NFT',
          'receives'
        ),
      ];

      const actualAmounts = {
        'STX:': 150,
        'NFT:BADGE-NFT': 1,
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(true);
      expect(result.failures).toHaveLength(0);
    });

    it('should detect post-condition failures in badge issuance', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.badge-issuer',
          100,
          'send-greater-than-or-equal'
        ),
        MockTransactionFactory.createNFTPostCondition(
          'ST123',
          'SPTest.badge-nft',
          'BADGE-NFT',
          'receives'
        ),
      ];

      const actualAmounts = {
        'STX:': 50, // Less than required 100
        'NFT:BADGE-NFT': 0, // NFT not received
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
    });
  });

  describe('Community Creation Post-Conditions', () => {
    it('should validate community creation payment post-condition', () => {
      // Typical community creation payment: 1000 microSTX
      const paymentCondition = MockTransactionFactory.createSTXPostCondition(
        'SPTest.community-manager',
        1000,
        'send-equal'
      );

      // Valid: paying exactly the amount
      expect(
        PostConditionValidator.validateSTX(paymentCondition, 1000).valid
      ).toBe(true);

      // Invalid: paying different amount
      expect(
        PostConditionValidator.validateSTX(paymentCondition, 999).valid
      ).toBe(false);
      expect(
        PostConditionValidator.validateSTX(paymentCondition, 1001).valid
      ).toBe(false);
    });

    it('should validate multiple post-conditions for community creation', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.community-manager',
          1000,
          'send-equal'
        ),
        MockTransactionFactory.createNFTPostCondition(
          'ST123',
          'SPTest.community-nft',
          'COMMUNITY-NFT',
          'receives'
        ),
      ];

      const actualAmounts = {
        'STX:': 1000,
        'NFT:COMMUNITY-NFT': 1,
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(true);
    });

    it('should detect insufficient payment in community creation', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.community-manager',
          1000,
          'send-equal'
        ),
      ];

      const actualAmounts = {
        'STX:': 500, // Less than required
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(false);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].reason).toContain('500');
    });
  });

  describe('Post-Condition Edge Cases', () => {
    it('should handle zero amounts', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        0,
        'send-equal'
      );

      expect(PostConditionValidator.validateSTX(condition, 0).valid).toBe(true);
      expect(PostConditionValidator.validateSTX(condition, 1).valid).toBe(
        false
      );
    });

    it('should handle very large amounts', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000000000,
        'send-greater-than-or-equal'
      );

      expect(
        PostConditionValidator.validateSTX(condition, 1000000000).valid
      ).toBe(true);
      expect(
        PostConditionValidator.validateSTX(condition, 999999999).valid
      ).toBe(false);
    });

    it('should handle multiple post-conditions with mixed results', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'ST123',
          1000,
          'send-greater-than-or-equal'
        ),
        MockTransactionFactory.createSTXPostCondition(
          'ST456',
          500,
          'send-less-than'
        ),
      ];

      const actualAmounts = {
        'STX:': 1500, // First passes (>= 1000), second fails (>= 500)
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it('should validate all conditions even if some fail', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'ST123',
          1000,
          'send-greater-than-or-equal'
        ),
        MockTransactionFactory.createSTXPostCondition(
          'ST456',
          500,
          'send-less-than'
        ),
        MockTransactionFactory.createSTXPostCondition(
          'ST789',
          100,
          'send-equal'
        ),
      ];

      const actualAmounts = {
        'STX:': 750, // Various failures
      };

      const result = PostConditionValidator.validateAll(
        conditions,
        actualAmounts
      );
      expect(result.valid).toBe(false);
      expect(result.failures.length).toBeGreaterThan(1);
    });
  });

  describe('Post-Condition Type Mismatch', () => {
    it('should reject STX validation on non-STX condition', () => {
      const ftCondition = MockTransactionFactory.createFTPostCondition(
        'ST123',
        'ST234.token',
        'TOKEN',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateSTX(ftCondition, 1001);
      expect(result.valid).toBe(false);
    });

    it('should reject FT validation on non-FT condition', () => {
      const stxCondition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateFT(stxCondition, 1001);
      expect(result.valid).toBe(false);
    });

    it('should reject NFT validation on non-NFT condition', () => {
      const stxCondition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateNFT(stxCondition);
      expect(result.valid).toBe(false);
    });
  });

  describe('Post-Condition Validation Errors', () => {
    it('should provide clear error messages for validation failures', () => {
      const condition = MockTransactionFactory.createSTXPostCondition(
        'ST123',
        1000,
        'send-greater-than'
      );

      const result = PostConditionValidator.validateSTX(condition, 500);
      expect(result.reason).toMatch(/500/);
      expect(result.reason).toMatch(/1000/);
      expect(result.reason).toMatch(/greater/);
    });

    it('should handle missing post-condition fields', () => {
      const incompleteCondition = {
        type: 'STX' as const,
        principal: 'ST123',
        condition: 'send-greater-than',
        // Missing amount
      };

      const result = PostConditionValidator.validateSTX(
        incompleteCondition,
        1000
      );
      expect(result.valid).toBe(false);
    });

    it('should identify incorrect condition type', () => {
      const condition = {
        type: 'UNKNOWN' as any,
        principal: 'ST123',
        condition: 'send-greater-than',
        amount: 1000,
      };

      const result = PostConditionValidator.validateSTX(condition, 1001);
      expect(result.valid).toBe(false);
    });
  });

  describe('Real-World Post-Condition Scenarios', () => {
    it('should validate badge issuance with STX burn and NFT mint', () => {
      const badgeFee = MockTransactionFactory.createSTXPostCondition(
        'SPTest.badge-issuer',
        100,
        'send-greater-than-or-equal'
      );

      const nftMint = MockTransactionFactory.createNFTPostCondition(
        'ST123',
        'SPTest.badge-nft',
        'BADGE-NFT',
        'receives'
      );

      const conditions = [badgeFee, nftMint];
      const amounts = {
        'STX:': 150,
        'NFT:BADGE-NFT': 1,
      };

      const result = PostConditionValidator.validateAll(conditions, amounts);
      expect(result.valid).toBe(true);
    });

    it('should detect insufficient STX for badge issuance', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.badge-issuer',
          100,
          'send-greater-than-or-equal'
        ),
      ];

      const amounts = {
        'STX:': 50,
      };

      const result = PostConditionValidator.validateAll(conditions, amounts);
      expect(result.valid).toBe(false);
      expect(result.failures[0].reason).toContain('50');
    });

    it('should validate complex multi-condition community setup', () => {
      const conditions = [
        MockTransactionFactory.createSTXPostCondition(
          'SPTest.community-manager',
          1000,
          'send-equal'
        ),
        MockTransactionFactory.createNFTPostCondition(
          'ST123',
          'SPTest.community-nft',
          'COMMUNITY-NFT',
          'receives'
        ),
        MockTransactionFactory.createFTPostCondition(
          'ST456',
          'SPTest.governance-token',
          'GOV-TOKEN',
          1000,
          'send-equal'
        ),
      ];

      const amounts = {
        'STX:': 1000,
        'NFT:COMMUNITY-NFT': 1,
        'FT:GOV-TOKEN': 1000,
      };

      const result = PostConditionValidator.validateAll(conditions, amounts);
      expect(result.valid).toBe(true);
    });
  });
});
