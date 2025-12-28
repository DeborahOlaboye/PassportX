import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../backend/src/app'
import Badge from '../../backend/src/models/Badge'
import BadgeTemplate from '../../backend/src/models/BadgeTemplate'
import Community from '../../backend/src/models/Community'
import mongoose from 'mongoose'

describe('Badge Verification API Integration Tests', () => {
  let testBadgeId: string
  let testCommunityId: string
  let testTemplateId: string
  const testOwner = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
  const testIssuer = 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'

  beforeAll(async () => {
    // Setup test data
    const community = await Community.create({
      name: 'Test Community',
      slug: 'test-community',
      description: 'Test community for verification',
      admins: [testIssuer],
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

    const template = await BadgeTemplate.create({
      name: 'Verified Test Badge',
      description: 'A test badge for verification',
      category: 'skill',
      level: 3,
      icon: '🏆',
      requirements: 'Complete verification tests',
      community: testCommunityId,
      creator: testIssuer,
      isActive: true
    })
    testTemplateId = template._id.toString()

    const badge = await Badge.create({
      templateId: testTemplateId,
      owner: testOwner,
      issuer: testIssuer,
      community: testCommunityId,
      tokenId: 123,
      transactionId: '0x1234567890abcdef',
      issuedAt: new Date(),
      metadata: {
        level: 3,
        category: 'skill',
        timestamp: Math.floor(Date.now() / 1000)
      }
    })
    testBadgeId = badge._id.toString()
  })

  afterAll(async () => {
    // Cleanup
    await Badge.deleteMany({})
    await BadgeTemplate.deleteMany({})
    await Community.deleteMany({})
    await mongoose.connection.close()
  })

  describe('POST /api/verify/badge', () => {
    it('should verify a valid badge', async () => {
      const response = await request(app)
        .post('/api/verify/badge')
        .send({ badgeId: testBadgeId })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verification).toBeDefined()
      expect(response.body.verification.badgeId).toBe(testBadgeId)
      expect(response.body.verification.verified).toBe(true)
      expect(response.body.verification.owner).toBe(testOwner)
      expect(response.body.verification.issuer).toBe(testIssuer)
    })

    it('should verify ownership when claimed owner matches', async () => {
      const response = await request(app)
        .post('/api/verify/badge')
        .send({
          badgeId: testBadgeId,
          claimedOwner: testOwner
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verification.verified).toBe(true)
    })

    it('should fail verification when claimed owner does not match', async () => {
      const response = await request(app)
        .post('/api/verify/badge')
        .send({
          badgeId: testBadgeId,
          claimedOwner: 'SP3DIFFERENT123456789ABCDEFGHIJK'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verification.verified).toBe(false)
    })

    it('should return 400 if badgeId is missing', async () => {
      const response = await request(app)
        .post('/api/verify/badge')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Badge ID is required')
    })

    it('should return 404 for non-existent badge', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .post('/api/verify/badge')
        .send({ badgeId: fakeId })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Badge not found')
    })
  })

  describe('GET /api/verify/badge/:badgeId', () => {
    it('should get verification status for a badge', async () => {
      const response = await request(app)
        .get(`/api/verify/badge/${testBadgeId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verification).toBeDefined()
      expect(response.body.verification.badgeId).toBe(testBadgeId)
      expect(response.body.verification.templateName).toBe('Verified Test Badge')
      expect(response.body.verification.communityName).toBe('Test Community')
    })

    it('should return 404 for non-existent badge', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/verify/badge/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/verify/public/:badgeId', () => {
    it('should return public verification info', async () => {
      const response = await request(app)
        .get(`/api/verify/public/${testBadgeId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.badgeId).toBe(testBadgeId)
      expect(response.body.data.verified).toBe(true)
      expect(response.body.data.templateName).toBe('Verified Test Badge')
      expect(response.body.data.communityName).toBe('Test Community')
      // Should not include sensitive owner information in public view
      expect(response.body.data.owner).toBeUndefined()
    })

    it('should return 404 for non-existent badge', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/verify/public/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/verify/batch', () => {
    let badge2Id: string

    beforeAll(async () => {
      const badge2 = await Badge.create({
        templateId: testTemplateId,
        owner: testOwner,
        issuer: testIssuer,
        community: testCommunityId,
        tokenId: 124,
        transactionId: '0xabcdef1234567890',
        issuedAt: new Date(),
        metadata: {
          level: 2,
          category: 'participation',
          timestamp: Math.floor(Date.now() / 1000)
        }
      })
      badge2Id = badge2._id.toString()
    })

    it('should verify multiple badges', async () => {
      const response = await request(app)
        .post('/api/verify/batch')
        .send({ badgeIds: [testBadgeId, badge2Id] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verifications).toHaveLength(2)
      expect(response.body.count).toBe(2)
    })

    it('should return 400 if badgeIds is not an array', async () => {
      const response = await request(app)
        .post('/api/verify/batch')
        .send({ badgeIds: 'not-an-array' })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 if badgeIds is empty', async () => {
      const response = await request(app)
        .post('/api/verify/batch')
        .send({ badgeIds: [] })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 if more than 50 badges requested', async () => {
      const manyIds = Array(51).fill(testBadgeId)
      const response = await request(app)
        .post('/api/verify/batch')
        .send({ badgeIds: manyIds })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Maximum 50 badges')
    })
  })

  describe('GET /api/verify/user/:address', () => {
    it('should verify all badges for a user', async () => {
      const response = await request(app)
        .get(`/api/verify/user/${testOwner}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verifications).toBeDefined()
      expect(response.body.verifications.length).toBeGreaterThan(0)
      expect(response.body.count).toBeGreaterThan(0)
    })

    it('should return empty array for user with no badges', async () => {
      const response = await request(app)
        .get('/api/verify/user/SP1NOBADGES123456789ABCDEF')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verifications).toHaveLength(0)
      expect(response.body.count).toBe(0)
    })
  })

  describe('GET /api/verify/blockchain/:badgeId', () => {
    it('should confirm badge is on blockchain when tokenId and transactionId exist', async () => {
      const response = await request(app)
        .get(`/api/verify/blockchain/${testBadgeId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verified).toBe(true)
    })

    it('should return false for badge without blockchain verification', async () => {
      const unverifiedBadge = await Badge.create({
        templateId: testTemplateId,
        owner: testOwner,
        issuer: testIssuer,
        community: testCommunityId,
        issuedAt: new Date(),
        metadata: {
          level: 1,
          category: 'learning',
          timestamp: Math.floor(Date.now() / 1000)
        }
      })

      const response = await request(app)
        .get(`/api/verify/blockchain/${unverifiedBadge._id}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verified).toBe(false)
    })

    it('should return false for non-existent badge', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const response = await request(app)
        .get(`/api/verify/blockchain/${fakeId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.verified).toBe(false)
    })
  })
})
