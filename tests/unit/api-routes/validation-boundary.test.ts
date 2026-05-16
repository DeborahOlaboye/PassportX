/**
 * Boundary and cross-validator integration tests for the api-validation module.
 * Focuses on edge cases at the exact boundaries of each validator.
 */

import {
  parsePositiveInt,
  isValidObjectId,
  isValidCustomUrl,
  isValidTimeRange,
  isAllowedAnalyticsEventName,
  VALID_TIME_RANGES,
  ALLOWED_ANALYTICS_EVENT_NAMES,
} from '../../../src/lib/api-validation';

describe('parsePositiveInt — boundary conditions', () => {
  it('accepts value exactly at min boundary', () => {
    expect(parsePositiveInt('1', 1, 100)).toBe(1);
  });

  it('accepts value exactly at max boundary', () => {
    expect(parsePositiveInt('100', 1, 100)).toBe(100);
  });

  it('rejects value one below min', () => {
    expect(parsePositiveInt('0', 1, 100)).toBeNull();
  });

  it('rejects value one above max', () => {
    expect(parsePositiveInt('101', 1, 100)).toBeNull();
  });

  it('rejects floating-point value within range', () => {
    expect(parsePositiveInt('1.5', 1, 100)).toBeNull();
  });

  it('rejects negative zero string', () => {
    expect(parsePositiveInt('-0', 1, 100)).toBeNull();
  });

  it('rejects string with leading zeros that parse to out-of-range', () => {
    expect(parsePositiveInt('00', 1, 100)).toBeNull();
  });

  it('accepts string with leading whitespace if value is in range', () => {
    expect(parsePositiveInt(' 5 ', 1, 100)).toBe(5);
  });
});

describe('isValidObjectId — boundary conditions', () => {
  it('accepts exactly 24 hex characters', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('rejects 23 hex characters', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false);
  });

  it('rejects 25 hex characters', () => {
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false);
  });

  it('rejects 24 characters with a non-hex character', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false);
  });

  it('accepts uppercase hex digits', () => {
    expect(isValidObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });
});

describe('isValidCustomUrl — boundary conditions', () => {
  it('accepts slug of exactly 3 characters', () => {
    expect(isValidCustomUrl('abc')).toBe(true);
  });

  it('rejects slug of 2 characters', () => {
    expect(isValidCustomUrl('ab')).toBe(false);
  });

  it('accepts slug of exactly 30 characters', () => {
    expect(isValidCustomUrl('a'.repeat(28) + 'bc')).toBe(true);
  });

  it('rejects slug of 31 characters', () => {
    expect(isValidCustomUrl('a'.repeat(29) + 'bc')).toBe(false);
  });

  it('rejects slug with consecutive hyphens', () => {
    expect(isValidCustomUrl('ab--cd')).toBe(false);
  });

  it('rejects slug starting with hyphen', () => {
    expect(isValidCustomUrl('-abcde')).toBe(false);
  });

  it('rejects slug ending with hyphen', () => {
    expect(isValidCustomUrl('abcde-')).toBe(false);
  });

  it('accepts slug with single hyphen', () => {
    expect(isValidCustomUrl('my-profile')).toBe(true);
  });
});

describe('isValidTimeRange — exhaustive coverage', () => {
  it('accepts all values in VALID_TIME_RANGES', () => {
    for (const range of VALID_TIME_RANGES) {
      expect(isValidTimeRange(range)).toBe(true);
    }
  });

  it('rejects values similar to valid ranges', () => {
    expect(isValidTimeRange('7D')).toBe(false);
    expect(isValidTimeRange('24H')).toBe(false);
    expect(isValidTimeRange('all ')).toBe(false);
    expect(isValidTimeRange('')).toBe(false);
  });
});

describe('isAllowedAnalyticsEventName — exhaustive coverage', () => {
  it('accepts all values in ALLOWED_ANALYTICS_EVENT_NAMES', () => {
    for (const name of ALLOWED_ANALYTICS_EVENT_NAMES) {
      expect(isAllowedAnalyticsEventName(name)).toBe(true);
    }
  });

  it('rejects values not in the allowlist', () => {
    expect(isAllowedAnalyticsEventName('unknown_event')).toBe(false);
    expect(isAllowedAnalyticsEventName('BADGE_MINTED')).toBe(false);
    expect(isAllowedAnalyticsEventName('')).toBe(false);
    expect(isAllowedAnalyticsEventName(null)).toBe(false);
  });
});
