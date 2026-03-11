/**
 * Unit tests for POST /badges/issue/batch input validation:
 *   - MAX_BATCH_SIZE enforcement (100 recipients)
 *   - empty array rejection
 *   - non-string element rejection
 *   - Stacks address format validation per element
 *   - deduplication (same address twice → one issuance)
 *   - templateId type check
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../models/Badge', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn().mockImplementation(() => ({
      _id: 'badge-id',
      save: jest.fn().mockResolvedValue(undefined),
    })),
    { findOne: jest.fn().mockResolvedValue(null) }
  ),
}));

jest.mock('../../models/BadgeTemplate', () => {
  const community = {
    _id: 'community-1',
    admins: ['SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9'],
    name: 'Test Community',
  };
  const template = {
    _id: 'template-1',
    name: 'Contributor',
    isActive: true,
    level: 1,
    category: 'contribution',
    community,
    populate: jest.fn().mockReturnThis(),
  };
  return {
    __esModule: true,
    default: {
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(template),
      }),
    },
  };
});

jest.mock('../../models/Community', () => ({
  __esModule: true,
  default: {},
}));
jest.mock('../../models/User', () => ({ __esModule: true, default: {} }));
jest.mock('../../services/communityService', () => ({
  updateMemberCount: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../services/badgeService', () => ({
  issueSingleBadge: jest
    .fn()
    .mockImplementation((_t, addr) =>
      Promise.resolve({ badgeId: 'badge-id', recipientAddress: addr })
    ),
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { stacksAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9' };
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../middleware/validation', () => ({
  validatePagination: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../config/rateLimits', () => ({
  BADGE_ISSUANCE_RATE_LIMIT: { windowMs: 60_000, max: 100 },
}));
jest.mock('../../middleware/webhookValidation', () => ({
  validateWebhookSignature: () => (_req: any, _res: any, next: any) => next(),
  getWebhookValidationConfig: () => ({}),
}));
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import express from 'express';
import request from 'supertest';
import { issueSingleBadge } from '../../services/badgeService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const badgesRouter = require('../../routes/badges').default;

const app = express();
app.use(express.json());
app.use('/badges', badgesRouter);

// Catch errors forwarded by next(error)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    res.status(err.status ?? err.statusCode ?? 500).json({ error: err.message });
  }
);

const VALID_ADDR_1 = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9';
const VALID_ADDR_2 = 'SP1ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789AB';

beforeEach(() => jest.clearAllMocks());

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /badges/issue/batch', () => {
  const ENDPOINT = '/badges/issue/batch';
  const BASE_BODY = { templateId: 'template-1' };

  it('returns 400 when recipientAddresses is missing', async () => {
    const res = await request(app).post(ENDPOINT).send(BASE_BODY);
    expect(res.status).toBe(400);
  });

  it('returns 400 when recipientAddresses is not an array', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ ...BASE_BODY, recipientAddresses: 'SP2PABAF9' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when recipientAddresses is an empty array', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ ...BASE_BODY, recipientAddresses: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non-empty/i);
  });

  it('returns 400 when batch exceeds MAX_BATCH_SIZE (100)', async () => {
    const addrs = Array.from(
      { length: 101 },
      () => VALID_ADDR_1
    );
    const res = await request(app)
      .post(ENDPOINT)
      .send({ ...BASE_BODY, recipientAddresses: addrs });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100/);
  });

  it('accepts exactly MAX_BATCH_SIZE (100) recipients', async () => {
    const addrs = Array.from({ length: 100 }, (_, i) =>
      `SP${String(i).padStart(39, '0')}`
    );
    // All valid format — will be accepted by the route (service mock resolves)
    const res = await request(app)
      .post(ENDPOINT)
      .send({ ...BASE_BODY, recipientAddresses: addrs });
    // 201 or possible service error; important thing is NOT 400 for batch size
    expect(res.status).not.toBe(400);
  });

  it('returns 400 when an element is not a string', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({
        ...BASE_BODY,
        recipientAddresses: [VALID_ADDR_1, 12345],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/\[1\]/);
  });

  it('returns 400 when an element is an empty string', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({
        ...BASE_BODY,
        recipientAddresses: [VALID_ADDR_1, ''],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/\[1\]/);
  });

  it('returns 400 when an address has invalid Stacks format', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({
        ...BASE_BODY,
        recipientAddresses: [VALID_ADDR_1, 'not-an-address'],
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a valid Stacks address/i);
  });

  it('returns 201 and calls issueSingleBadge for each unique address', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({
        ...BASE_BODY,
        recipientAddresses: [VALID_ADDR_1, VALID_ADDR_2],
      });
    expect(res.status).toBe(201);
    expect(issueSingleBadge).toHaveBeenCalledTimes(2);
  });

  it('deduplicates addresses — only calls issueSingleBadge once per unique address', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({
        ...BASE_BODY,
        recipientAddresses: [VALID_ADDR_1, VALID_ADDR_1, VALID_ADDR_1],
      });
    expect(res.status).toBe(201);
    expect(issueSingleBadge).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when templateId is not a string', async () => {
    const res = await request(app)
      .post(ENDPOINT)
      .send({ templateId: 42, recipientAddresses: [VALID_ADDR_1] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/templateId/i);
  });

  it('includes issued count and errors in the response', async () => {
    (issueSingleBadge as jest.Mock).mockResolvedValueOnce({
      badgeId: 'b1',
      recipientAddress: VALID_ADDR_1,
    });

    const res = await request(app)
      .post(ENDPOINT)
      .send({ ...BASE_BODY, recipientAddresses: [VALID_ADDR_1] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('issued');
    expect(res.body).toHaveProperty('failed');
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('errors');
  });
});
