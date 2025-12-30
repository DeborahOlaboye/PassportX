import { describe, it, expect } from 'vitest'
import {
  validateBadgeName,
  validateBadgeDescription,
  validateBadgeCategory,
  validateBadgeLevel,
  validateBadgeMetadata,
  getValidBadgeCategories,
  isCategoryValid,
  isLevelInValidRange,
  ValidationError,
  BadgeValidationResult
} from '../../src/lib/validation/badgeValidation'

describe('Badge Validation Functions', () => {
  describe('validateBadgeName', () => {
    it('should accept valid badge names with alphanumeric characters and spaces', () => {
      const validNames = ['Python Master', 'Test Badge 123', 'ABC']
      validNames.forEach(name => {
        const result = validateBadgeName(name)
        expect(result).toBeNull()
      })
    })

    it('should reject empty badge names', () => {
      const result = validateBadgeName('')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('required')
    })

    it('should reject badge names exceeding 64 characters', () => {
      const longName = 'A'.repeat(65)
      const result = validateBadgeName(longName)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('exceed 64')
    })

    it('should accept badge names exactly 64 characters long', () => {
      const maxName = 'A'.repeat(64)
      const result = validateBadgeName(maxName)
      expect(result).toBeNull()
    })

    it('should reject badge names with special characters', () => {
      const invalidNames = ['Badge@123', 'Test-Badge', 'Badge_Name', 'Badge#1']
      invalidNames.forEach(name => {
        const result = validateBadgeName(name)
        expect(result).not.toBeNull()
        expect(result?.message).toContain('alphanumeric')
      })
    })

    it('should allow badge names with multiple spaces', () => {
      const result = validateBadgeName('Python Master Badge Advanced')
      expect(result).toBeNull()
    })

    it('should trim whitespace before validation', () => {
      const result = validateBadgeName('  Valid Badge  ')
      expect(result).toBeNull()
    })
  })

  describe('validateBadgeDescription', () => {
    it('should accept valid descriptions', () => {
      const validDescriptions = [
        'This is a test',
        'A badge for testing purposes',
        'Short but valid description of the badge'
      ]
      validDescriptions.forEach(desc => {
        const result = validateBadgeDescription(desc)
        expect(result).toBeNull()
      })
    })

    it('should reject empty descriptions', () => {
      const result = validateBadgeDescription('')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('required')
    })

    it('should reject descriptions shorter than 10 characters', () => {
      const result = validateBadgeDescription('Short')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('at least 10')
    })

    it('should accept descriptions exactly 10 characters long', () => {
      const result = validateBadgeDescription('Exactly10c')
      expect(result).toBeNull()
    })

    it('should reject descriptions exceeding 256 characters', () => {
      const longDescription = 'A'.repeat(257)
      const result = validateBadgeDescription(longDescription)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('exceed 256')
    })

    it('should accept descriptions exactly 256 characters long', () => {
      const maxDescription = 'A'.repeat(256)
      const result = validateBadgeDescription(maxDescription)
      expect(result).toBeNull()
    })

    it('should trim whitespace before validation', () => {
      const result = validateBadgeDescription('  Valid description  ')
      expect(result).toBeNull()
    })
  })

  describe('validateBadgeCategory', () => {
    it('should accept valid badge categories', () => {
      const validCategories = ['skill', 'participation', 'contribution', 'leadership', 'learning', 'achievement', 'milestone']
      validCategories.forEach(category => {
        const result = validateBadgeCategory(category)
        expect(result).toBeNull()
      })
    })

    it('should reject empty categories', () => {
      const result = validateBadgeCategory('')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('required')
    })

    it('should reject invalid categories', () => {
      const result = validateBadgeCategory('invalid_category')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('Invalid badge category')
    })

    it('should handle case-insensitive category validation', () => {
      const result = validateBadgeCategory('SKILL')
      expect(result).toBeNull()
    })

    it('should accept custom valid categories if provided', () => {
      const customCategories = ['custom1', 'custom2']
      const result = validateBadgeCategory('custom1', customCategories)
      expect(result).toBeNull()
    })

    it('should reject categories not in custom list', () => {
      const customCategories = ['custom1', 'custom2']
      const result = validateBadgeCategory('skill', customCategories)
      expect(result).not.toBeNull()
    })
  })

  describe('validateBadgeLevel', () => {
    it('should accept valid levels 1-5', () => {
      for (let level = 1; level <= 5; level++) {
        const result = validateBadgeLevel(level)
        expect(result).toBeNull()
      }
    })

    it('should reject level 0', () => {
      const result = validateBadgeLevel(0)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('between 1 and 5')
    })

    it('should reject level 6', () => {
      const result = validateBadgeLevel(6)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('between 1 and 5')
    })

    it('should reject negative levels', () => {
      const result = validateBadgeLevel(-1)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('between 1 and 5')
    })

    it('should reject non-integer levels', () => {
      const result = validateBadgeLevel(2.5)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('whole number')
    })

    it('should reject null and undefined', () => {
      expect(validateBadgeLevel(null as any)).not.toBeNull()
      expect(validateBadgeLevel(undefined as any)).not.toBeNull()
    })
  })

  describe('validateBadgeMetadata', () => {
    const validMetadata = {
      name: 'Test Badge',
      description: 'This is a test badge description',
      category: 'skill',
      level: 3
    }

    it('should validate complete and correct metadata', () => {
      const result = validateBadgeMetadata(validMetadata)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return multiple errors for invalid metadata', () => {
      const invalidMetadata = {
        name: 'A'.repeat(65),
        description: 'Short',
        category: 'invalid',
        level: 10
      }
      const result = validateBadgeMetadata(invalidMetadata)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate each field independently', () => {
      const metadata = {
        ...validMetadata,
        level: 6
      }
      const result = validateBadgeMetadata(metadata)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'level')).toBe(true)
    })

    it('should accept custom categories in metadata validation', () => {
      const metadata = {
        name: 'Test Badge',
        description: 'This is a test badge description',
        category: 'custom',
        level: 3,
        validCategories: ['custom', 'other']
      }
      const result = validateBadgeMetadata(metadata)
      expect(result.valid).toBe(true)
    })
  })

  describe('Helper functions', () => {
    describe('getValidBadgeCategories', () => {
      it('should return array of valid categories', () => {
        const categories = getValidBadgeCategories()
        expect(Array.isArray(categories)).toBe(true)
        expect(categories).toContain('skill')
        expect(categories).toContain('achievement')
        expect(categories.length).toBeGreaterThan(0)
      })
    })

    describe('isCategoryValid', () => {
      it('should return true for valid categories', () => {
        expect(isCategoryValid('skill')).toBe(true)
        expect(isCategoryValid('achievement')).toBe(true)
      })

      it('should return false for invalid categories', () => {
        expect(isCategoryValid('invalid')).toBe(false)
        expect(isCategoryValid('unknown')).toBe(false)
      })
    })

    describe('isLevelInValidRange', () => {
      it('should return true for levels 1-5', () => {
        for (let level = 1; level <= 5; level++) {
          expect(isLevelInValidRange(level)).toBe(true)
        }
      })

      it('should return false for levels outside range', () => {
        expect(isLevelInValidRange(0)).toBe(false)
        expect(isLevelInValidRange(6)).toBe(false)
        expect(isLevelInValidRange(-1)).toBe(false)
      })

      it('should return false for non-integer values', () => {
        expect(isLevelInValidRange(2.5)).toBe(false)
        expect(isLevelInValidRange(NaN)).toBe(false)
      })
    })
  })

  describe('Error message content', () => {
    it('should include field name in error', () => {
      const result = validateBadgeName('')
      expect(result?.field).toBe('name')
    })

    it('should provide descriptive error messages', () => {
      const nameError = validateBadgeName('A'.repeat(65))
      expect(nameError?.message).toContain('64')

      const descError = validateBadgeDescription('Short')
      expect(descError?.message).toContain('10')

      const levelError = validateBadgeLevel(10)
      expect(levelError?.message).toContain('1')
      expect(levelError?.message).toContain('5')
    })

    it('should show current value in error message when applicable', () => {
      const nameError = validateBadgeName('A'.repeat(65))
      expect(nameError?.message).toContain('65')

      const levelError = validateBadgeLevel(10)
      expect(levelError?.message).toContain('10')
    })
  })
})
