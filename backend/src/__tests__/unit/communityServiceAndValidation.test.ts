import { validateStacksAddress } from '../../middleware/validation';
import Badge from '../../models/Badge';
import User from '../../models/User';

jest.mock('../../models/Badge');
jest.mock('../../models/User');

// ── validateStacksAddress ──────────────────────────────────────────────────
describe('validateStacksAddress', () => {
  const validAddresses = [
    'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // mainnet standard
    'SM2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // mainnet contract
    'ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // testnet standard
    'SN2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // testnet contract
  ];

  const invalidAddresses = [
    '', // empty
    'BC1QXYZ', // bitcoin address
    'SA2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // bad second char
    'SP', // too short
    'not-an-address', // garbage
    'sp2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // lowercase prefix
  ];

  test.each(validAddresses)('accepts %s', (addr) => {
    expect(validateStacksAddress(addr)).toBe(true);
  });

  test.each(invalidAddresses)('rejects %s', (addr) => {
    expect(validateStacksAddress(addr)).toBe(false);
  });
});

// ── getCommunityLeaderboard ────────────────────────────────────────────────
describe('getCommunityLeaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches users in a single batch query instead of one per entry', async () => {
    const leaderboardEntries = [
      { _id: 'addr1', badgeCount: 5, highestLevel: 3, latestBadge: new Date() },
      { _id: 'addr2', badgeCount: 3, highestLevel: 2, latestBadge: new Date() },
    ];

    (Badge.aggregate as jest.Mock).mockResolvedValue(leaderboardEntries);

    const mockUserQuery = {
      select: jest.fn().mockResolvedValue([
        { stacksAddress: 'addr1', name: 'Alice', avatar: null },
        { stacksAddress: 'addr2', name: 'Bob', avatar: null },
      ]),
    };
    (User.find as jest.Mock).mockReturnValue(mockUserQuery);

    const {
      getCommunityLeaderboard,
    } = require('../../services/communityService');
    const result = await getCommunityLeaderboard('community-id', 10);

    // User.find must be called exactly once regardless of leaderboard size
    expect(User.find).toHaveBeenCalledTimes(1);
    expect(User.find).toHaveBeenCalledWith({
      stacksAddress: { $in: ['addr1', 'addr2'] },
    });

    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
  });

  it('falls back to Anonymous when user is not found', async () => {
    (Badge.aggregate as jest.Mock).mockResolvedValue([
      {
        _id: 'unknown-addr',
        badgeCount: 1,
        highestLevel: 1,
        latestBadge: new Date(),
      },
    ]);
    (User.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });

    const {
      getCommunityLeaderboard,
    } = require('../../services/communityService');
    const result = await getCommunityLeaderboard('community-id', 5);

    expect(result[0].name).toBe('Anonymous');
  });
});
