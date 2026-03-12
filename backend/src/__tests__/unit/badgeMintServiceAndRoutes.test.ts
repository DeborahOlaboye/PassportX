// Mock Mongoose models so pre-existing type errors in Badge.ts don't block compilation
jest.mock('../../models/Badge', () => ({ default: {}, __esModule: true }));
jest.mock('../../models/BadgeTemplate', () => ({
  default: {},
  __esModule: true,
}));
jest.mock('../../models/User', () => ({ default: {}, __esModule: true }));
jest.mock('../../models/Community', () => ({ default: {}, __esModule: true }));

import { BadgeMintService, AuditLog } from '../../services/badgeMintService';

// Helper to build a minimal audit log entry
function makeLog(recipientAddress: string, index: number): AuditLog {
  return {
    timestamp: new Date(),
    eventType: 'badge_minted',
    badgeId: `badge-${index}`,
    badgeName: `Badge ${index}`,
    recipientAddress,
    contractAddress: 'SP1.contract',
    transactionHash: `txhash-${index}`,
    blockHeight: index,
    status: 'success',
  };
}

describe('BadgeMintService.getAuditLogs – pagination', () => {
  let service: BadgeMintService;

  beforeEach(() => {
    service = new BadgeMintService();
    // Inject 10 logs directly via the private field
    (service as any).auditLogs = Array.from({ length: 10 }, (_, i) =>
      makeLog('SP1ABC', i)
    );
  });

  it('returns the first `limit` logs when offset is 0', () => {
    const logs = service.getAuditLogs(3, 0);
    expect(logs).toHaveLength(3);
    expect(logs[0].badgeId).toBe('badge-0');
    expect(logs[2].badgeId).toBe('badge-2');
  });

  it('skips `offset` entries when offset > 0', () => {
    const logs = service.getAuditLogs(3, 5);
    expect(logs).toHaveLength(3);
    expect(logs[0].badgeId).toBe('badge-5');
    expect(logs[2].badgeId).toBe('badge-7');
  });

  it('returns remaining logs when limit exceeds available entries', () => {
    const logs = service.getAuditLogs(100, 8);
    expect(logs).toHaveLength(2);
    expect(logs[0].badgeId).toBe('badge-8');
    expect(logs[1].badgeId).toBe('badge-9');
  });

  it('returns empty array when offset is beyond the last entry', () => {
    const logs = service.getAuditLogs(10, 20);
    expect(logs).toHaveLength(0);
  });

  it('defaults to offset=0 and limit=100 when called with no arguments', () => {
    const logs = service.getAuditLogs();
    expect(logs).toHaveLength(10); // all 10 logs
    expect(logs[0].badgeId).toBe('badge-0');
  });
});

describe('BadgeMintService.getAuditLogsByRecipient', () => {
  let service: BadgeMintService;

  beforeEach(() => {
    service = new BadgeMintService();
    (service as any).auditLogs = [
      makeLog('SP1USER', 0),
      makeLog('SP2OTHER', 1),
      makeLog('SP1USER', 2),
    ];
  });

  it('returns only logs matching the given recipientAddress', () => {
    const logs = service.getAuditLogsByRecipient('SP1USER');
    expect(logs).toHaveLength(2);
    expect(logs.every((l) => l.recipientAddress === 'SP1USER')).toBe(true);
  });

  it('returns empty array for an unknown address', () => {
    expect(service.getAuditLogsByRecipient('SPUNKNOWN')).toHaveLength(0);
  });
});
