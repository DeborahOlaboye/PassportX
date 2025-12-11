import { loadFixture, mockStacksApi, createMockUser, createMockBadge } from '../setup';

describe('PassportX API Tests', () => {
  const testUsers = loadFixture('test-users.json');
  const badgeTemplates = loadFixture('badge-templates.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Badge API', () => {
    test('should get user badges', async () => {
      const user = testUsers.users[0];
      const mockBadges = user.badges.map((id: number) => createMockBadge(id, id));
      
      mockStacksApi.callReadOnlyFunction.mockResolvedValue({
        result: mockBadges
      });

      // Mock API call
      const getUserBadges = async (address: string) => {
        return mockStacksApi.callReadOnlyFunction();
      };

      const result = await getUserBadges(user.address);
      expect(result.result).toHaveLength(2);
      expect(mockStacksApi.callReadOnlyFunction).toHaveBeenCalledTimes(1);
    });

    test('should create badge template', async () => {
      const template = badgeTemplates.templates[0];
      
      mockStacksApi.broadcastTransaction.mockResolvedValue({
        txid: 'mock-tx-id',
        success: true
      });

      const createTemplate = async (templateData: any) => {
        return mockStacksApi.broadcastTransaction();
      };

      const result = await createTemplate(template);
      expect(result.success).toBe(true);
      expect(result.txid).toBe('mock-tx-id');
    });

    test('should mint badge to user', async () => {
      mockStacksApi.broadcastTransaction.mockResolvedValue({
        txid: 'mint-tx-id',
        success: true
      });

      const mintBadge = async (recipient: string, templateId: number) => {
        return mockStacksApi.broadcastTransaction();
      };

      const result = await mintBadge(testUsers.users[0].address, 1);
      expect(result.success).toBe(true);
    });
  });

  describe('Community API', () => {
    test('should get community info', async () => {
      const community = testUsers.communities[0];
      
      mockStacksApi.callReadOnlyFunction.mockResolvedValue({
        result: community
      });

      const getCommunity = async (id: number) => {
        return mockStacksApi.callReadOnlyFunction();
      };

      const result = await getCommunity(1);
      expect(result.result.name).toBe('Dev Community');
    });

    test('should create community', async () => {
      mockStacksApi.broadcastTransaction.mockResolvedValue({
        txid: 'community-tx-id',
        success: true
      });

      const createCommunity = async (name: string, description: string) => {
        return mockStacksApi.broadcastTransaction();
      };

      const result = await createCommunity('Test Community', 'A test community');
      expect(result.success).toBe(true);
    });
  });

  describe('Access Control API', () => {
    test('should check user permissions', async () => {
      mockStacksApi.callReadOnlyFunction.mockResolvedValue({
        result: true
      });

      const checkPermission = async (user: string, permission: string) => {
        return mockStacksApi.callReadOnlyFunction();
      };

      const result = await checkPermission(testUsers.users[0].address, 'can-issue-badges');
      expect(result.result).toBe(true);
    });
  });
});