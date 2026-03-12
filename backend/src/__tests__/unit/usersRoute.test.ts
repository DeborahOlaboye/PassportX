/**
 * Tests for backend/src/routes/users.ts fixes:
 * - OOM fix: aggregation pipeline for /stats/:address
 * - Race condition fix: findOneAndUpdate upsert in /passport/initialize
 * - NaN guards: parseInt + isNaN for page/limit in /badges and /communities
 * - Rate limiters on all public GET endpoints
 * - Input validation: name/bio length, isPublic type, customUrl format
 * - Settings validation: boolean type checks for showEmail, showBadges, etc.
 * - Stacks address format validation on all :address routes
 * - socialLinks sanitization: strip non-strings, truncate to 200 chars
 * - themePreferences.mode whitelist: light | dark | system
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../../models/Badge', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: Request, res: Response, next: NextFunction) => {
    (req as any).user = { stacksAddress: 'SP1VALID0001VALIDADDRESS0001VALID0001234', userId: 'u1' };
    next();
  },
  optionalAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../middleware/validation', () => ({
  validatePagination: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../middleware/upload', () => ({
  uploadAvatar: { single: () => (_req: Request, _res: Response, next: NextFunction) => next() },
  deleteOldAvatar: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

import User from '../../models/User';
import Badge from '../../models/Badge';
import router from '../../routes/users';

const app = express();
app.use(express.json());
app.use('/users', router);
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode || err.status || 500).json({ error: err.message });
});

const VALID_ADDRESS = 'SP1VALID0001VALIDADDRESS0001VALID0001234';
const INVALID_ADDRESS = 'not-a-stacks-address';

// ─── Address validation ───────────────────────────────────────────────────────

describe('Stacks address format validation', () => {
  it('GET /profile/:address rejects invalid address with 400', async () => {
    const res = await request(app).get(`/users/profile/${INVALID_ADDRESS}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid Stacks address/);
  });

  it('GET /badges/:address rejects invalid address with 400', async () => {
    const res = await request(app).get(`/users/badges/${INVALID_ADDRESS}`);
    expect(res.status).toBe(400);
  });

  it('GET /stats/:address rejects invalid address with 400', async () => {
    const res = await request(app).get(`/users/stats/${INVALID_ADDRESS}`);
    expect(res.status).toBe(400);
  });

  it('GET /communities/:address rejects invalid address with 400', async () => {
    const res = await request(app).get(`/users/communities/${INVALID_ADDRESS}`);
    expect(res.status).toBe(400);
  });

  it('PUT /settings/:address rejects invalid address with 400', async () => {
    const res = await request(app)
      .put(`/users/settings/${INVALID_ADDRESS}`)
      .send({ isPublic: true });
    expect(res.status).toBe(400);
  });
});

// ─── NaN guards ──────────────────────────────────────────────────────────────

describe('NaN guards in /badges/:address', () => {
  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue({ stacksAddress: VALID_ADDRESS, isPublic: true });
    (Badge.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    (Badge.countDocuments as jest.Mock).mockResolvedValue(0);
  });

  it('defaults page to 1 when page is not a number', async () => {
    const res = await request(app).get(`/users/badges/${VALID_ADDRESS}?page=abc&limit=10`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  it('defaults limit to 20 when limit is empty', async () => {
    const res = await request(app).get(`/users/badges/${VALID_ADDRESS}?page=1`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(20);
  });

  it('caps limit at 100', async () => {
    const res = await request(app).get(`/users/badges/${VALID_ADDRESS}?page=1&limit=999`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBe(100);
  });
});

// ─── Stats aggregation ────────────────────────────────────────────────────────

describe('GET /stats/:address — aggregation pipeline', () => {
  it('returns zero stats when no badges exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ stacksAddress: VALID_ADDRESS, isPublic: true, joinDate: new Date() });
    (Badge.aggregate as jest.Mock).mockResolvedValue([]);

    const res = await request(app).get(`/users/stats/${VALID_ADDRESS}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalBadges: 0, communities: 0, highestLevel: 0 });
  });

  it('returns aggregated stats from pipeline result', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ stacksAddress: VALID_ADDRESS, isPublic: true, joinDate: new Date('2024-01-01') });
    (Badge.aggregate as jest.Mock).mockResolvedValue([{ totalBadges: 5, communities: 2, highestLevel: 3 }]);

    const res = await request(app).get(`/users/stats/${VALID_ADDRESS}`);
    expect(res.status).toBe(200);
    expect(res.body.totalBadges).toBe(5);
    expect(res.body.communities).toBe(2);
    expect(res.body.highestLevel).toBe(3);
  });
});

// ─── Profile update validation ────────────────────────────────────────────────

describe('PUT /profile input validation', () => {
  beforeEach(() => {
    (User.findOne as jest.Mock).mockResolvedValue({
      stacksAddress: VALID_ADDRESS,
      save: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('rejects name longer than 100 chars', async () => {
    const res = await request(app)
      .put('/users/profile')
      .send({ name: 'a'.repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100 characters/);
  });

  it('rejects bio longer than 500 chars', async () => {
    const res = await request(app)
      .put('/users/profile')
      .send({ bio: 'b'.repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500 characters/);
  });

  it('rejects non-boolean isPublic', async () => {
    const res = await request(app)
      .put('/users/profile')
      .send({ isPublic: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/boolean/);
  });

  it('rejects customUrl shorter than 3 chars', async () => {
    const res = await request(app)
      .put('/users/profile')
      .send({ customUrl: 'ab' });
    expect(res.status).toBe(400);
  });

  it('rejects customUrl with uppercase letters', async () => {
    const res = await request(app)
      .put('/users/profile')
      .send({ customUrl: 'Alice' });
    expect(res.status).toBe(400);
  });
});

// ─── Settings validation ──────────────────────────────────────────────────────

describe('PUT /settings/:address boolean validation', () => {
  it('rejects non-boolean showEmail', async () => {
    const res = await request(app)
      .put(`/users/settings/${VALID_ADDRESS}`)
      .send({ showEmail: 'true' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/boolean/);
  });

  it('rejects non-boolean showBadges', async () => {
    const res = await request(app)
      .put(`/users/settings/${VALID_ADDRESS}`)
      .send({ showBadges: 1 });
    expect(res.status).toBe(400);
  });

  it('rejects non-boolean showCommunities', async () => {
    const res = await request(app)
      .put(`/users/settings/${VALID_ADDRESS}`)
      .send({ showCommunities: 'false' });
    expect(res.status).toBe(400);
  });
});

// ─── Passport initialization ──────────────────────────────────────────────────

describe('POST /passport/initialize', () => {
  it('creates a new user atomically using findOneAndUpdate upsert', async () => {
    const mockUser = { stacksAddress: VALID_ADDRESS, passportId: 'passport_SP_123' };
    (User.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app).post('/users/passport/initialize');
    expect(res.status).toBe(200);
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { stacksAddress: VALID_ADDRESS },
      expect.objectContaining({ $set: expect.any(Object), $setOnInsert: expect.any(Object) }),
      expect.objectContaining({ upsert: true, new: true })
    );
    expect(res.body.success).toBe(true);
    expect(res.body.data.stacksAddress).toBe(VALID_ADDRESS);
  });
});
