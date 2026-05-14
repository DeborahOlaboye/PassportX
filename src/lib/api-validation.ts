import { isValidStacksAddress } from '@/utils/addressValidation';

// Valid time range values accepted by the analytics route
export const VALID_TIME_RANGES = ['24h', '7d', '30d', '90d', 'all'] as const;
export type TimeRange = (typeof VALID_TIME_RANGES)[number];

// Allowed analytics event names
export const ALLOWED_ANALYTICS_EVENT_NAMES = [
  'wallet_connected',
  'wallet_disconnected',
  'transaction_completed',
  'transaction_failed',
  'badge_minted',
  'badge_viewed',
  'badge_shared',
  'passport_viewed',
  'passport_initialized',
  'community_joined',
  'community_created',
  'profile_updated',
  'session_started',
  'session_ended',
  'page_view',
] as const;
export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENT_NAMES)[number];

// MongoDB ObjectId: 24 hexadecimal characters
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

// Custom URL slug: 3–30 chars, lowercase letters, digits, hyphens only
const CUSTOM_URL_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/**
 * Return true if `address` is a syntactically valid Stacks principal address.
 * Delegates to the project-wide addressValidation utility.
 */
export function isValidStacksAddressParam(address: unknown): address is string {
  return typeof address === 'string' && isValidStacksAddress(address);
}

/**
 * Return true if `id` is a valid MongoDB ObjectId (24-char hex string).
 */
export function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

/**
 * Return true if `slug` is a valid custom profile URL slug.
 * Rules: 3–30 characters, lowercase letters/digits/hyphens, no leading or
 * trailing hyphens, no consecutive hyphens.
 */
export function isValidCustomUrl(slug: unknown): slug is string {
  if (typeof slug !== 'string') return false;
  if (!CUSTOM_URL_REGEX.test(slug)) return false;
  return !slug.includes('--');
}

/**
 * Parse a query-string value as a bounded positive integer.
 * Returns the clamped integer, or `null` if the value is missing / not a
 * finite positive integer.
 *
 * @param raw   The raw query-string value (string | null | undefined).
 * @param min   Inclusive lower bound (must be ≥ 1).
 * @param max   Inclusive upper bound.
 */
export function parsePositiveInt(
  raw: string | null | undefined,
  min: number,
  max: number
): number | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    return null;
  }
  return n;
}

/**
 * Return true if `range` is one of the accepted analytics time range strings.
 */
export function isValidTimeRange(range: unknown): range is TimeRange {
  return (
    typeof range === 'string' &&
    (VALID_TIME_RANGES as readonly string[]).includes(range)
  );
}

/**
 * Return true if `name` is an allowed analytics event name.
 */
export function isAllowedAnalyticsEventName(
  name: unknown
): name is AnalyticsEventName {
  return (
    typeof name === 'string' &&
    (ALLOWED_ANALYTICS_EVENT_NAMES as readonly string[]).includes(name)
  );
}

/**
 * Return true if `value` is a non-empty string after trimming.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitize a query string value for use in backend requests.
 * Trims whitespace and removes control characters.
 */
export function sanitizeQueryParam(value: string): string {
  return value.trim().replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Return true if `token` looks like a plausible Bearer token format.
 * Accepts: "Bearer <base64url-chars>" where the token part is ≥ 10 chars.
 */
export function isValidBearerToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^Bearer [A-Za-z0-9\-._~+/]+=*$/.test(value) &&
    value.length > 16
  );
}

/**
 * Validate a profile update body.  Returns an array of field-level error
 * messages; an empty array means the body is valid.
 *
 * All fields are optional — only present fields are checked for type/length.
 */
export function validateProfileUpdateBody(body: unknown): string[] {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null) {
    return ['Request body must be a JSON object'];
  }
  const b = body as Record<string, unknown>;

  if ('name' in b) {
    if (typeof b.name !== 'string' || b.name.trim().length === 0) {
      errors.push('name must be a non-empty string');
    } else if (b.name.length > 100) {
      errors.push('name must be at most 100 characters');
    }
  }

  if ('bio' in b) {
    if (typeof b.bio !== 'string') {
      errors.push('bio must be a string');
    } else if (b.bio.length > 500) {
      errors.push('bio must be at most 500 characters');
    }
  }

  if ('email' in b) {
    if (
      typeof b.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)
    ) {
      errors.push('email must be a valid email address');
    }
  }

  if ('customUrl' in b) {
    if (!isValidCustomUrl(b.customUrl)) {
      errors.push(
        'customUrl must be 3–30 chars, lowercase letters/digits/hyphens, no leading/trailing/consecutive hyphens'
      );
    }
  }

  return errors;
}

/**
 * Return true if `value` is a syntactically valid ISO 8601 timestamp string
 * that can be parsed to a finite date.
 */
export function isValidISOTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const d = Date.parse(value);
  return Number.isFinite(d);
}

/**
 * Return true if `value` is a valid CSS hex color string (#RGB or #RRGGBB).
 */
export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/**
 * Return true if `value` is a plausible http/https URL.
 * Uses the URL constructor for parsing — does not perform network I/O.
 */
export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Return true if `value` is an array of non-empty strings within length bounds.
 *
 * @param value     The value to check.
 * @param maxItems  Maximum number of items allowed (default 20).
 * @param maxLength Maximum character length per tag (default 50).
 */
export function isValidTagsList(
  value: unknown,
  maxItems = 20,
  maxLength = 50
): value is string[] {
  if (!Array.isArray(value)) return false;
  if (value.length > maxItems) return false;
  return value.every(
    (tag) => typeof tag === 'string' && tag.trim().length > 0 && tag.length <= maxLength
  );
}

/**
 * Validate a settings update body.  Returns an array of error messages.
 */
export function validateSettingsUpdateBody(body: unknown): string[] {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null) {
    return ['Request body must be a JSON object'];
  }
  const b = body as Record<string, unknown>;

  if ('emailNotifications' in b && typeof b.emailNotifications !== 'boolean') {
    errors.push('emailNotifications must be a boolean');
  }

  if ('pushNotifications' in b && typeof b.pushNotifications !== 'boolean') {
    errors.push('pushNotifications must be a boolean');
  }

  if ('visibility' in b) {
    const allowed = ['public', 'private', 'friends'];
    if (!allowed.includes(b.visibility as string)) {
      errors.push(`visibility must be one of: ${allowed.join(', ')}`);
    }
  }

  if ('theme' in b) {
    const allowed = ['light', 'dark', 'system'];
    if (!allowed.includes(b.theme as string)) {
      errors.push(`theme must be one of: ${allowed.join(', ')}`);
    }
  }

  return errors;
}
