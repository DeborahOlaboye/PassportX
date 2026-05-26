// Middleware for validating notification input

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import {
  isValidNotificationType,
  isValidNotificationChannel,
  VALID_NOTIFICATION_TYPES,
  VALID_NOTIFICATION_CHANNELS,
  NOTIFICATION_FIELD_LIMITS,
  VALIDATION_ERROR_MESSAGES,
} from '../config/notificationValidation';

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
 *
 * @security
 * - Strips HTML angle brackets, javascript:, data:, and vbscript: URI schemes (XSS)
 * - Removes SQL keywords and comment tokens (SQL injection)
 * - Removes MongoDB operator prefixes such as $where and $ne (NoSQL injection)
 * - Normalizes Unicode to NFC before any pattern matching
 */

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/)/g,
];

const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne\b/gi,
  /\$gt\b/gi,
  /\$lt\b/gi,
  /\$regex/gi,
  /\$or\b/gi,
  /\$and\b/gi,
];

type ValidationErrorResponse = {
  error: string;
  details: string;
};

let validationFailureCount = 0;

export function getValidationFailureCount(): number {
  return validationFailureCount;
}

export function resetValidationFailureCount(): void {
  validationFailureCount = 0;
}

function sanitizeString(input: string): string {
  let sanitized = input
    .normalize('NFC')
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  for (const pattern of SQL_INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '');
  }

  for (const pattern of NOSQL_INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

/** Validates that the notification type is present and a recognized enum value. */
function validateTypeField(type: unknown): ValidationErrorResponse | null {
  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    return {
      error: VALIDATION_ERROR_MESSAGES.INVALID_TYPE,
      details: 'Type must be a non-empty string',
    };
  }
  if (type.length > NOTIFICATION_FIELD_LIMITS.TYPE_MAX_LENGTH) {
    return {
      error: VALIDATION_ERROR_MESSAGES.INVALID_TYPE,
      details: `Type must not exceed ${NOTIFICATION_FIELD_LIMITS.TYPE_MAX_LENGTH} characters`,
    };
  }
  if (!isValidNotificationType(type)) {
    return {
      error: VALIDATION_ERROR_MESSAGES.INVALID_TYPE,
      details: `Type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}`,
    };
  }
  return null;
}

/** Validates that the title is present and within the allowed length. */
function validateTitleField(title: unknown): ValidationErrorResponse | null {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return {
      error: VALIDATION_ERROR_MESSAGES.TITLE_REQUIRED,
      details: 'Title must be a non-empty string',
    };
  }
  if (title.trim().length > NOTIFICATION_FIELD_LIMITS.TITLE_MAX_LENGTH) {
    return {
      error: VALIDATION_ERROR_MESSAGES.TITLE_TOO_LONG,
      details: VALIDATION_ERROR_MESSAGES.TITLE_TOO_LONG,
    };
  }
  return null;
}

/** Validates that the message is present and within the allowed length. */
function validateMessageField(
  message: unknown
): ValidationErrorResponse | null {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return {
      error: VALIDATION_ERROR_MESSAGES.MESSAGE_REQUIRED,
      details: 'Message must be a non-empty string',
    };
  }
  if (message.trim().length > NOTIFICATION_FIELD_LIMITS.MESSAGE_MAX_LENGTH) {
    return {
      error: VALIDATION_ERROR_MESSAGES.MESSAGE_TOO_LONG,
      details: VALIDATION_ERROR_MESSAGES.MESSAGE_TOO_LONG,
    };
  }
  return null;
}

/** Validates that channels is a non-empty array of known channel values within the count limit. */
function validateChannelsField(
  channels: unknown
): ValidationErrorResponse | null {
  if (!channels || !Array.isArray(channels) || channels.length === 0) {
    return {
      error: VALIDATION_ERROR_MESSAGES.CHANNELS_REQUIRED,
      details: 'Channels must be a non-empty array',
    };
  }
  if (channels.length > NOTIFICATION_FIELD_LIMITS.MAX_CHANNELS) {
    return {
      error: VALIDATION_ERROR_MESSAGES.TOO_MANY_CHANNELS,
      details: VALIDATION_ERROR_MESSAGES.TOO_MANY_CHANNELS,
    };
  }
  const invalidChannels = (channels as string[]).filter(
    (channel: string) => !isValidNotificationChannel(channel)
  );
  if (invalidChannels.length > 0) {
    return {
      error: VALIDATION_ERROR_MESSAGES.INVALID_CHANNEL,
      details: `Invalid channels: ${invalidChannels.join(
        ', '
      )}. Valid channels are: ${VALID_NOTIFICATION_CHANNELS.join(', ')}`,
    };
  }
  return null;
}

export function validateNotificationInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  try {
    const { type, title, message, channels } = req.body;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const logContext = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId,
    };

    const typeError = validateTypeField(type);
    if (typeError) {
      validationFailureCount++;
      logger.warn('Notification validation failed: invalid type', logContext);
      res.status(400).json(typeError);
      return;
    }

    const titleError = validateTitleField(title);
    if (titleError) {
      validationFailureCount++;
      logger.warn('Notification validation failed: invalid title', logContext);
      res.status(400).json(titleError);
      return;
    }

    const messageError = validateMessageField(message);
    if (messageError) {
      validationFailureCount++;
      logger.warn(
        'Notification validation failed: invalid message',
        logContext
      );
      res.status(400).json(messageError);
      return;
    }

    req.body.type = sanitizeString(type);
    req.body.title = sanitizeString(title);
    req.body.message = sanitizeString(message);

    const channelsError = validateChannelsField(channels);
    if (channelsError) {
      validationFailureCount++;
      logger.warn(
        'Notification validation failed: invalid channels',
        logContext
      );
      res.status(400).json(channelsError);
      return;
    }

    const durationMs = Date.now() - startTime;
    logger.info('Notification validation passed', {
      type: req.body.type,
      channels: req.body.channels,
      ip: req.ip,
      requestId,
      durationMs,
    });

    next();
  } catch (error) {
    logger.error('Unexpected error in notification validation middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.headers['x-request-id'],
    });
    res.status(500).json({
      error: 'Internal server error during validation',
      details: 'An unexpected error occurred while validating the notification',
    });
  }
}
