import {
  parseQueryInt,
  parseQueryIntStrict,
  isValidEnumParam,
  isValidObjectId,
  isValidStacksAddressParam,
  isNonEmptyString,
  isBoundedString,
  sanitizeQueryString,
  getMissingFields,
} from '../../utils/routeValidation';

describe('parseQueryInt', () => {
  it('returns the parsed integer within bounds', () => {
    expect(parseQueryInt('25', 1, 100, 10)).toBe(25);
  });

  it('returns defaultValue when value is below min', () => {
    expect(parseQueryInt('0', 1, 100, 10)).toBe(10);
  });

  it('returns defaultValue when value is above max', () => {
    expect(parseQueryInt('101', 1, 100, 10)).toBe(10);
  });

  it('returns defaultValue for non-numeric input', () => {
    expect(parseQueryInt('abc', 1, 100, 10)).toBe(10);
  });

  it('returns defaultValue for undefined input', () => {
    expect(parseQueryInt(undefined, 1, 100, 10)).toBe(10);
  });

  it('returns defaultValue for empty string', () => {
    expect(parseQueryInt('', 1, 100, 10)).toBe(10);
  });

  it('accepts value exactly at min boundary', () => {
    expect(parseQueryInt('1', 1, 100, 10)).toBe(1);
  });

  it('accepts value exactly at max boundary', () => {
    expect(parseQueryInt('100', 1, 100, 10)).toBe(100);
  });

  it('returns defaultValue for float input', () => {
    expect(parseQueryInt('1.5', 1, 100, 10)).toBe(10);
  });

  it('parses whitespace-padded integer', () => {
    expect(parseQueryInt(' 5 ', 1, 100, 10)).toBe(5);
  });
});

describe('parseQueryIntStrict', () => {
  it('returns parsed integer for valid input', () => {
    expect(parseQueryIntStrict('50', 1, 100)).toBe(50);
  });

  it('returns null for value below min', () => {
    expect(parseQueryIntStrict('0', 1, 100)).toBeNull();
  });

  it('returns null for value above max', () => {
    expect(parseQueryIntStrict('101', 1, 100)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseQueryIntStrict(undefined, 1, 100)).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(parseQueryIntStrict('abc', 1, 100)).toBeNull();
  });
});

describe('isValidEnumParam', () => {
  const COLORS = ['red', 'green', 'blue'] as const;

  it('accepts a valid enum value', () => {
    expect(isValidEnumParam('red', COLORS)).toBe(true);
  });

  it('rejects a value not in the allowlist', () => {
    expect(isValidEnumParam('yellow', COLORS)).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidEnumParam(null, COLORS)).toBe(false);
  });

  it('rejects a number', () => {
    expect(isValidEnumParam(0, COLORS)).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isValidEnumParam('Red', COLORS)).toBe(false);
  });
});

describe('isValidObjectId', () => {
  it('accepts a valid 24-char hex string', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('rejects a 23-char hex string', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false);
  });

  it('rejects a 25-char hex string', () => {
    expect(isValidObjectId('507f1f77bcf86cd7994390111')).toBe(false);
  });

  it('rejects a string with non-hex characters', () => {
    expect(isValidObjectId('507f1f77bcf86cd79943901g')).toBe(false);
  });

  it('accepts uppercase hex', () => {
    expect(isValidObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('rejects non-string input', () => {
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(undefined)).toBe(false);
  });
});

describe('isValidStacksAddressParam', () => {
  it('accepts a valid SP mainnet address', () => {
    expect(
      isValidStacksAddressParam('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')
    ).toBe(true);
  });

  it('rejects an address with wrong prefix', () => {
    expect(
      isValidStacksAddressParam('XP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')
    ).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidStacksAddressParam('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidStacksAddressParam(null)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('returns true for a regular string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns false for number', () => {
    expect(isNonEmptyString(42)).toBe(false);
  });
});

describe('isBoundedString', () => {
  it('accepts string within bounds', () => {
    expect(isBoundedString('hello', 1, 10)).toBe(true);
  });

  it('accepts string at min length', () => {
    expect(isBoundedString('a', 1, 10)).toBe(true);
  });

  it('accepts string at max length', () => {
    expect(isBoundedString('a'.repeat(10), 1, 10)).toBe(true);
  });

  it('rejects string shorter than min', () => {
    expect(isBoundedString('', 1, 10)).toBe(false);
  });

  it('rejects string longer than max', () => {
    expect(isBoundedString('a'.repeat(11), 1, 10)).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isBoundedString(null, 1, 10)).toBe(false);
  });
});

describe('sanitizeQueryString', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeQueryString('  hello  ')).toBe('hello');
  });

  it('removes null bytes', () => {
    expect(sanitizeQueryString('hel\x00lo')).toBe('hello');
  });

  it('removes newline characters', () => {
    expect(sanitizeQueryString('hel\nlo')).toBe('hello');
  });

  it('removes tab characters', () => {
    expect(sanitizeQueryString('hel\tlo')).toBe('hello');
  });

  it('preserves normal alphanumeric input', () => {
    expect(sanitizeQueryString('badge-search-query')).toBe(
      'badge-search-query'
    );
  });
});

describe('getMissingFields', () => {
  it('returns empty array when all required fields are present', () => {
    expect(getMissingFields({ name: 'Alice', age: '30' }, ['name'])).toEqual(
      []
    );
  });

  it('returns missing field names', () => {
    expect(getMissingFields({ name: 'Alice' }, ['name', 'email'])).toEqual([
      'email',
    ]);
  });

  it('reports fields present but empty', () => {
    expect(getMissingFields({ name: '' }, ['name'])).toEqual(['name']);
  });

  it('reports fields present but whitespace-only', () => {
    expect(getMissingFields({ name: '   ' }, ['name'])).toEqual(['name']);
  });

  it('returns empty array for no required fields', () => {
    expect(getMissingFields({}, [])).toEqual([]);
  });
});
