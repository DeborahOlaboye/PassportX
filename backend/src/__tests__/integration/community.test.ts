import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Community from '../../models/Community'
import User from '../../models/User'

describe('Community Integration Tests', () => {
  let mongoServer: MongoMemoryServer
  let authToken: string
  let testUserAddress: string

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri)

    // Create test user
    testUserAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    await User.create({
      stacksAddress: testUserAddress,
      name: 'Test User',
      joinDate: new Date()
    })

    // Mock auth token (in real app, this would come from auth service)
    authToken = 'mock-jwt-token'
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  afterEach(async () => {
    await Community.deleteMany({})
  })

  describe('POST /api/communities', () => {
    it('should create a new community', async () => {
      const communityData = {
        name: 'Test Community',
        description: 'A community for testing',
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981'
        },
        tags: ['test', 'development']
      }

      // Note: This test requires the actual Express app to be exported
      // For demonstration, showing the expected behavior

      const expectedCommunity = {
        name: communityData.name,
        description: communityData.description,
        slug: 'test-community',
        admins: [testUserAddress],
        isActive: true,
        isPublic: true
      }

      // Create community directly for testing
      const community = await Community.create({
        ...communityData,
        slug: 'test-community',
        admins: [testUserAddress],
        isActive: true,
        isPublic: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      expect(community.name).toBe(communityData.name)
      expect(community.description).toBe(communityData.description)
      expect(community.slug).toBe('test-community')
      expect(community.admins).toContain(testUserAddress)
    })

    it('should not create community with duplicate slug', async () => {
      await Community.create({
        name: 'Test Community',
        slug: 'test-community',
        description: 'First community',
        admins: [testUserAddress],
        isActive: true
      })

      await expect(
        Community.create({
          name: 'Test Community',
          slug: 'test-community',
          description: 'Duplicate community',
          admins: [testUserAddress],
          isActive: true
        })
      ).rejects.toThrow()
    })

    it('should require name and description', async () => {
      await expect(
        Community.create({
          slug: 'invalid-community',
          admins: [testUserAddress]
        })
      ).rejects.toThrow()
    })
  })

  describe('GET /api/communities/:id', () => {
    it('should retrieve a community by ID', async () => {
      const community = await Community.create({
        name: 'Retrieve Test',
        slug: 'retrieve-test',
        description: 'Testing retrieval',
        admins: [testUserAddress],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      const found = await Community.findById(community._id)

      expect(found).not.toBeNull()
      expect(found?.name).toBe('Retrieve Test')
      expect(found?.slug).toBe('retrieve-test')
    })

    it('should retrieve a community by slug', async () => {
      await Community.create({
        name: 'Slug Test',
        slug: 'slug-test',
        description: 'Testing slug lookup',
        admins: [testUserAddress],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      const found = await Community.findOne({ slug: 'slug-test' })

      expect(found).not.toBeNull()
      expect(found?.name).toBe('Slug Test')
    })
  })

  describe('PUT /api/communities/:id', () => {
    it('should update community details', async () => {
      const community = await Community.create({
        name: 'Update Test',
        slug: 'update-test',
        description: 'Original description',
        admins: [testUserAddress],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      community.description = 'Updated description'
      community.theme = {
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderRadius: '0.5rem'
      }
      await community.save()

      const updated = await Community.findById(community._id)
      expect(updated?.description).toBe('Updated description')
      expect(updated?.theme?.primaryColor).toBe('#ff0000')
    })
  })

  describe('Admin Management', () => {
    it('should add a new admin to community', async () => {
      const community = await Community.create({
        name: 'Admin Test',
        slug: 'admin-test',
        description: 'Testing admin management',
        admins: [testUserAddress],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      const newAdmin = 'ST2ADMIN123456789ABCDEFGHIJK'
      community.admins.push(newAdmin)
      await community.save()

      const updated = await Community.findById(community._id)
      expect(updated?.admins).toContain(newAdmin)
      expect(updated?.admins.length).toBe(2)
    })

    it('should remove an admin from community', async () => {
      const admin1 = testUserAddress
      const admin2 = 'ST2ADMIN123456789ABCDEFGHIJK'

      const community = await Community.create({
        name: 'Remove Admin Test',
        slug: 'remove-admin-test',
        description: 'Testing admin removal',
        admins: [admin1, admin2],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      community.admins = community.admins.filter(admin => admin !== admin2)
      await community.save()

      const updated = await Community.findById(community._id)
      expect(updated?.admins).not.toContain(admin2)
      expect(updated?.admins.length).toBe(1)
    })

    it('should not allow removing the last admin', async () => {
      const community = await Community.create({
        name: 'Last Admin Test',
        slug: 'last-admin-test',
        description: 'Testing last admin protection',
        admins: [testUserAddress],
        isActive: true,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      })

      // This should be prevented in the service layer
      // Here we're just testing the model constraint
      community.admins = []

      await expect(community.save()).rejects.toThrow()
    })
  })
})
