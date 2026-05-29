import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

/**
 * Validate badge ID format
 */
export function validateBadgeId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const badgeId = req.params.badgeId || req.body.badgeId;

  if (!badgeId) {
    return res.status(400).json({
      success: false,
      error: 'Badge ID is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(badgeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid badge ID format',
    });
  }

  next();
}

/**
 * Validate Stacks address format
 */
export function validateStacksAddress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const address = req.params.address || req.body.claimedOwner;

  if (!address) {
    return next();
  }

  // Stacks address prefixes: SP/SM (mainnet standard/contract), ST/SN (testnet)
  const stacksAddressPattern = /^S[PMTN][0-9A-Z]{38,40}$/;

  if (!stacksAddressPattern.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Stacks address format',
    });
  }

  next();
}

/**
 * Validate batch verification request
 */
export function validateBatchRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { badgeIds } = req.body;

  if (!Array.isArray(badgeIds)) {
    return res.status(400).json({
      success: false,
      error: 'Badge IDs must be an array',
    });
  }

  if (badgeIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one badge ID is required',
    });
  }

  if (badgeIds.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 50 badges can be verified at once',
    });
  }

  // Validate each badge ID
  for (const badgeId of badgeIds) {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid badge ID format: ${badgeId}`,
      });
    }
  }

  next();
}

/**
 * Handle verification errors
 */
export function handleVerificationError(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Verification error', { error });

  // Handle specific error types
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error during verification',
  });
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 50;

/**
 * Rate limiter for verification endpoints.
 * Allows 50 requests per 15-minute window per IP.
 */
export function verificationRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many verification requests. Please try again later.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
  }

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000).unref();

/**
 * Sanitize verification response
 */
export function sanitizeVerificationResponse(verification: any) {
  // Remove sensitive internal fields
  const sanitized = { ...verification };
  delete sanitized.__v;
  delete sanitized._id;

  return sanitized;
}

/**
 * Validate verification request payload
 */
export function validateVerificationPayload(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { badgeId, claimedOwner } = req.body;

  if (!badgeId) {
    return res.status(400).json({
      success: false,
      error: 'Badge ID is required',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(badgeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid badge ID format',
    });
  }

  if (claimedOwner && typeof claimedOwner !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Claimed owner must be a string',
    });
  }

  next();
}
