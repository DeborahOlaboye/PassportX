/**
 * Unit tests for accessControl route input validation:
 *   - NaN guards on limit/skip query params
 *   - Upper caps on limit values
 *   - Webhook body type validation
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../services/AccessControlEventHandler', () => ({
  __esModule: true,
  default: { handleEvent: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../services/AccessControlAuditService', () => ({
  __esModule: true,
  default: {
    queryLogs: jest.fn().mockResolvedValue([]),
    getSuspiciousActivity: jest.fn().mockResolvedValue([]),
    getUserHistory: jest.fn().mockResolvedValue([]),
    getCommunityHistory: jest.fn().mockResolvedValue([]),
  },
}));
jest.mock('../../services/AccessControlSecurityMonitor', () => ({
  __esModule: true,
  default: { getAlerts: jest.fn().mockReturnValue([]) },
}));
jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: unknown, _res: unknown, next: () => void) =>
    next(),
}));
jest.mock('../../config/rateLimits', () => ({
  API_READ_RATE_LIMIT: { windowMs: 60_000, max: 100 },
}));
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import AccessControlAuditService from '../../services/AccessControlAuditService';
import AccessControlSecurityMonitor from '../../services/AccessControlSecurityMonitor';

// Import the router AFTER all mocks are in place
// eslint-disable-next-line @typescript-eslint/no-var-requires
const accessControlRouter = require('../../routes/accessControl').default;

const app = express();
app.use(express.json());
app.use('/access-control', accessControlRouter);

// ── Helpers ────────────────────────────────────────────────────────────────

function auditSpy() {
  return AccessControlAuditService as jest.Mocked<
    typeof AccessControlAuditService
  >;
}
function securitySpy() {
  return AccessControlSecurityMonitor as jest.Mocked<
    typeof AccessControlSecurityMonitor
  >;
}

beforeEach(() => jest.clearAllMocks());

// ── GET /audit/logs ────────────────────────────────────────────────────────

describe('GET /access-control/audit/logs', () => {
  it('defaults limit=100 and skip=0 when params are omitted', async () => {
    await request(app).get('/access-control/audit/logs').expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, skip: 0 })
    );
  });

  it('uses provided limit and skip when valid', async () => {
    await request(app)
      .get('/access-control/audit/logs?limit=20&skip=5')
      .expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, skip: 5 })
    );
  });

  it('falls back to default when limit is NaN', async () => {
    await request(app).get('/access-control/audit/logs?limit=abc').expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });

  it('falls back to default when skip is NaN', async () => {
    await request(app).get('/access-control/audit/logs?skip=xyz').expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  it('caps limit at 500', async () => {
    await request(app).get('/access-control/audit/logs?limit=9999').expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 500 })
    );
  });

  it('rejects negative limit (falls back to default)', async () => {
    await request(app).get('/access-control/audit/logs?limit=-5').expect(200);
    expect(auditSpy().queryLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });
});

// ── GET /audit/suspicious ──────────────────────────────────────────────────

describe('GET /access-control/audit/suspicious', () => {
  it('defaults limit=50 when param is omitted', async () => {
    await request(app).get('/access-control/audit/suspicious').expect(200);
    expect(auditSpy().getSuspiciousActivity).toHaveBeenCalledWith(50);
  });

  it('uses valid limit', async () => {
    await request(app)
      .get('/access-control/audit/suspicious?limit=30')
      .expect(200);
    expect(auditSpy().getSuspiciousActivity).toHaveBeenCalledWith(30);
  });

  it('defaults when limit is NaN', async () => {
    await request(app)
      .get('/access-control/audit/suspicious?limit=bad')
      .expect(200);
    expect(auditSpy().getSuspiciousActivity).toHaveBeenCalledWith(50);
  });

  it('caps limit at 200', async () => {
    await request(app)
      .get('/access-control/audit/suspicious?limit=500')
      .expect(200);
    expect(auditSpy().getSuspiciousActivity).toHaveBeenCalledWith(200);
  });
});

// ── GET /security/alerts ───────────────────────────────────────────────────

describe('GET /access-control/security/alerts', () => {
  it('defaults limit=50 when param is omitted', async () => {
    await request(app).get('/access-control/security/alerts').expect(200);
    expect(securitySpy().getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it('uses valid limit', async () => {
    await request(app)
      .get('/access-control/security/alerts?limit=10')
      .expect(200);
    expect(securitySpy().getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('falls back to default when limit is NaN', async () => {
    await request(app)
      .get('/access-control/security/alerts?limit=notanumber')
      .expect(200);
    expect(securitySpy().getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );
  });

  it('caps limit at 200', async () => {
    await request(app)
      .get('/access-control/security/alerts?limit=999')
      .expect(200);
    expect(securitySpy().getAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200 })
    );
  });
});

// ── Webhook body validation ────────────────────────────────────────────────

const webhookEndpoints = [
  '/access-control/webhook/global-permission',
  '/access-control/webhook/community-permission',
  '/access-control/webhook/user-suspended',
  '/access-control/webhook/user-unsuspended',
  '/access-control/webhook/issuer-authorized',
  '/access-control/webhook/issuer-revoked',
  '/access-control/webhook/permission-group-created',
  '/access-control/webhook/member-role-changed',
  '/access-control/webhook/ownership-transferred',
];

describe('Webhook body validation', () => {
  for (const endpoint of webhookEndpoints) {
    describe(`POST ${endpoint}`, () => {
      it('returns 400 when body is a JSON array (not a plain object)', async () => {
        const res = await request(app)
          .post(endpoint)
          .send([{ foo: 'bar' }]);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
      });

      it('accepts a valid JSON object body and returns 200', async () => {
        const res = await request(app)
          .post(endpoint)
          .send({ apply: 'event', blockHeight: 1, transactionHash: 'txA' });
        // Service mock always resolves, so we expect 200
        expect(res.status).toBe(200);
      });
    });
  }
});
