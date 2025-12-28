import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../backend/src/app'
import Badge from '../../backend/src/models/Badge'
import BadgeTemplate from '../../backend/src/models/BadgeTemplate'
import Community from '../../backend/src/models/Community'
import mongoose from 'mongoose'

describe('Badge Search API Integration Tests', () => {
  let testCommunityId: string
  let testTemplateIds: string[] = []
  let testBadgeIds: string[] = []

  beforeAll(async () => {
    // Create test community
    const community = await Community.create({
      name: 'Search Test Community',
      slug: 'search-test',
      description: 'Community for search testing',
      admins: ['SP1TESTADDRESS'],
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        backgroundColor: '#f0f0f0',
        textColor: '#000000',
        borderRadius: '8px'
      },
      memberCount: 1,
      badgeTemplates: [],
      isPublic: true,
      isActive: true,
      settings: {
        allowMemberInvites: true,
        requireApproval: false,
        allowBadgeIssuance: true,
        allowCustomBadges: true
      },
      tags: ['test']
    })
    testCommunityId = community._id.toString()

    // Create test templates
    const templates = await Promise.all([
      BadgeTemplate.create({
        name: 'JavaScript Expert',
        description: 'Master of JavaScript programming',
        category: 'skill',
        level: 5,
        icon: '💻',
        community: testCommunityId,
        creator: 'SP1TESTADDRESS',
        isActive: true
      }),
      BadgeTemplate.create({
        name: 'Python Beginner',
        description: 'Started learning Python',
        category: 'learning',
        level: 1,
        icon: '🐍',
        community: testCommunityId,
        creator: 'SP1TESTADDRESS',
        isActive: true
      }),
      BadgeTemplate.create({
        name: 'Community Leader',
        description: 'Led community initiatives',
        category: 'leadership',
        level: 4,
        icon: '👑',
        community: testCommunityId,
        creator: 'SP1TESTADDRESS',
        isActive: true
      })
    ])
    testTemplateIds = templates.map(t => t._id.toString())

    // Create test badges
    const badges = await Promise.all([
      Badge.create({
        templateId: testTemplateIds[0],
        owner: 'SP1OWNER1',
        issuer: 'SP1TESTADDRESS',
        community: testCommunityId,
        tokenId: 1,
        transactionId: '0xabc123',
        issuedAt: new Date('2024-01-15'),
        metadata: { level: 5, category: 'skill', timestamp: Date.now() / 1000 }
      }),
      Badge.create({
        templateId: testTemplateIds[1],
        owner: 'SP1OWNER2',
        issuer: 'SP1TESTADDRESS',
        community: testCommunityId,
        tokenId: 2,
        transactionId: '0xdef456',
        issuedAt: new Date('2024-02-20'),
        metadata: { level: 1, category: 'learning', timestamp: Date.now() / 1000 }
      }),
      Badge.create({
        templateId: testTemplateIds[2],
        owner: 'SP1OWNER3',
        issuer: 'SP1TESTADDRESS',
        community: testCommunityId,
        tokenId: 3,
        transactionId: '0xghi789',
        issuedAt: new Date('2024-03-10'),
        metadata: { level: 4, category: 'leadership', timestamp: Date.now() / 1000 }
      })
    ])
    testBadgeIds = badges.map(b => b._id.toString())
  })

  afterAll(async () => {
    await Badge.deleteMany({ community: testCommunityId })
    await BadgeTemplate.deleteMany({ community: testCommunityId })
    await Community.findByIdAndDelete(testCommunityId)
    await mongoose.connection.close()
  })

  describe('POST /api/badges/search', () => {
    it('should search badges by name', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ search: 'JavaScript' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.badges.length).toBeGreaterThan(0)
      expect(response.body.data.badges[0].templateId.name).toContain('JavaScript')
    })

    it('should filter badges by level', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ level: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.badges.forEach((badge: any) => {
        expect(badge.metadata.level).toBe(5)
      })
    })

    it('should filter badges by multiple levels', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ level: [1, 4] })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.badges.forEach((badge: any) => {
        expect([1, 4]).toContain(badge.metadata.level)
      })
    })

    it('should filter badges by category', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ category: 'skill' })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.badges.forEach((badge: any) => {
        expect(badge.metadata.category).toBe('skill')
      })
    })

    it('should filter badges by community', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ community: testCommunityId })
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.badges.forEach((badge: any) => {
        expect(badge.community._id).toBe(testCommunityId)
      })
    })

    it('should sort badges by newest first', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ sortBy: 'newest', community: testCommunityId })
        .expect(200)

      expect(response.body.success).toBe(true)
      const badges = response.body.data.badges
      for (let i = 0; i < badges.length - 1; i++) {
        expect(new Date(badges[i].issuedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(badges[i + 1].issuedAt).getTime()
        )
      }
    })

    it('should sort badges by level high to low', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ sortBy: 'level-high', community: testCommunityId })
        .expect(200)

      expect(response.body.success).toBe(true)
      const badges = response.body.data.badges
      for (let i = 0; i < badges.length - 1; i++) {
        expect(badges[i].metadata.level).toBeGreaterThanOrEqual(badges[i + 1].metadata.level)
      }
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .post('/api/badges/search')
        .send({ page: 1, limit: 2, community: testCommunityId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.limit).toBe(2)
      expect(response.body.data.badges.length).toBeLessThanOrEqual(2)
      expect(response.body.data.totalPages).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /api/badges/search', () => {
    it('should search with query parameters', async () => {
      const response = await request(app)
        .get('/api/badges/search')
        .query({ search: 'Python', level: 1 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.badges.length).toBeGreaterThan(0)
    })

    it('should handle multiple filters', async () => {
      const response = await request(app)
        .get('/api/badges/search')
        .query({
          category: 'skill',
          level: '5',
          sortBy: 'newest'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/badges/filters', () => {
    it('should return available filter options', async () => {
      const response = await request(app)
        .get('/api/badges/filters')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('levels')
      expect(response.body.data).toHaveProperty('categories')
      expect(response.body.data).toHaveProperty('communities')
      expect(Array.isArray(response.body.data.levels)).toBe(true)
      expect(Array.isArray(response.body.data.categories)).toBe(true)
    })
  })

  describe('GET /api/badges/suggestions', () => {
    it('should return search suggestions', async () => {
      const response = await request(app)
        .get('/api/badges/suggestions')
        .query({ q: 'Java' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should return empty array for short query', async () => {
      const response = await request(app)
        .get('/api/badges/suggestions')
        .query({ q: 'J' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })

    it('should limit suggestions', async () => {
      const response = await request(app)
        .get('/api/badges/suggestions')
        .query({ q: 'test', limit: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('GET /api/badges/trending', () => {
    it('should return trending badges', async () => {
      const response = await request(app)
        .get('/api/badges/trending')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should respect days parameter', async () => {
      const response = await request(app)
        .get('/api/badges/trending')
        .query({ days: 30 })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/badges/trending')
        .query({ limit: 5 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeLessThanOrEqual(5)
    })
  })

  describe('GET /api/badges/issuer/:address', () => {
    it('should find badges by issuer', async () => {
      const response = await request(app)
        .get('/api/badges/issuer/SP1TESTADDRESS')
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.badges.forEach((badge: any) => {
        expect(badge.issuer).toBe('SP1TESTADDRESS')
      })
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/badges/issuer/SP1TESTADDRESS')
        .query({ page: 1, limit: 2 })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.limit).toBe(2)
    })
  })
})
