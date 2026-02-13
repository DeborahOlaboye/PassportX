/**
 * Rate limit configuration for different endpoint categories.
 * Each category has its own window and max request count,
 * tuned to the sensitivity and expected usage patterns.
 *
 * Rate Limit Summary (requests per 15-minute window):
 * -------------------------------------------------------
 * AUTH_RATE_LIMIT             10   - Login, message signing
 * COMMUNITY_WRITE_RATE_LIMIT  15   - Create, update, delete communities
 * BADGE_ISSUANCE_RATE_LIMIT   20   - Issue, batch issue, revoke badges
 * WEBHOOK_RATE_LIMIT          20   - Register, update, delete webhooks
 * USER_WRITE_RATE_LIMIT       30   - Profile updates, avatar uploads
 * BLOCKCHAIN_RATE_LIMIT       30   - Transaction status, balances, contracts
 * NOTIFICATION_WRITE_RATE_LIMIT 50 - Mark read, delete notifications
 * VERIFICATION_RATE_LIMIT     50   - Badge and user verification
 * DEFAULT_RATE_LIMIT         100   - Global fallback for unlisted routes
 * API_READ_RATE_LIMIT        200   - Search, analytics, activity feeds
 */

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

// Strict: auth endpoints prone to brute force
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
};

// Strict: badge issuance is a critical write operation
export const BADGE_ISSUANCE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many badge issuance requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Moderate: community creation is a write operation
export const COMMUNITY_WRITE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many community modification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Moderate: profile and settings updates
export const USER_WRITE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many profile update requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Moderate: webhook registration and management
export const WEBHOOK_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many webhook requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Moderate: notification write operations
export const NOTIFICATION_WRITE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many notification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Relaxed: read-only API endpoints
export const API_READ_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Default: general API fallback
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
};

// Blockchain transaction endpoints
export const BLOCKCHAIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many blockchain requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};

// Verification endpoints
export const VERIFICATION_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many verification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};
