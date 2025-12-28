/**
 * Session token generator.
 * Creates secure, time-limited session tokens for authenticated users.
 */

import { AuthToken, getTokenExpiryTime } from '../types/auth';

/**
 * Generate a random token string (base64url encoded).
 */
const generateRandomToken = (lengthBytes: number = 32): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(lengthBytes));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Create a new auth token for a user.
 */
export const createAuthToken = (
  account: string,
  durationMs: number = 1000 * 60 * 60 // 1 hour default
): AuthToken => {
  return {
    accessToken: generateRandomToken(32),
    refreshToken: generateRandomToken(32),
    account,
    issued: Date.now(),
    expiresAt: getTokenExpiryTime(durationMs)
  };
};

/**
 * Validate token structure.
 */
export const validateTokenStructure = (token: any): token is AuthToken => {
  return (
    typeof token === 'object' &&
    token !== null &&
    typeof token.accessToken === 'string' &&
    typeof token.account === 'string' &&
    typeof token.issued === 'number' &&
    typeof token.expiresAt === 'number'
  );
};

export default { createAuthToken, validateTokenStructure };
