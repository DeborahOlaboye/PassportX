import { Router } from 'express'
import Community from '../models/Community'
import BadgeTemplate from '../models/BadgeTemplate'
import Badge from '../models/Badge'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../types'

const router = Router()

// Get all communities (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    let query: any = { isActive: true }
    if (search) {
      query.$text = { $search: search as string }
    }

    const communities = await Community.find(query)
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('badgeTemplates')

    const total = await Community.countDocuments(query)

    const formattedCommunities = communities.map(community => ({
      id: community._id,
      name: community.name,
      description: community.description,
      memberCount: community.memberCount,
      badgeCount: community.badgeTemplates.length,
      theme: community.theme,
      createdAt: community.createdAt
    }))

    res.json({
      communities: formattedCommunities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
})

// Get community by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('badgeTemplates')

    if (!community || !community.isActive) {
      throw createError('Community not found', 404)
    }

    const isAdmin = req.user?.stacksAddress === community.admin

    res.json({
      id: community._id,
      name: community.name,
      description: community.description,
      admin: community.admin,
      memberCount: community.memberCount,
      badgeCount: community.badgeTemplates.length,
      theme: community.theme,
      createdAt: community.createdAt,
      isAdmin
    })
  } catch (error) {
    next(error)
  }
})

// Create community
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, theme } = req.body

    if (!name || !description) {
      throw createError('Name and description are required', 400)
    }

    const community = new Community({
      name,
      description,
      admin: req.user!.stacksAddress,
      theme: theme || { primaryColor: '#3b82f6' }
    })

    await community.save()

    res.status(201).json({
      id: community._id,
      name: community.name,
      description: community.description,
      admin: community.admin,
      memberCount: community.memberCount,
      badgeCount: 0,
      theme: community.theme,
      createdAt: community.createdAt
    })
  } catch (error) {
    next(error)
  }
})

// Update community
router.put('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const community = await Community.findById(req.params.id)

    if (!community || !community.isActive) {
      throw createError('Community not found', 404)
    }

    if (community.admin !== req.user!.stacksAddress) {
      throw createError('Only community admin can update', 403)
    }

    const { name, description, theme } = req.body

    if (name) community.name = name
    if (description) community.description = description
    if (theme) community.theme = { ...community.theme, ...theme }

    await community.save()

    res.json({
      id: community._id,
      name: community.name,
      description: community.description,
      admin: community.admin,
      memberCount: community.memberCount,
      badgeCount: community.badgeTemplates.length,
      theme: community.theme,
      createdAt: community.createdAt
    })
  } catch (error) {
    next(error)
  }
})

// Get communities by admin
router.get('/admin/:address', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { address } = req.params

    // Only allow viewing own communities or public access
    if (req.user?.stacksAddress !== address) {
      throw createError('Access denied', 403)
    }

    const communities = await Community.find({ 
      admin: address, 
      isActive: true 
    }).populate('badgeTemplates')

    const formattedCommunities = communities.map(community => ({
      id: community._id,
      name: community.name,
      description: community.description,
      memberCount: community.memberCount,
      badgeCount: community.badgeTemplates.length,
      theme: community.theme,
      createdAt: community.createdAt
    }))

    res.json(formattedCommunities)
  } catch (error) {
    next(error)
  }
})

// Get community statistics
router.get('/:id/stats', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const community = await Community.findById(req.params.id)

    if (!community || !community.isActive) {
      throw createError('Community not found', 404)
    }

    const badgeTemplates = await BadgeTemplate.countDocuments({ 
      community: community._id, 
      isActive: true 
    })

    const issuedBadges = await Badge.countDocuments({ community: community._id })
    
    const recentBadges = await Badge.find({ community: community._id })
      .populate('templateId')
      .sort({ issuedAt: -1 })
      .limit(5)

    res.json({
      memberCount: community.memberCount,
      badgeTemplates,
      issuedBadges,
      recentActivity: recentBadges.map(badge => ({
        badgeName: (badge.templateId as any).name,
        owner: badge.owner,
        issuedAt: badge.issuedAt
      }))
    })
  } catch (error) {
    next(error)
  }
})

export default router