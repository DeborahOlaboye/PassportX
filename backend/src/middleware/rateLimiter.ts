import rateLimit, { Options } from 'express-rate-limit';
import { RateLimitConfig } from '../config/rateLimits';

/**
 * Creates an express-rate-limit middleware instance from a RateLimitConfig.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const options: Partial<Options> = {
    windowMs: config.windowMs,
    max: config.max,
    message: { error: config.message },
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
  };

  return rateLimit(options);
}
