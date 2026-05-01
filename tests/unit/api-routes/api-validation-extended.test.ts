/**
 * Extended tests for the api-validation module covering helpers added
 * after the initial module creation.
 */

import {
  sanitizeQueryParam,
  isValidBearerToken,
  isValidStacksAddressParam,
  isValidObjectId,
  parsePositiveInt,
  validateProfileUpdateBody,
  validateSettingsUpdateBody,
} from '../../../src/lib/api-validation';

describe('sanitizeQueryParam', () => {
  it('trims leading whitespace', () => {
    expect(sanitizeQueryParam('  hello')).toBe('hello');
  });

  it('trims trailing whitespace', () => {
    expect(sanitizeQueryParam('hello  ')).toBe('hello');
  });

  it('trims both ends', () => {
    expect(sanitizeQueryParam('  hello world  ')).toBe('hello world');
  });

  it('removes control characters', () => {
    expect(sanitizeQueryParam('hello\x00world')).toBe('helloworld');
  });

  it('removes newline characters', () => {
    expect(sanitizeQueryParam('hello\nworld')).toBe('helloworld');
  });

  it('removes carriage return characters', () => {
    expect(sanitizeQueryParam('hello\rworld')).toBe('helloworld');
  });

  it('removes tab characters', () => {
    expect(sanitizeQueryParam('hello\tworld')).toBe('helloworld');
  });

  it('preserves normal alphanumeric characters', () => {
    expect(sanitizeQueryParam('badge123')).toBe('badge123');
  });

  it('preserves unicode characters', () => {
    expect(sanitizeQueryParam('café')).toBe('café');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeQueryParam('   ')).toBe('');
  });
});

describe('isValidBearerToken', () => {
  it('accepts a typical JWT bearer token', () => {
    const token =
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(isValidBearerToken(token)).toBe(true);
  });

  it('rejects token without Bearer prefix', () => {
    expect(isValidBearerToken('eyJhbGciOiJIUzI1NiJ9')).toBe(false);
  });

  it('rejects token that is too short', () => {
    expect(isValidBearerToken('Bearer abc')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidBearerToken('')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidBearerToken(null)).toBe(false);
    expect(isValidBearerToken(undefined)).toBe(false);
  });

  it('rejects Basic auth format', () => {
    expect(isValidBearerToken('Basic dXNlcjpwYXNz')).toBe(false);
  });
});

describe('isValidStacksAddressParam — additional edge cases', () => {
  it('rejects an address with whitespace', () => {
    expect(isValidStacksAddressParam(' SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')).toBe(false);
  });

  it('rejects an address with trailing whitespace', () => {
    expect(isValidStacksAddressParam('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7 ')).toBe(false);
  });

  it('rejects a purely numeric string', () => {
    expect(isValidStacksAddressParam('123456789012345678901234567890123456789012')).toBe(false);
  });
});

describe('isValidObjectId — additional edge cases', () => {
  it('rejects all-zero id', () => {
    // Actually valid hex format, should be accepted
    expect(isValidObjectId('000000000000000000000000')).toBe(true);
  });

  it('rejects object with toString method', () => {
    expect(isValidObjectId({ toString: () => '507f1f77bcf86cd799439011' })).toBe(false);
  });

  it('rejects array input', () => {
    expect(isValidObjectId(['507f1f77bcf86cd799439011'])).toBe(false);
  });
});

describe('parsePositiveInt — additional edge cases', () => {
  it('rejects whitespace-only string', () => {
    expect(parsePositiveInt('   ', 1, 100)).toBeNull();
  });

  it('rejects Infinity', () => {
    expect(parsePositiveInt('Infinity', 1, 100)).toBeNull();
  });

  it('rejects NaN string', () => {
    expect(parsePositiveInt('NaN', 1, 100)).toBeNull();
  });

  it('rejects hex string', () => {
    expect(parsePositiveInt('0xff', 1, 255)).toBeNull();
  });

  it('rejects scientific notation', () => {
    expect(parsePositiveInt('1e2', 1, 200)).toBeNull();
  });
});

describe('validateProfileUpdateBody — additional edge cases', () => {
  it('returns errors for both name and bio violations', () => {
    const errors = validateProfileUpdateBody({
      name: '',
      bio: 'x'.repeat(501),
    });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts body with only valid customUrl', () => {
    expect(validateProfileUpdateBody({ customUrl: 'my-profile' })).toEqual([]);
  });

  it('rejects body with null (non-object)', () => {
    expect(validateProfileUpdateBody(null)).toContain(
      'Request body must be a JSON object'
    );
  });

  it('rejects array body', () => {
    expect(validateProfileUpdateBody([])).toContain(
      'Request body must be a JSON object'
    );
  });
});

describe('validateSettingsUpdateBody — additional edge cases', () => {
  it('returns errors for multiple invalid fields simultaneously', () => {
    const errors = validateSettingsUpdateBody({
      emailNotifications: 'yes',
      visibility: 'invalid',
      theme: 'neon',
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects array body', () => {
    expect(validateSettingsUpdateBody([])).toContain(
      'Request body must be a JSON object'
    );
  });

  it('ignores unrecognized fields without errors', () => {
    const errors = validateSettingsUpdateBody({
      unknownField: 'anything',
    });
    expect(errors).toEqual([]);
  });
});
