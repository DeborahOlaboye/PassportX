// Middleware for validating notification input
// This requires express to be installed

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Validates notification input data before processing
 *
 * This middleware ensures that notification requests contain valid data:
 * - type: A string identifying the notification type
 * - title: A non-empty string for the notification title
 * - message: A non-empty string for the notification message
 * - channels: An array of valid channel types (in_app, email, websocket)
 *
 * @param req - Express Request object containing notification data in req.body
 * @param res - Express Response object for sending validation errors
 * @param next - Express NextFunction to proceed to next middleware if validation passes
 *
 * @example
 * // Usage in Express route
 * router.post('/notifications', validateNotificationInput, createNotificationHandler);
 *
 * @example
 * // Valid request body
 * {
 *   "type": "badge_issued",
 *   "title": "New Badge Earned",
 *   "message": "You have earned a new badge!",
 *   "channels": ["in_app", "email"]
 * }
 *
 * @returns {void} Calls next() if validation passes, or sends 400 error response
 */
/**
 * Sanitizes string input by removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove inline event handlers
}

export function validateNotificationInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { type, title, message, channels } = req.body;

    if (!type || typeof type !== 'string') {
      logger.warn('Notification validation failed: invalid type', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(400).json({
        error: 'Invalid notification type',
        details: 'Type must be a non-empty string',
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      logger.warn('Notification validation failed: missing or empty title', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(400).json({
        error: 'Title is required',
        details: 'Title must be a non-empty string',
      });
      return;
    }

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      logger.warn('Notification validation failed: missing or empty message', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(400).json({
        error: 'Message is required',
        details: 'Message must be a non-empty string',
      });
      return;
    }

    // Sanitize inputs to prevent XSS and injection attacks
    req.body.type = sanitizeString(type);
    req.body.title = sanitizeString(title);
    req.body.message = sanitizeString(message);

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      logger.warn('Notification validation failed: missing or empty channels', {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(400).json({
        error: 'At least one channel is required',
        details: 'Channels must be a non-empty array',
      });
      return;
    }

    const validChannels = ['in_app', 'email', 'websocket'];
    const invalidChannels = channels.filter(
      (channel: string) => !validChannels.includes(channel)
    );

    if (invalidChannels.length > 0) {
      logger.warn('Notification validation failed: invalid channels', {
        invalidChannels,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.status(400).json({
        error: `Invalid channels: ${invalidChannels.join(', ')}`,
        details: `Valid channels are: ${validChannels.join(', ')}`,
      });
      return;
    }

    logger.info('Notification validation passed', {
      type: req.body.type,
      channels: req.body.channels,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.error('Unexpected error in notification validation middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.status(500).json({
      error: 'Internal server error during validation',
      details: 'An unexpected error occurred while validating the notification',
    });
  }
}
