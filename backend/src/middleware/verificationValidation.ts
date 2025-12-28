import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

/**
 * Validate badge ID format
 */
export function validateBadgeId(req: Request, res: Response, next: NextFunction) {
  const badgeId = req.params.badgeId || req.body.badgeId

  if (!badgeId) {
    return res.status(400).json({
      success: false,
      error: 'Badge ID is required'
    })
  }

  if (!mongoose.Types.ObjectId.isValid(badgeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid badge ID format'
    })
  }

  next()
}

/**
 * Validate Stacks address format
 */
export function validateStacksAddress(req: Request, res: Response, next: NextFunction) {
  const address = req.params.address || req.body.claimedOwner

  if (!address) {
    return next()
  }

  // Basic Stacks address validation (starts with SP or SM, followed by alphanumeric)
  const stacksAddressPattern = /^S[PM][0-9A-Z]{38,40}$/

  if (!stacksAddressPattern.test(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Stacks address format'
    })
  }

  next()
}

/**
 * Validate batch verification request
 */
export function validateBatchRequest(req: Request, res: Response, next: NextFunction) {
  const { badgeIds } = req.body

  if (!Array.isArray(badgeIds)) {
    return res.status(400).json({
      success: false,
      error: 'Badge IDs must be an array'
    })
  }

  if (badgeIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one badge ID is required'
    })
  }

  if (badgeIds.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 50 badges can be verified at once'
    })
  }

  // Validate each badge ID
  for (const badgeId of badgeIds) {
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid badge ID format: ${badgeId}`
      })
    }
  }

  next()
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
  console.error('Verification error:', error)

  // Handle specific error types
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message
    })
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error during verification'
  })
}

/**
 * Rate limiting for verification endpoints
 */
export function verificationRateLimit(req: Request, res: Response, next: NextFunction) {
  // This is a placeholder - you should use a proper rate limiting library
  // like express-rate-limit with Redis for production
  next()
}

/**
 * Sanitize verification response
 */
export function sanitizeVerificationResponse(verification: any) {
  // Remove sensitive internal fields
  const sanitized = { ...verification }
  delete sanitized.__v
  delete sanitized._id

  return sanitized
}

/**
 * Validate verification request payload
 */
export function validateVerificationPayload(req: Request, res: Response, next: NextFunction) {
  const { badgeId, claimedOwner } = req.body

  if (!badgeId) {
    return res.status(400).json({
      success: false,
      error: 'Badge ID is required'
    })
  }

  if (!mongoose.Types.ObjectId.isValid(badgeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid badge ID format'
    })
  }

  if (claimedOwner && typeof claimedOwner !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Claimed owner must be a string'
    })
  }

  next()
}
