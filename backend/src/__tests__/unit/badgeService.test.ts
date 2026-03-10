import * as badgeService from '../../services/badgeService';
import Badge from '../../models/Badge';
import BadgeTemplate from '../../models/BadgeTemplate';
import User from '../../models/User';

jest.mock('../../models/Badge');
jest.mock('../../models/BadgeTemplate');
jest.mock('../../models/User');

const makeBadge = (owner: string) => ({
  _id: `badge-${owner}`,
  owner,
  templateId: { name: 'Test Badge', description: 'A badge', icon: '🏅' },
  community: { name: 'Test Community' },
  metadata: { level: 1, category: 'skill' },
  issuedAt: new Date(),
});

describe('badgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentBadges', () => {
    it('fetches all users in a single query rather than one per badge', async () => {
      const badges = ['addr1', 'addr2', 'addr3'].map(makeBadge);

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(badges),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);

      const mockUserQuery = {
        select: jest.fn().mockResolvedValue([
          { stacksAddress: 'addr1', name: 'Alice' },
          { stacksAddress: 'addr2', name: 'Bob' },
        ]),
      };
      (User.find as jest.Mock).mockReturnValue(mockUserQuery);

      const result = await badgeService.getRecentBadges(3);

      // User.find must be called exactly once (not once per badge)
      expect(User.find).toHaveBeenCalledTimes(1);
      expect(User.find).toHaveBeenCalledWith({
        stacksAddress: {
          $in: expect.arrayContaining(['addr1', 'addr2', 'addr3']),
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0].ownerName).toBe('Alice');
      expect(result[1].ownerName).toBe('Bob');
      expect(result[2].ownerName).toBe('Anonymous'); // addr3 not in user results
    });

    it('deduplicates owner addresses before the batch user query', async () => {
      // Two badges owned by the same address
      const badges = [makeBadge('addr1'), makeBadge('addr1')];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(badges),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);

      const mockUserQuery = {
        select: jest
          .fn()
          .mockResolvedValue([{ stacksAddress: 'addr1', name: 'Alice' }]),
      };
      (User.find as jest.Mock).mockReturnValue(mockUserQuery);

      await badgeService.getRecentBadges(2);

      // $in should contain only the unique address
      expect(User.find).toHaveBeenCalledWith({
        stacksAddress: { $in: ['addr1'] },
      });
    });

    it('caps limit at MAX_BADGE_LIMIT (100) to prevent unbounded queries', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await badgeService.getRecentBadges(9999);

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });

    it('enforces a minimum limit of 1', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      await badgeService.getRecentBadges(0);

      expect(mockQuery.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('getBadgesByCategory', () => {
    it('caps limit at MAX_BADGE_LIMIT (100)', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);

      await badgeService.getBadgesByCategory('skill', 500);

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('getBadgesByLevel', () => {
    it('caps limit at MAX_BADGE_LIMIT (100)', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      (Badge.find as jest.Mock).mockReturnValue(mockQuery);

      await badgeService.getBadgesByLevel(3, 500);

      expect(mockQuery.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('validateBadgeIssuance', () => {
    const templateId = 'template-1';
    const recipientAddress = 'SP_RECIPIENT';
    const issuerAddress = 'SP_ISSUER';

    it('throws when issuer is not in community admins array', async () => {
      const mockPopulate = jest.fn().mockResolvedValue({
        isActive: true,
        community: { admins: ['SP_OTHER_ADMIN'] },
      });
      (BadgeTemplate.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await expect(
        badgeService.validateBadgeIssuance(templateId, recipientAddress, issuerAddress)
      ).rejects.toThrow('Only community admin can issue badges');
    });

    it('throws when community.admins is missing (wrong field)', async () => {
      const mockPopulate = jest.fn().mockResolvedValue({
        isActive: true,
        community: { admin: issuerAddress }, // old wrong field — should still fail
      });
      (BadgeTemplate.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });

      await expect(
        badgeService.validateBadgeIssuance(templateId, recipientAddress, issuerAddress)
      ).rejects.toThrow('Only community admin can issue badges');
    });

    it('allows badge issuance when issuer is in community admins array', async () => {
      const mockPopulate = jest.fn().mockResolvedValue({
        isActive: true,
        community: { admins: [issuerAddress, 'SP_OTHER'] },
      });
      (BadgeTemplate.findById as jest.Mock).mockReturnValue({ populate: mockPopulate });
      (Badge.findOne as jest.Mock).mockResolvedValue(null); // no existing badge

      await expect(
        badgeService.validateBadgeIssuance(templateId, recipientAddress, issuerAddress)
      ).resolves.not.toThrow();
    });
  });
});
