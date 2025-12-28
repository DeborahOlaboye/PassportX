/**
 * Auth token types and definitions.
 */

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  account: string;
  issued: number; // epoch ms
}

export interface AuthSession {
  token: AuthToken;
  verified: boolean; // whether signature was cryptographically verified
  lastVerified: number; // epoch ms
}

/**
 * Check if an auth token is expired.
 */
export const isTokenExpired = (token: AuthToken): boolean => {
  return Date.now() > token.expiresAt;
};

/**
 * Generate expiry time (default 1 hour from now).
 */
export const getTokenExpiryTime = (durationMs: number = 1000 * 60 * 60): number => {
  return Date.now() + durationMs;
};

export default { AuthToken, AuthSession, isTokenExpired, getTokenExpiryTime };
