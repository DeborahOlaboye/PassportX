/**
 * Test cases for route parameter validation utilities
 * Tests covering security vulnerabilities and edge cases
 */

import {
  isValidStacksAddress,
  isValidCustomUrl,
  isValidUserId,
  sanitizeInput,
  isSafeFromInjection,
  validateUserIdParameter,
  validateCustomUrlParameter,
} from '../validation'

describe('Validation Utilities', () => {
  describe('isValidStacksAddress', () => {
    test('accepts valid Stacks mainnet address', () => {
      expect(isValidStacksAddress('SP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ')).toBe(true)
    })

    test('accepts valid Stacks testnet address', () => {
      expect(isValidStacksAddress('STFUJC6AKPVJ3BLZM45YMQR57W4FZQG4MFDM2CEA')).toBe(true)
    })

    test('accepts lowercase Stacks address', () => {
      expect(isValidStacksAddress('sp2j6zy48gv6rdzv4r2x5m9y77xqsrz2gq3qtph8kq')).toBe(true)
    })

    test('rejects address with wrong prefix', () => {
      expect(isValidStacksAddress('AP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ')).toBe(false)
    })

    test('rejects too short address', () => {
      expect(isValidStacksAddress('SP2J6ZY')).toBe(false)
    })

    test('rejects null/undefined', () => {
      expect(isValidStacksAddress(null as any)).toBe(false)
      expect(isValidStacksAddress(undefined as any)).toBe(false)
      expect(isValidStacksAddress('')).toBe(false)
    })

    test('rejects non-string input', () => {
      expect(isValidStacksAddress(123 as any)).toBe(false)
      expect(isValidStacksAddress({} as any)).toBe(false)
    })
  })

  describe('isValidCustomUrl', () => {
    test('accepts valid custom URL', () => {
      expect(isValidCustomUrl('my-profile')).toBe(true)
      expect(isValidCustomUrl('profile_123')).toBe(true)
      expect(isValidCustomUrl('ABC')).toBe(true)
    })

    test('rejects URL with invalid characters', () => {
      expect(isValidCustomUrl('my@profile')).toBe(false)
      expect(isValidCustomUrl('my profile')).toBe(false)
      expect(isValidCustomUrl('my/profile')).toBe(false)
      expect(isValidCustomUrl('my.profile')).toBe(false)
    })

    test('rejects URL too short', () => {
      expect(isValidCustomUrl('ab')).toBe(false)
      expect(isValidCustomUrl('a')).toBe(false)
      expect(isValidCustomUrl('')).toBe(false)
    })

    test('rejects URL too long', () => {
      expect(isValidCustomUrl('a'.repeat(51))).toBe(false)
    })

    test('rejects null/undefined', () => {
      expect(isValidCustomUrl(null as any)).toBe(false)
      expect(isValidCustomUrl(undefined as any)).toBe(false)
    })
  })

  describe('isValidUserId', () => {
    test('accepts valid user ID', () => {
      expect(isValidUserId('user_123')).toBe(true)
      expect(isValidUserId('User123')).toBe(true)
      expect(isValidUserId('usr_456')).toBe(true)
    })

    test('rejects user ID too short', () => {
      expect(isValidUserId('user')).toBe(false)
      expect(isValidUserId('abc')).toBe(false)
    })

    test('rejects user ID with special characters', () => {
      expect(isValidUserId('user@123')).toBe(false)
      expect(isValidUserId('user-123')).toBe(false)
      expect(isValidUserId('user.123')).toBe(false)
    })

    test('rejects null/undefined', () => {
      expect(isValidUserId(null as any)).toBe(false)
      expect(isValidUserId(undefined as any)).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    test('removes dangerous characters', () => {
      expect(sanitizeInput('hello<script>world')).toBe('helloscriptworld')
      expect(sanitizeInput('test"value"here')).toBe('testvaluehere')
      expect(sanitizeInput("test'value'here")).toBe('testvaluehere')
    })

    test('removes brackets and braces', () => {
      expect(sanitizeInput('test{obj}')).toBe('testobj')
      expect(sanitizeInput('test[arr]')).toBe('testarr')
      expect(sanitizeInput('test(func)')).toBe('testfunc')
    })

    test('limits output length', () => {
      const longInput = 'a'.repeat(200)
      expect(sanitizeInput(longInput).length).toBe(100)
    })

    test('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    test('handles null/undefined', () => {
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('isSafeFromInjection', () => {
    test('detects MongoDB injection attempts', () => {
      expect(isSafeFromInjection('{"$ne": null}')).toBe(false)
      expect(isSafeFromInjection('{"$gt": 0}')).toBe(false)
      expect(isSafeFromInjection('value; $where: 1==1')).toBe(false)
    })

    test('detects SQL injection attempts', () => {
      expect(isSafeFromInjection("'; DROP TABLE users; --")).toBe(false)
      expect(isSafeFromInjection('UNION SELECT * FROM users')).toBe(false)
      expect(isSafeFromInjection('INSERT INTO users VALUES')).toBe(false)
    })

    test('detects XSS injection attempts', () => {
      expect(isSafeFromInjection('<script>alert("xss")</script>')).toBe(false)
      expect(isSafeFromInjection('javascript:alert(1)')).toBe(false)
      expect(isSafeFromInjection('onerror=alert(1)')).toBe(false)
    })

    test('detects template injection attempts', () => {
      expect(isSafeFromInjection('{{7*7}}')).toBe(false)
      expect(isSafeFromInjection('{% if true %}')).toBe(false)
    })

    test('allows safe input', () => {
      expect(isSafeFromInjection('my-profile')).toBe(true)
      expect(isSafeFromInjection('user_123')).toBe(true)
      expect(isSafeFromInjection('hello world')).toBe(true)
    })

    test('handles null/undefined', () => {
      expect(isSafeFromInjection(null as any)).toBe(true)
      expect(isSafeFromInjection(undefined as any)).toBe(true)
    })
  })

  describe('validateUserIdParameter', () => {
    test('accepts valid user ID', () => {
      const result = validateUserIdParameter('user_123')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('user_123')
    })

    test('accepts valid Stacks address', () => {
      const result = validateUserIdParameter('SP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('SP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ')
    })

    test('rejects invalid format', () => {
      const result = validateUserIdParameter('inv@lid')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('rejects null/undefined', () => {
      const result = validateUserIdParameter(null)
      expect(result.isValid).toBe(false)
    })

    test('handles whitespace', () => {
      const result = validateUserIdParameter('  user_123  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('user_123')
    })
  })

  describe('validateCustomUrlParameter', () => {
    test('accepts valid custom URL', () => {
      const result = validateCustomUrlParameter('my-profile')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('my-profile')
    })

    test('lowercases custom URL', () => {
      const result = validateCustomUrlParameter('MyProfile')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('myprofile')
    })

    test('rejects invalid characters', () => {
      const result = validateCustomUrlParameter('my@profile')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('rejects too short URL', () => {
      const result = validateCustomUrlParameter('ab')
      expect(result.isValid).toBe(false)
    })

    test('handles whitespace', () => {
      const result = validateCustomUrlParameter('  my-profile  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('my-profile')
    })

    test('rejects injection attempts', () => {
      const result = validateCustomUrlParameter('my\'; DROP TABLE')
      expect(result.isValid).toBe(false)
    })
  })

  describe('Integration Tests', () => {
    test('security layer defense in depth', () => {
      // Even if one check passes, injection is caught
      const injectionAttempt = '{"$ne": null}'
      expect(isValidCustomUrl(injectionAttempt)).toBe(false)
      expect(isSafeFromInjection(injectionAttempt)).toBe(false)
    })

    test('valid input passes all checks', () => {
      const validInput = 'my-profile'
      expect(isValidCustomUrl(validInput)).toBe(true)
      expect(isSafeFromInjection(validInput)).toBe(true)

      const result = validateCustomUrlParameter(validInput)
      expect(result.isValid).toBe(true)
    })

    test('sanitization + validation', () => {
      const input = '<script>alert(1)</script>'
      const sanitized = sanitizeInput(input)
      expect(isSafeFromInjection(sanitized)).toBe(true)
    })
  })
})
