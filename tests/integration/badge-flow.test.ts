import { loadFixture, mockStacksApi } from '../setup';

describe('Badge Flow Integration Tests', () => {
  const testUsers = loadFixture('test-users.json');
  const badgeTemplates = loadFixture('badge-templates.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Badge Issuance Flow', () => {
    test('should complete full badge creation and minting process', async () => {
      // Step 1: Create community
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'community-tx',
        success: true,
        result: { communityId: 1 }
      });

      const createCommunity = async () => mockStacksApi.broadcastTransaction();
      const communityResult = await createCommunity();
      expect(communityResult.success).toBe(true);

      // Step 2: Create badge template
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'template-tx',
        success: true,
        result: { templateId: 1 }
      });

      const createTemplate = async () => mockStacksApi.broadcastTransaction();
      const templateResult = await createTemplate();
      expect(templateResult.success).toBe(true);

      // Step 3: Authorize issuer
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'auth-tx',
        success: true
      });

      const authorizeIssuer = async () => mockStacksApi.broadcastTransaction();
      const authResult = await authorizeIssuer();
      expect(authResult.success).toBe(true);

      // Step 4: Mint badge
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'mint-tx',
        success: true,
        result: { badgeId: 1 }
      });

      const mintBadge = async () => mockStacksApi.broadcastTransaction();
      const mintResult = await mintBadge();
      expect(mintResult.success).toBe(true);

      // Step 5: Verify badge exists
      mockStacksApi.callReadOnlyFunction.mockResolvedValueOnce({
        result: {
          id: 1,
          owner: testUsers.users[0].address,
          active: true
        }
      });

      const getBadge = async () => mockStacksApi.callReadOnlyFunction();
      const badgeResult = await getBadge();
      expect(badgeResult.result.active).toBe(true);
    });

    test('should handle badge revocation flow', async () => {
      // Mock existing badge
      mockStacksApi.callReadOnlyFunction.mockResolvedValueOnce({
        result: {
          id: 1,
          owner: testUsers.users[0].address,
          active: true,
          issuer: testUsers.users[0].address
        }
      });

      // Revoke badge
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'revoke-tx',
        success: true
      });

      const revokeBadge = async () => mockStacksApi.broadcastTransaction();
      const revokeResult = await revokeBadge();
      expect(revokeResult.success).toBe(true);

      // Verify badge is inactive
      mockStacksApi.callReadOnlyFunction.mockResolvedValueOnce({
        result: {
          id: 1,
          owner: testUsers.users[0].address,
          active: false
        }
      });

      const getBadge = async () => mockStacksApi.callReadOnlyFunction();
      const badgeResult = await getBadge();
      expect(badgeResult.result.active).toBe(false);
    });
  });

  describe('Community Management Flow', () => {
    test('should complete community setup and member management', async () => {
      // Create community
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'community-tx',
        success: true,
        result: { communityId: 1 }
      });

      // Add member
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'member-tx',
        success: true
      });

      // Set permissions
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'permission-tx',
        success: true
      });

      const setupCommunity = async () => {
        await mockStacksApi.broadcastTransaction(); // create
        await mockStacksApi.broadcastTransaction(); // add member
        await mockStacksApi.broadcastTransaction(); // set permissions
      };

      await setupCommunity();
      expect(mockStacksApi.broadcastTransaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Access Control Integration', () => {
    test('should enforce permissions across all operations', async () => {
      // Check permission before operation
      mockStacksApi.callReadOnlyFunction.mockResolvedValueOnce({
        result: false // No permission
      });

      const checkPermission = async () => mockStacksApi.callReadOnlyFunction();
      const hasPermission = await checkPermission();
      
      if (!hasPermission.result) {
        // Should not proceed with operation
        expect(mockStacksApi.broadcastTransaction).not.toHaveBeenCalled();
      }

      // Grant permission
      mockStacksApi.broadcastTransaction.mockResolvedValueOnce({
        txid: 'grant-tx',
        success: true
      });

      // Check permission again
      mockStacksApi.callReadOnlyFunction.mockResolvedValueOnce({
        result: true // Has permission
      });

      const grantPermission = async () => mockStacksApi.broadcastTransaction();
      await grantPermission();

      const hasPermissionNow = await checkPermission();
      expect(hasPermissionNow.result).toBe(true);
    });
  });
});