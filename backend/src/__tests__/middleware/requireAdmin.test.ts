import request from 'supertest';
import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import User from '../../models/User';
import { AuthRequest } from '../../types';

process.env.JWT_SECRET = 'test-secret-for-admin-tests';

const app = express();
app.use(express.json());

// Simple protected route that requires admin
app.get(
  '/admin-only',
  authenticateToken,
  requireAdmin,
  (_req: AuthRequest, res: Response) => {
    res.json({ ok: true });
  }
);

const makeToken = (userId: string) =>
  jwt.sign(
    { userId, stacksAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

describe('requireAdmin middleware', () => {
  let adminId: string;
  let regularId: string;

  beforeEach(async () => {
    const admin = await User.create({
      stacksAddress: 'ST1ADMIN000000000000000000000000000000000',
      isAdmin: true,
    });
    adminId = (admin._id as mongoose.Types.ObjectId).toString();

    const regular = await User.create({
      stacksAddress: 'ST1REGULAR00000000000000000000000000000000',
      isAdmin: false,
    });
    regularId = (regular._id as mongoose.Types.ObjectId).toString();
  });

  it('allows access for admin users', async () => {
    const token = makeToken(adminId);
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 403 for non-admin authenticated users', async () => {
    const token = makeToken(regularId);
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/admin-only');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a valid token with a non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const token = makeToken(fakeId);
    const res = await request(app)
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });
});
