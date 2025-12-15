import { describe, expect, it } from 'vitest';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const user1 = accounts.get('wallet_1')!;
const user2 = accounts.get('wallet_2')!;

describe('Badge Verification Contract Tests', () => {
  describe('verify-badge-ownership', () => {
    it('should verify correct badge ownership', () => {
      // Setup: Create and mint a badge
      const { result: createResult } = simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Test Badge'),
          Cl.stringAscii('Test Description'),
          Cl.uint(1), // category
          Cl.uint(1), // level
        ],
        deployer
      );
      expect(createResult).toBeOk();

      const { result: mintResult } = simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );
      expect(mintResult).toBeOk();

      // Test: Verify ownership with correct owner
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-ownership',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );
      expect(verifyResult).toBeOk(Cl.bool(true));
    });

    it('should fail verification for incorrect owner', () => {
      // Setup: Create and mint a badge to user1
      simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Test Badge'),
          Cl.stringAscii('Test Description'),
          Cl.uint(1),
          Cl.uint(1),
        ],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );

      // Test: Verify ownership with wrong owner (user2)
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-ownership',
        [Cl.uint(1), Cl.principal(user2)],
        deployer
      );
      expect(verifyResult).toBeOk(Cl.bool(false));
    });

    it('should return error for non-existent badge', () => {
      // Test: Verify ownership for badge that doesn't exist
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-ownership',
        [Cl.uint(999), Cl.principal(user1)],
        deployer
      );
      expect(verifyResult).toBeErr(Cl.uint(102)); // err-not-found
    });
  });

  describe('verify-badge-authenticity', () => {
    it('should verify active badge authenticity', () => {
      // Setup: Create and mint a badge
      simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Authentic Badge'),
          Cl.stringAscii('Description'),
          Cl.uint(2),
          Cl.uint(3),
        ],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );

      // Test: Verify authenticity
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-authenticity',
        [Cl.uint(1)],
        deployer
      );

      expect(verifyResult).toBeOk();
      const authData = verifyResult.value;
      expect(authData).toHaveTupleProperty('exists', Cl.bool(true));
      expect(authData).toHaveTupleProperty('active', Cl.bool(true));
    });

    it('should detect revoked badge', () => {
      // Setup: Create, mint, and revoke a badge
      simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Badge to Revoke'),
          Cl.stringAscii('Description'),
          Cl.uint(1),
          Cl.uint(2),
        ],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'revoke-badge',
        [Cl.uint(1)],
        deployer
      );

      // Test: Verify authenticity of revoked badge
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-authenticity',
        [Cl.uint(1)],
        deployer
      );

      expect(verifyResult).toBeOk();
      const authData = verifyResult.value;
      expect(authData).toHaveTupleProperty('active', Cl.bool(false));
    });

    it('should return error for non-existent badge', () => {
      const { result: verifyResult } = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-authenticity',
        [Cl.uint(999)],
        deployer
      );
      expect(verifyResult).toBeErr(Cl.uint(102)); // err-not-found
    });
  });

  describe('get-verification-status', () => {
    it('should return complete verification status', () => {
      // Setup: Create and mint a badge
      simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Complete Badge'),
          Cl.stringAscii('Full verification test'),
          Cl.uint(3), // category
          Cl.uint(5), // level
        ],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );

      // Test: Get full verification status
      const { result: statusResult } = simnet.callReadOnly(
        'badge-reader',
        'get-verification-status',
        [Cl.uint(1)],
        deployer
      );

      expect(statusResult).toBeOk();
      const status = statusResult.value;
      expect(status).toHaveTupleProperty('verified', Cl.bool(true));
      expect(status).toHaveTupleProperty('active', Cl.bool(true));
      expect(status).toHaveTupleProperty('owner', Cl.principal(user1));
      expect(status).toHaveTupleProperty('issuer', Cl.principal(deployer));
      expect(status).toHaveTupleProperty('level', Cl.uint(5));
      expect(status).toHaveTupleProperty('category', Cl.uint(3));
    });

    it('should include issuer information', () => {
      // Setup
      simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Issuer Test'),
          Cl.stringAscii('Test issuer tracking'),
          Cl.uint(1),
          Cl.uint(1),
        ],
        deployer
      );

      simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );

      // Test: Verify issuer is tracked
      const { result: statusResult } = simnet.callReadOnly(
        'badge-reader',
        'get-verification-status',
        [Cl.uint(1)],
        deployer
      );

      expect(statusResult).toBeOk();
      expect(statusResult.value).toHaveTupleProperty('issuer', Cl.principal(deployer));
    });

    it('should return error for invalid badge', () => {
      const { result: statusResult } = simnet.callReadOnly(
        'badge-reader',
        'get-verification-status',
        [Cl.uint(999)],
        deployer
      );
      expect(statusResult).toBeErr(Cl.uint(102)); // err-not-found
    });
  });

  describe('Integration: Verification workflow', () => {
    it('should handle complete verification lifecycle', () => {
      // 1. Create template
      const createResult = simnet.callPublicFn(
        'badge-issuer',
        'create-badge-template',
        [
          Cl.stringAscii('Lifecycle Badge'),
          Cl.stringAscii('Testing full lifecycle'),
          Cl.uint(2),
          Cl.uint(3),
        ],
        deployer
      );
      expect(createResult.result).toBeOk();

      // 2. Mint badge
      const mintResult = simnet.callPublicFn(
        'badge-issuer',
        'mint-badge',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );
      expect(mintResult.result).toBeOk();

      // 3. Verify ownership
      const ownershipResult = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-ownership',
        [Cl.uint(1), Cl.principal(user1)],
        deployer
      );
      expect(ownershipResult.result).toBeOk(Cl.bool(true));

      // 4. Verify authenticity
      const authResult = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-authenticity',
        [Cl.uint(1)],
        deployer
      );
      expect(authResult.result).toBeOk();
      expect(authResult.result.value).toHaveTupleProperty('active', Cl.bool(true));

      // 5. Revoke badge
      const revokeResult = simnet.callPublicFn(
        'badge-issuer',
        'revoke-badge',
        [Cl.uint(1)],
        deployer
      );
      expect(revokeResult.result).toBeOk();

      // 6. Verify revocation reflected
      const postRevokeAuth = simnet.callReadOnly(
        'badge-reader',
        'verify-badge-authenticity',
        [Cl.uint(1)],
        deployer
      );
      expect(postRevokeAuth.result).toBeOk();
      expect(postRevokeAuth.result.value).toHaveTupleProperty('active', Cl.bool(false));
    });
  });
});
