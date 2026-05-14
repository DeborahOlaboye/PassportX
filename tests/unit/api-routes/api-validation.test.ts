import {
  isValidStacksAddressParam,
  isValidObjectId,
  isValidCustomUrl,
  parsePositiveInt,
  isValidTimeRange,
  isAllowedAnalyticsEventName,
  isNonEmptyString,
  validateProfileUpdateBody,
  validateSettingsUpdateBody,
  VALID_TIME_RANGES,
  ALLOWED_ANALYTICS_EVENT_NAMES,
} from '../../../src/lib/api-validation';

describe('isValidStacksAddressParam', () => {
  it('accepts a valid mainnet SP address', () => {
    expect(isValidStacksAddressParam('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(true);
  });

  it('accepts a valid testnet ST address', () => {
    expect(isValidStacksAddressParam('ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(true);
  });

  it('accepts a valid SM address', () => {
    expect(isValidStacksAddressParam('SM2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(true);
  });

  it('accepts a valid SN address', () => {
    expect(isValidStacksAddressParam('SN2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(true);
  });

  it('rejects a plain string', () => {
    expect(isValidStacksAddressParam('not-an-address')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidStacksAddressParam('')).toBe(false);
  });

  it('rejects an address with invalid prefix', () => {
    expect(isValidStacksAddressParam('AB2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(false);
  });

  it('rejects a non-string value', () => {
    expect(isValidStacksAddressParam(12345)).toBe(false);
    expect(isValidStacksAddressParam(null)).toBe(false);
    expect(isValidStacksAddressParam(undefined)).toBe(false);
  });

  it('rejects an address that is too short', () => {
    expect(isValidStacksAddressParam('SP1234')).toBe(false);
  });
});

describe('isValidObjectId', () => {
  it('accepts a valid 24-char hex ObjectId', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('accepts uppercase hex chars', () => {
    expect(isValidObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('rejects a 23-char string', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false);
  });

  it('rejects a 25-char string', () => {
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false);
  });

  it('rejects a string with non-hex chars', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidObjectId('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(undefined)).toBe(false);
    expect(isValidObjectId(507)).toBe(false);
  });
});

describe('isValidCustomUrl', () => {
  it('accepts a simple valid slug', () => {
    expect(isValidCustomUrl('alice')).toBe(true);
  });

  it('accepts slug with hyphens', () => {
    expect(isValidCustomUrl('alice-bob')).toBe(true);
  });

  it('accepts slug with digits', () => {
    expect(isValidCustomUrl('user123')).toBe(true);
  });

  it('accepts slug at exactly 3 characters', () => {
    expect(isValidCustomUrl('abc')).toBe(true);
  });

  it('accepts slug at exactly 30 characters', () => {
    expect(isValidCustomUrl('a' + 'b'.repeat(28) + 'c')).toBe(true);
  });

  it('rejects slug with 2 characters', () => {
    expect(isValidCustomUrl('ab')).toBe(false);
  });

  it('rejects slug with 31 characters', () => {
    expect(isValidCustomUrl('a' + 'b'.repeat(29) + 'c')).toBe(false);
  });

  it('rejects slug with leading hyphen', () => {
    expect(isValidCustomUrl('-alice')).toBe(false);
  });

  it('rejects slug with trailing hyphen', () => {
    expect(isValidCustomUrl('alice-')).toBe(false);
  });

  it('rejects slug with consecutive hyphens', () => {
    expect(isValidCustomUrl('alice--bob')).toBe(false);
  });

  it('rejects slug with uppercase letters', () => {
    expect(isValidCustomUrl('Alice')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidCustomUrl(null)).toBe(false);
    expect(isValidCustomUrl(undefined)).toBe(false);
    expect(isValidCustomUrl(123)).toBe(false);
  });
});

describe('parsePositiveInt', () => {
  it('returns the integer when within bounds', () => {
    expect(parsePositiveInt('5', 1, 100)).toBe(5);
  });

  it('returns the integer at the minimum boundary', () => {
    expect(parsePositiveInt('1', 1, 100)).toBe(1);
  });

  it('returns the integer at the maximum boundary', () => {
    expect(parsePositiveInt('100', 1, 100)).toBe(100);
  });

  it('returns null for a value below minimum', () => {
    expect(parsePositiveInt('0', 1, 100)).toBeNull();
  });

  it('returns null for a value above maximum', () => {
    expect(parsePositiveInt('101', 1, 100)).toBeNull();
  });

  it('returns null for a float', () => {
    expect(parsePositiveInt('1.5', 1, 100)).toBeNull();
  });

  it('returns null for a non-numeric string', () => {
    expect(parsePositiveInt('abc', 1, 100)).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parsePositiveInt(null, 1, 100)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parsePositiveInt(undefined, 1, 100)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePositiveInt('', 1, 100)).toBeNull();
  });

  it('returns null for negative number', () => {
    expect(parsePositiveInt('-5', 1, 100)).toBeNull();
  });
});

describe('isValidTimeRange', () => {
  it.each(VALID_TIME_RANGES)('accepts valid range "%s"', (range) => {
    expect(isValidTimeRange(range)).toBe(true);
  });

  it('rejects an unknown range string', () => {
    expect(isValidTimeRange('1y')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTimeRange('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidTimeRange(null)).toBe(false);
    expect(isValidTimeRange(7)).toBe(false);
  });

  it('is case-sensitive (uppercase rejected)', () => {
    expect(isValidTimeRange('7D')).toBe(false);
  });
});

describe('isAllowedAnalyticsEventName', () => {
  it.each(ALLOWED_ANALYTICS_EVENT_NAMES)(
    'accepts allowed event name "%s"',
    (name) => {
      expect(isAllowedAnalyticsEventName(name)).toBe(true);
    }
  );

  it('rejects an arbitrary event name', () => {
    expect(isAllowedAnalyticsEventName('unknown_event')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isAllowedAnalyticsEventName('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isAllowedAnalyticsEventName(null)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('returns true for a non-empty string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
  });
});

describe('validateProfileUpdateBody', () => {
  it('accepts a valid partial body', () => {
    expect(validateProfileUpdateBody({ name: 'Alice', bio: 'Hello' })).toEqual([]);
  });

  it('accepts an empty object', () => {
    expect(validateProfileUpdateBody({})).toEqual([]);
  });

  it('rejects non-object body', () => {
    expect(validateProfileUpdateBody('string')).toContain(
      'Request body must be a JSON object'
    );
  });

  it('rejects name that is too long', () => {
    const errors = validateProfileUpdateBody({ name: 'a'.repeat(101) });
    expect(errors.some((e) => e.includes('100 characters'))).toBe(true);
  });

  it('rejects empty name', () => {
    const errors = validateProfileUpdateBody({ name: '' });
    expect(errors.some((e) => e.includes('non-empty'))).toBe(true);
  });

  it('rejects bio that is too long', () => {
    const errors = validateProfileUpdateBody({ bio: 'x'.repeat(501) });
    expect(errors.some((e) => e.includes('500 characters'))).toBe(true);
  });

  it('rejects invalid email', () => {
    const errors = validateProfileUpdateBody({ email: 'not-an-email' });
    expect(errors.some((e) => e.includes('email'))).toBe(true);
  });

  it('accepts a valid email', () => {
    expect(validateProfileUpdateBody({ email: 'user@example.com' })).toEqual([]);
  });

  it('rejects invalid customUrl', () => {
    const errors = validateProfileUpdateBody({ customUrl: 'UPPER' });
    expect(errors.some((e) => e.includes('customUrl'))).toBe(true);
  });
});

describe('validateSettingsUpdateBody', () => {
  it('accepts a valid settings object', () => {
    expect(
      validateSettingsUpdateBody({
        emailNotifications: true,
        pushNotifications: false,
        visibility: 'public',
        theme: 'dark',
      })
    ).toEqual([]);
  });

  it('accepts an empty object', () => {
    expect(validateSettingsUpdateBody({})).toEqual([]);
  });

  it('rejects non-object body', () => {
    expect(validateSettingsUpdateBody(null)).toContain(
      'Request body must be a JSON object'
    );
  });

  it('rejects emailNotifications that is not boolean', () => {
    const errors = validateSettingsUpdateBody({ emailNotifications: 'yes' });
    expect(errors.some((e) => e.includes('emailNotifications'))).toBe(true);
  });

  it('rejects invalid visibility value', () => {
    const errors = validateSettingsUpdateBody({ visibility: 'everyone' });
    expect(errors.some((e) => e.includes('visibility'))).toBe(true);
  });

  it('rejects invalid theme value', () => {
    const errors = validateSettingsUpdateBody({ theme: 'blue' });
    expect(errors.some((e) => e.includes('theme'))).toBe(true);
  });

  it('accepts all valid visibility values', () => {
    for (const v of ['public', 'private', 'friends']) {
      expect(validateSettingsUpdateBody({ visibility: v })).toEqual([]);
    }
  });

  it('accepts all valid theme values', () => {
    for (const t of ['light', 'dark', 'system']) {
      expect(validateSettingsUpdateBody({ theme: t })).toEqual([]);
    }
  });
});
