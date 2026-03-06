import crypto from 'crypto';
import logger from '../utils/logger';

interface NonceEntry {
  nonce: string;
  stacksAddress: string;
  createdAt: number;
  expiresAt: number;
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map<string, NonceEntry>();

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

/**
 * Generate a cryptographically random nonce and store it server-side
 * for the given Stacks address. Nonces expire after 5 minutes and
 * are single-use — they must be invalidated after successful verification.
 */
export function generateNonce(stacksAddress: string): string {
  cleanup();
  const nonce = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  store.set(nonce, {
    nonce,
    stacksAddress,
    createdAt: now,
    expiresAt: now + NONCE_TTL_MS,
  });
  logger.debug('Auth nonce generated', {
    stacksAddress,
    noncePrefix: nonce.slice(0, 8),
    expiresAt: new Date(now + NONCE_TTL_MS).toISOString(),
  });
  return nonce;
}

/**
 * Validate that a nonce exists, has not expired, and belongs to the
 * given Stacks address. Does NOT invalidate — call invalidateNonce
 * after a successful full auth flow.
 */
export function validateNonce(nonce: string, stacksAddress: string): boolean {
  const entry = store.get(nonce);
  if (!entry) {
    logger.warn('Auth nonce not found', {
      stacksAddress,
      noncePrefix: nonce.slice(0, 8),
    });
    return false;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(nonce);
    logger.warn('Auth nonce expired', { stacksAddress });
    return false;
  }
  if (entry.stacksAddress !== stacksAddress) {
    logger.warn('Auth nonce address mismatch', {
      expected: entry.stacksAddress,
      received: stacksAddress,
    });
    return false;
  }
  return true;
}

/**
 * Invalidate (consume) a nonce so it cannot be reused.
 * Must be called after a successful authentication to prevent replay attacks.
 */
export function invalidateNonce(nonce: string): void {
  store.delete(nonce);
  logger.debug('Auth nonce invalidated', { noncePrefix: nonce.slice(0, 8) });
}

/**
 * Return the current number of active (non-expired) nonces.
 * Exposed for testing and diagnostics only.
 */
export function activeNonceCount(): number {
  cleanup();
  return store.size;
}
