/**
 * Notification Validation Constants
 *
 * This file contains constants for validating notification types and channels
 * to ensure consistency across the application.
 */

/**
 * Valid notification types
 * These are the allowed values for the 'type' field in notification requests
 */
export const VALID_NOTIFICATION_TYPES = [
  'badge_issued',
  'badge_revoked',
  'community_joined',
  'community_created',
  'community_invite',
  'system',
  'announcement',
] as const;

/**
 * Type guard for valid notification types
 */
export function isValidNotificationType(
  type: string
): type is (typeof VALID_NOTIFICATION_TYPES)[number] {
  return VALID_NOTIFICATION_TYPES.includes(type as any);
}

/**
 * Valid notification channels
 * These are the allowed values for the 'channels' array in notification requests
 */
export const VALID_NOTIFICATION_CHANNELS = [
  'in_app',
  'email',
  'websocket',
] as const;

/**
 * Type guard for valid notification channels
 */
export function isValidNotificationChannel(
  channel: string
): channel is (typeof VALID_NOTIFICATION_CHANNELS)[number] {
  return VALID_NOTIFICATION_CHANNELS.includes(channel as any);
}

/**
 * Maximum lengths for notification fields
 */
export const NOTIFICATION_FIELD_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  MESSAGE_MAX_LENGTH: 5000,
  TYPE_MAX_LENGTH: 50,
  MAX_CHANNELS: 3,
} as const;

/**
 * Shape of a validation error response body returned by the notification middleware.
 */
export type NotificationValidationError = {
  error: string;
  details: string;
};

/**
 * Validation error messages
 */
export const VALIDATION_ERROR_MESSAGES = {
  INVALID_TYPE: 'Invalid notification type',
  INVALID_CHANNEL: 'Invalid notification channel',
  TITLE_REQUIRED: 'Title is required',
  MESSAGE_REQUIRED: 'Message is required',
  CHANNELS_REQUIRED: 'At least one channel is required',
  TITLE_TOO_LONG: `Title must not exceed ${NOTIFICATION_FIELD_LIMITS.TITLE_MAX_LENGTH} characters`,
  MESSAGE_TOO_LONG: `Message must not exceed ${NOTIFICATION_FIELD_LIMITS.MESSAGE_MAX_LENGTH} characters`,
  TOO_MANY_CHANNELS: `Cannot specify more than ${NOTIFICATION_FIELD_LIMITS.MAX_CHANNELS} channels`,
} as const;
