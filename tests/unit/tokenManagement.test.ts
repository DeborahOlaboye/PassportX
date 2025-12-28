/**
 * Unit tests for token management.
 */

import { AuthToken, isTokenExpired, getTokenExpiryTime } from '../../src/types/auth';
import { createAuthToken, validateTokenStructure } from '../../src/utils/sessionTokens';
import { storeAuthToken, retrieveAuthToken, clearAuthToken } from '../../src/utils/tokenStorage';

describe('Token management', () => {
  afterEach(() => {
    clearAuthToken();
  });

  it('should create auth token with all fields', () => {
    const token = createAuthToken('ST123456');
    expect(token.accessToken).toBeDefined();
    expect(token.refreshToken).toBeDefined();
    expect(token.account).toBe('ST123456');
    expect(token.issued).toBeGreaterThan(0);
    expect(token.expiresAt).toBeGreaterThan(token.issued);
  });

  it('should validate token structure', () => {
    const token = createAuthToken('ST123456');
    expect(validateTokenStructure(token)).toBe(true);
  });

  it('should reject invalid token structure', () => {
    const invalid = { accessToken: 'test' }; // missing fields
    expect(validateTokenStructure(invalid)).toBe(false);
  });

  it('should check token expiration', () => {
    const token: AuthToken = {
      accessToken: 'token',
      account: 'ST123',
      issued: Date.now(),
      expiresAt: Date.now() + 1000
    };
    expect(isTokenExpired(token)).toBe(false);

    const expired: AuthToken = {
      ...token,
      expiresAt: Date.now() - 1000
    };
    expect(isTokenExpired(expired)).toBe(true);
  });

  it('should store and retrieve token', async () => {
    const token = createAuthToken('ST123456');
    const stored = await storeAuthToken(token);
    expect(stored).toBe(true);

    const retrieved = retrieveAuthToken();
    expect(retrieved?.accessToken).toBe(token.accessToken);
    expect(retrieved?.account).toBe(token.account);
  });

  it('should clear token', async () => {
    const token = createAuthToken('ST123456');
    await storeAuthToken(token);
    const cleared = clearAuthToken();
    expect(cleared).toBe(true);

    const retrieved = retrieveAuthToken();
    expect(retrieved).toBeNull();
  });

  it('should get token expiry time with custom duration', () => {
    const now = Date.now();
    const oneHour = 1000 * 60 * 60;
    const expiry = getTokenExpiryTime(oneHour);
    expect(expiry).toBeGreaterThan(now);
    expect(expiry).toBeLessThanOrEqual(now + oneHour + 100);
  });
});
