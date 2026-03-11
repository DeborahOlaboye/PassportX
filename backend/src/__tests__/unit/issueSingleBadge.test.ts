/**
 * Unit tests for issueSingleBadge service helper.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockFindOne = jest.fn();
const mockSave = jest.fn().mockResolvedValue(undefined);

jest.mock('../../models/Badge', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((data: Record<string, unknown>) => ({
    ...data,
    _id: 'badge-mock-id',
    save: mockSave,
  })),
}));

// Badge.findOne needs to be on the constructor mock itself
const BadgeMock = require('../../models/Badge').default;
BadgeMock.findOne = mockFindOne;

jest.mock('../../models/BadgeTemplate', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../../models/Community', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../../models/User', () => ({
  __esModule: true,
  default: {},
}));

import { issueSingleBadge } from '../../services/badgeService';
import type { IPopulatedBadgeTemplate } from '../../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTemplate(overrides = {}): IPopulatedBadgeTemplate {
  return {
    _id: 'template-1',
    name: 'Early Contributor',
    description: 'test',
    category: 'contribution',
    level: 1,
    icon: '🏆',
    isActive: true,
    community: { _id: 'community-1', admins: ['SP1ABC'] } as any,
    ...overrides,
  } as unknown as IPopulatedBadgeTemplate;
}

beforeEach(() => jest.clearAllMocks());

// ── Tests ──────────────────────────────────────────────────────────────────

describe('issueSingleBadge', () => {
  const VALID_ADDRESS = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9';
  const ISSUER = 'SP1ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB';

  it('returns badgeId and recipientAddress on success', async () => {
    mockFindOne.mockResolvedValue(null); // no existing badge

    const result = await issueSingleBadge(
      makeTemplate(),
      VALID_ADDRESS,
      ISSUER,
      'tx-001'
    );

    expect(result).toEqual({
      badgeId: 'badge-mock-id',
      recipientAddress: VALID_ADDRESS,
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('throws when badge already exists for recipient', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing-badge' });

    await expect(
      issueSingleBadge(makeTemplate(), VALID_ADDRESS, ISSUER)
    ).rejects.toThrow('Badge already issued to this recipient');

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not call save when duplicate detected', async () => {
    mockFindOne.mockResolvedValue({ _id: 'dup' });

    try {
      await issueSingleBadge(makeTemplate(), VALID_ADDRESS, ISSUER);
    } catch {
      // expected
    }

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('passes transactionId to the badge document', async () => {
    mockFindOne.mockResolvedValue(null);

    await issueSingleBadge(makeTemplate(), VALID_ADDRESS, ISSUER, 'tx-abc');

    const BadgeCtor = require('../../models/Badge').default;
    const lastCall = BadgeCtor.mock.calls[0][0];
    expect(lastCall.transactionId).toBe('tx-abc');
  });

  it('sets metadata.level and metadata.category from the template', async () => {
    mockFindOne.mockResolvedValue(null);

    await issueSingleBadge(
      makeTemplate({ level: 3, category: 'leadership' }),
      VALID_ADDRESS,
      ISSUER
    );

    const BadgeCtor = require('../../models/Badge').default;
    const lastCall = BadgeCtor.mock.calls[0][0];
    expect(lastCall.metadata.level).toBe(3);
    expect(lastCall.metadata.category).toBe('leadership');
  });
});
