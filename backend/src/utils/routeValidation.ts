import { isValidStacksAddress } from './addressValidation';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/**
 * Parse a query-string value as a bounded integer.
 * Returns the parsed integer, or `defaultValue` if the raw value is missing
 * or not a finite integer within [min, max].
 */
export function parseQueryInt(
  raw: string | undefined,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    return defaultValue;
  }
  return n;
}

/**
 * Parse a query-string value as a bounded integer, returning null when the
 * value is present but invalid so callers can return a 400 response.
 */
export function parseQueryIntStrict(
  raw: string | undefined,
  min: number,
  max: number
): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    return null;
  }
  return n;
}

/**
 * Return true if `value` is a member of the provided allowlist.
 */
export function isValidEnumParam<T extends string>(
  value: unknown,
  allowlist: readonly T[]
): value is T {
  return (
    typeof value === 'string' &&
    (allowlist as readonly string[]).includes(value)
  );
}

/**
 * Return true if `id` is a valid 24-character MongoDB ObjectId hex string.
 */
export function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

/**
 * Return true if `address` is a syntactically valid Stacks principal address.
 */
export function isValidStacksAddressParam(address: unknown): address is string {
  return typeof address === 'string' && isValidStacksAddress(address);
}

/**
 * Return true if `value` is a non-empty string after trimming.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Return true if `value` is a string within the specified length bounds.
 * Both bounds are inclusive.
 */
export function isBoundedString(
  value: unknown,
  minLength: number,
  maxLength: number
): value is string {
  return (
    typeof value === 'string' &&
    value.length >= minLength &&
    value.length <= maxLength
  );
}

/**
 * Sanitize a query string value: trim whitespace and remove ASCII control
 * characters (U+0000–U+001F and U+007F).
 */
export function sanitizeQueryString(value: string): string {
  return value.trim().replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Validate that all required keys are present and non-empty in a request body.
 * Returns an array of field names that are missing or empty; empty array = valid.
 */
export function getMissingFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter(
    (field) => !(field in body) || !isNonEmptyString(body[field])
  );
}
