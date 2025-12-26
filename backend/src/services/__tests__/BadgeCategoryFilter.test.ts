import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import BadgeCategoryFilter, { BadgeCategory, BadgeLevel, FilteredBadgeEvent } from '../BadgeCategoryFilter'
import CategoryHandlerManager from '../CategoryHandlerManager'
import { connectDB, closeDB } from '../../utils/database'

describe('BadgeCategoryFilter', () => {
  let categoryFilter: BadgeCategoryFilter

  beforeAll(async () => {
    await connectDB()
    categoryFilter = BadgeCategoryFilter.getInstance()
  })

  afterAll(async () => {
    await closeDB()
  })

  describe('parseBadgeMetadata', () => {
    it('should parse valid badge metadata', () => {
      const eventData = {
        metadata: {
          category: 'skill',
          level: 2,
          timestamp: 1640995200000
        }
      }

      const result = categoryFilter.parseBadgeMetadata(eventData)

      expect(result).toEqual({
        category: 'skill',
        level: 'intermediate',
        timestamp: 1640995200000
      })
    })

    it('should handle string categories', () => {
      const eventData = {
        category: 'leadership',
        level: 'advanced',
        timestamp: Date.now()
      }

      const result = categoryFilter.parseBadgeMetadata(eventData)

      expect(result?.category).toBe('leadership')
      expect(result?.level).toBe('advanced')
    })

    it('should return null for invalid metadata', () => {
      const eventData = {
        invalidField: 'value'
      }

      const result = categoryFilter.parseBadgeMetadata(eventData)

      expect(result).toBeNull()
    })
  })

  describe('filterEvent', () => {
    it('should filter events by category', () => {
      const eventData = {
        badgeId: 'badge-123',
        userId: 'user-456',
        metadata: {
          category: 'skill',
          level: 1,
          timestamp: Date.now()
        }
      }

      const filter = { categories: ['skill'] }
      const result = categoryFilter.filterEvent('badge_mint', eventData, filter)

      expect(result?.category).toBe('skill')
      expect(result?.level).toBe('beginner')
      expect(result?.badgeId).toBe('badge-123')
    })

    it('should filter events by level', () => {
      const eventData = {
        metadata: {
          category: 'leadership',
          level: 3,
          timestamp: Date.now()
        }
      }

      const filter = { levels: ['advanced'] }
      const result = categoryFilter.filterEvent('badge_mint', eventData, filter)

      expect(result?.level).toBe('advanced')
    })

    it('should exclude events that do not match filter', () => {
      const eventData = {
        metadata: {
          category: 'skill',
          level: 1,
          timestamp: Date.now()
        }
      }

      const filter = { categories: ['leadership'] }
      const result = categoryFilter.filterEvent('badge_mint', eventData, filter)

      expect(result).toBeNull()
    })

    it('should include all events when no filter specified', () => {
      const eventData = {
        metadata: {
          category: 'contribution',
          level: 2,
          timestamp: Date.now()
        }
      }

      const result = categoryFilter.filterEvent('badge_mint', eventData)

      expect(result?.category).toBe('contribution')
    })
  })

  describe('getValidCategories', () => {
    it('should return all valid categories', () => {
      const categories = categoryFilter.getValidCategories()

      expect(categories).toContain('skill')
      expect(categories).toContain('leadership')
      expect(categories).toContain('learning milestone')
      expect(categories.length).toBe(5)
    })
  })

  describe('getValidLevels', () => {
    it('should return all valid levels', () => {
      const levels = categoryFilter.getValidLevels()

      expect(levels).toEqual(['beginner', 'intermediate', 'advanced'])
    })
  })
})

describe('CategoryHandlerManager', () => {
  let handlerManager: CategoryHandlerManager

  beforeAll(async () => {
    await connectDB()
    handlerManager = CategoryHandlerManager.getInstance()
  })

  afterAll(async () => {
    await closeDB()
  })

  describe('processEvent', () => {
    it('should process events with appropriate handlers', async () => {
      const mockEvent: FilteredBadgeEvent = {
        eventType: 'badge_mint',
        badgeId: 'badge-123',
        userId: 'user-456',
        category: 'skill',
        level: 'intermediate',
        transactionHash: '0x123',
        blockHeight: 12345,
        timestamp: Date.now(),
        metadata: {}
      }

      const result = await handlerManager.processEvent(mockEvent)

      expect(result.category).toBe('skill')
      expect(result.processed).toBe(true)
    })

    it('should return null for unregistered categories', async () => {
      const mockEvent: FilteredBadgeEvent = {
        eventType: 'badge_mint',
        badgeId: 'badge-123',
        userId: 'user-456',
        category: 'invalid_category' as BadgeCategory,
        level: 'beginner',
        transactionHash: '0x123',
        blockHeight: 12345,
        timestamp: Date.now(),
        metadata: {}
      }

      const result = await handlerManager.processEvent(mockEvent)

      expect(result).toBeNull()
    })
  })

  describe('getRegisteredCategories', () => {
    it('should return all registered categories', () => {
      const categories = handlerManager.getRegisteredCategories()

      expect(categories).toContain('skill')
      expect(categories).toContain('leadership')
      expect(categories.length).toBe(5)
    })
  })

  describe('getHandler', () => {
    it('should return handler for valid category', () => {
      const handler = handlerManager.getHandler('skill')

      expect(handler).toBeDefined()
      expect(handler?.getCategory()).toBe('skill')
    })

    it('should return undefined for invalid category', () => {
      const handler = handlerManager.getHandler('invalid' as BadgeCategory)

      expect(handler).toBeUndefined()
    })
  })
})