/**
 * Auth token types and definitions.
 */
import { UserData } from '@stacks/connect';

/**
 * Extended UserData interface with typed profile for Stacks.
 */
export interface StacksUserData extends UserData {
  profile: {
    stxAddress: {
      mainnet: string;
      testnet: string;
    };
    [key: string]: unknown;
  };
}

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
export const getTokenExpiryTime = (
  durationMs: number = 1000 * 60 * 60
): number => {
  return Date.now() + durationMs;
};

const authUtils = { AuthToken, AuthSession, isTokenExpired, getTokenExpiryTime };
export default authUtils;
