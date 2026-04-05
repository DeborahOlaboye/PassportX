/**
 * Centralised JWT secret accessor.
 *
 * All JWT operations (sign + verify) must go through `requireJwtSecret()`.
 * This prevents the `process.env.JWT_SECRET!` non-null assertion anti-pattern,
 * which silently passes `undefined` to jsonwebtoken and causes an unhandled
 * TypeError that crashes the request and leaks an internal stack trace.
 *
 * Usage:
 *   import { requireJwtSecret } from '../utils/jwtSecret';
 *   const secret = requireJwtSecret();  // throws clearly if env var is absent
 */

import logger from './logger';

/** Cached after first successful read so we only validate once per process. */
let _cachedSecret: string | undefined;

/**
 * Returns the JWT_SECRET environment variable or throws a descriptive error.
 * The value is cached in-process after the first call so repeated reads do
 * not incur multiple env lookups.
 *
 * @throws {Error} if JWT_SECRET is not set or is an empty string
 */
export function requireJwtSecret(): string {
  if (_cachedSecret !== undefined) {
    return _cachedSecret;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error(
      'JWT_SECRET environment variable is not set — refusing to start JWT operations'
    );
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
        'Copy backend/.env.example to backend/.env and set a strong random value.'
    );
  }

  _cachedSecret = secret;
  return _cachedSecret;
}

/**
 * Reset the cached secret. Only for use in tests that need to simulate a
 * missing or changed JWT_SECRET between test cases.
 *
 * @internal
 */
export function _resetJwtSecretCache(): void {
  _cachedSecret = undefined;
}
