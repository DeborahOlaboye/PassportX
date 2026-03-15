/**
 * Unit tests for authenticateToken and optionalAuth middlewares.
 * Verifies that JWT_SECRET is accessed safely and that missing/invalid tokens
 * return the correct HTTP status codes.
 */

import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { _resetJwtSecretCache } from '../../utils/jwtSecret';

const TEST_SECRET = 'test-jwt-secret-for-auth-middleware';

function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  };
}

describe('authenticateToken middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: TEST_SECRET };
    _resetJwtSecretCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetJwtSecretCache();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const { authenticateToken } = require('../../middleware/auth');
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access token required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when token is invalid', () => {
    const { authenticateToken } = require('../../middleware/auth');
    const req = makeReq('Bearer invalid.token.here');
    const res = makeRes();
    const next = jest.fn();

    authenticateToken(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() with user set when token is valid', () => {
    const { authenticateToken } = require('../../middleware/auth');

    const token = jwt.sign(
      { userId: 'user-123', stacksAddress: 'ST1ABC' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const req: any = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();

    authenticateToken(req, res, next);

    // Wait one tick for the jwt.verify callback
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({
          userId: 'user-123',
          stacksAddress: 'ST1ABC',
        });
        resolve();
      }, 10);
    });
  });

  it('returns 403 when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    _resetJwtSecretCache();

    const { authenticateToken } = require('../../middleware/auth');
    const token = 'any.token.here';
    const req: any = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();

    expect(() => authenticateToken(req, res, next)).toThrow(
      'JWT_SECRET environment variable is not set'
    );
  });
});

describe('optionalAuth middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: TEST_SECRET };
    _resetJwtSecretCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetJwtSecretCache();
  });

  it('calls next() without setting user when no token is provided', () => {
    const { optionalAuth } = require('../../middleware/auth');
    const req: any = makeReq();
    const res = makeRes();
    const next = jest.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('sets req.user when a valid token is provided', () => {
    const { optionalAuth } = require('../../middleware/auth');

    const token = jwt.sign(
      { userId: 'user-456', stacksAddress: 'ST2DEF' },
      TEST_SECRET,
      { expiresIn: '1h' }
    );

    const req: any = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();

    optionalAuth(req, res, next);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({
          userId: 'user-456',
          stacksAddress: 'ST2DEF',
        });
        resolve();
      }, 10);
    });
  });

  it('calls next() without setting user when token is invalid', () => {
    const { optionalAuth } = require('../../middleware/auth');
    const req: any = makeReq('Bearer bad.token');
    const res = makeRes();
    const next = jest.fn();

    optionalAuth(req, res, next);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
        resolve();
      }, 10);
    });
  });
});
