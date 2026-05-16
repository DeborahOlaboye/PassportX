/**
 * Tests for new helpers added to api-validation:
 *   isValidISOTimestamp, isValidHexColor, isValidHttpUrl, isValidTagsList
 */

import {
  isValidISOTimestamp,
  isValidHexColor,
  isValidHttpUrl,
  isValidTagsList,
} from '../../../src/lib/api-validation';

describe('isValidISOTimestamp', () => {
  it('accepts a valid ISO date string', () => {
    expect(isValidISOTimestamp('2024-01-15T10:30:00.000Z')).toBe(true);
  });

  it('accepts a date-only string', () => {
    expect(isValidISOTimestamp('2024-01-15')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidISOTimestamp('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidISOTimestamp('   ')).toBe(false);
  });

  it('rejects a non-date string', () => {
    expect(isValidISOTimestamp('not-a-date')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidISOTimestamp(null)).toBe(false);
  });

  it('rejects a number', () => {
    expect(isValidISOTimestamp(1700000000000)).toBe(false);
  });

  it('accepts an RFC 2822 date string', () => {
    expect(isValidISOTimestamp('Mon, 15 Jan 2024 10:30:00 GMT')).toBe(true);
  });
});

describe('isValidHexColor', () => {
  it('accepts 6-digit hex color', () => {
    expect(isValidHexColor('#ff0000')).toBe(true);
  });

  it('accepts 3-digit hex color', () => {
    expect(isValidHexColor('#f00')).toBe(true);
  });

  it('accepts uppercase hex', () => {
    expect(isValidHexColor('#FF0000')).toBe(true);
  });

  it('accepts mixed case hex', () => {
    expect(isValidHexColor('#aB12Cd')).toBe(true);
  });

  it('rejects color without hash', () => {
    expect(isValidHexColor('ff0000')).toBe(false);
  });

  it('rejects named colors', () => {
    expect(isValidHexColor('red')).toBe(false);
  });

  it('rejects 4-digit hex', () => {
    expect(isValidHexColor('#ff00')).toBe(false);
  });

  it('rejects 8-digit hex', () => {
    expect(isValidHexColor('#ff000000')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidHexColor('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(0xff0000)).toBe(false);
  });
});

describe('isValidHttpUrl', () => {
  it('accepts http URL', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
  });

  it('accepts https URL', () => {
    expect(isValidHttpUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('rejects ftp URL', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
  });

  it('rejects string without protocol', () => {
    expect(isValidHttpUrl('example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidHttpUrl('')).toBe(false);
  });

  it('rejects non-string', () => {
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(123)).toBe(false);
  });

  it('rejects javascript: URL', () => {
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('accepts URL with port', () => {
    expect(isValidHttpUrl('https://example.com:8080/api')).toBe(true);
  });
});

describe('isValidTagsList', () => {
  it('accepts a simple list of tags', () => {
    expect(isValidTagsList(['skill', 'beginner', 'web3'])).toBe(true);
  });

  it('accepts empty array', () => {
    expect(isValidTagsList([])).toBe(true);
  });

  it('rejects non-array input', () => {
    expect(isValidTagsList('skill')).toBe(false);
    expect(isValidTagsList({ 0: 'skill' })).toBe(false);
  });

  it('rejects array exceeding maxItems', () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(isValidTagsList(tags, 20)).toBe(false);
  });

  it('accepts array at maxItems limit', () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    expect(isValidTagsList(tags, 20)).toBe(true);
  });

  it('rejects tag that is empty string', () => {
    expect(isValidTagsList(['valid', ''])).toBe(false);
  });

  it('rejects tag that is whitespace only', () => {
    expect(isValidTagsList(['valid', '   '])).toBe(false);
  });

  it('rejects tag exceeding maxLength', () => {
    const longTag = 'a'.repeat(51);
    expect(isValidTagsList([longTag], 20, 50)).toBe(false);
  });

  it('accepts tag at maxLength boundary', () => {
    const tag = 'a'.repeat(50);
    expect(isValidTagsList([tag], 20, 50)).toBe(true);
  });

  it('rejects array containing non-string items', () => {
    expect(isValidTagsList(['valid', 123])).toBe(false);
  });

  it('uses custom maxItems and maxLength parameters', () => {
    expect(isValidTagsList(['a', 'b', 'c'], 2, 10)).toBe(false);
    expect(isValidTagsList(['a', 'b'], 2, 10)).toBe(true);
  });
});
