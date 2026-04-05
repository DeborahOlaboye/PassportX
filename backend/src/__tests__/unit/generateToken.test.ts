/**
 * Unit tests for authService.generateToken
 * Verifies that the function uses requireJwtSecret() safely and produces
 * a verifiable JWT rather than crashing when JWT_SECRET is missing.
 *
 * Strategy: mock jwtSecret directly so we control what requireJwtSecret()
 * returns, avoiding the need for jest.resetModules() and cross-instance
 * cache confusion.
 */

const TEST_SECRET = 'test-secret-generate-token';

// Mock all heavy dependencies of authService before any imports.
jest.mock('../../utils/jwtSecret', () => ({
  requireJwtSecret: jest.fn().mockReturnValue(TEST_SECRET),
  _resetJwtSecretCache: jest.fn(),
}));
jest.mock('@stacks/transactions', () => ({
  publicKeyFromSignatureRsv: jest.fn(),
  getAddressFromPublicKey: jest.fn(),
  createMessageSignature: jest.fn(),
  TransactionVersion: { Testnet: 0, Mainnet: 1 },
  validateStacksAddress: jest.fn().mockReturnValue(true),
}));
jest.mock('../../models/User');
jest.mock('../../middleware/errorHandler', () => ({
  createError: jest.fn((msg: string, code: number) => {
    const e = new Error(msg);
    (e as any).status = code;
    return e;
  }),
}));
jest.mock('../../utils/sessionManager', () => ({
  setSessionCookie: jest.fn(),
  clearSessionCookie: jest.fn(),
}));
jest.mock('../../services/nonceService', () => ({
  generateNonce: jest.fn().mockReturnValue('nonce'),
  validateNonce: jest.fn().mockReturnValue(true),
  invalidateNonce: jest.fn(),
}));

import jwt from 'jsonwebtoken';
import { requireJwtSecret } from '../../utils/jwtSecret';
import { generateToken } from '../../services/authService';

const mockRequireJwtSecret = requireJwtSecret as jest.Mock;

describe('authService.generateToken', () => {
  beforeEach(() => {
    mockRequireJwtSecret.mockReturnValue(TEST_SECRET);
    delete process.env.JWT_EXPIRES_IN;
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_EXPIRES_IN;
  });

  it('returns a JWT containing the expected stacksAddress and userId', () => {
    const token = generateToken('ST1ABC', 'user-001');

    const decoded = jwt.verify(token, TEST_SECRET) as Record<string, unknown>;
    expect(decoded.stacksAddress).toBe('ST1ABC');
    expect(decoded.userId).toBe('user-001');
  });

  it('returns a token that expires after the configured duration', () => {
    process.env.JWT_EXPIRES_IN = '1h';
    const token = generateToken('ST1ABC', 'user-002');

    const decoded = jwt.decode(token) as Record<string, unknown>;
    const exp = decoded.exp as number;
    const iat = decoded.iat as number;
    expect(exp - iat).toBe(3600); // 1 hour in seconds
  });

  it('throws a clear error when JWT_SECRET is not set', () => {
    mockRequireJwtSecret.mockImplementationOnce(() => {
      throw new Error('JWT_SECRET environment variable is not set');
    });

    expect(() => generateToken('ST1ABC', 'user-003')).toThrow(
      'JWT_SECRET environment variable is not set'
    );
  });
});
