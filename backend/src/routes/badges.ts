import { Router } from 'express'
import BadgeTemplate from '../models/BadgeTemplate'
import Badge from '../models/Badge'
import Community from '../models/Community'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../types'
import { updateMemberCount } from '../services/communityService'

const router = Router()

// Create badge template
router.post('/templates', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, description, category, level, icon, requirements, communityId } = req.body

    if (!name || !description || !category || !level || !communityId) {
      throw createError('Missing required fields', 400)
    }

    const community = await Community.findById(communityId)
    if (!community || !community.isActive) {
      throw createError('Community not found', 404)
    }

    if (community.admin !== req.user!.stacksAddress) {
      throw createError('Only community admin can create badge templates', 403)
    }

    const template = new BadgeTemplate({
      name,
      description,
      category,
      level,
      icon: icon || '🏆',
      requirements,
      community: communityId,
      creator: req.user!.stacksAddress
    })

    await template.save()

    // Add template to community
    community.badgeTemplates.push(template._id)
    await community.save()

    res.status(201).json({
      id: template._id,
      name: template.name,
      description: template.description,
      category: template.category,
      level: template.level,
      icon: template.icon,
      requirements: template.requirements,
      community: communityId,
      creator: template.creator,
      createdAt: template.createdAt
    })
  } catch (error) {
    next(error)
  }
})

// Get badge templates by community
router.get('/templates/community/:communityId', async (req, res, next) => {
  try {
    const { communityId } = req.params
    const templates = await BadgeTemplate.find({ 
      community: communityId, 
      isActive: true 
    }).sort({ createdAt: -1 })

    res.json(templates.map(template => ({
      id: template._id,
      name: template.name,
      description: template.description,
      category: template.category,
      level: template.level,
      icon: template.icon,
      requirements: template.requirements,
      creator: template.creator,
      createdAt: template.createdAt
    })))
  } catch (error) {
    next(error)
  }
})

// Issue badge to user
router.post('/issue', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { templateId, recipientAddress, transactionId, tokenId } = req.body

    if (!templateId || !recipientAddress) {
      throw createError('Template ID and recipient address are required', 400)
    }

    const template = await BadgeTemplate.findById(templateId).populate('community')
    if (!template || !template.isActive) {
      throw createError('Badge template not found', 404)
    }

    const community = template.community as any
    if (community.admin !== req.user!.stacksAddress) {
      throw createError('Only community admin can issue badges', 403)
    }

    // Check if badge already issued to this user
    const existingBadge = await Badge.findOne({
      templateId,
      owner: recipientAddress
    })

    if (existingBadge) {
      throw createError('Badge already issued to this user', 409)
    }

    const badge = new Badge({
      templateId,
      owner: recipientAddress,
      issuer: req.user!.stacksAddress,
      community: community._id,
      tokenId,
      transactionId,
      metadata: {
        level: template.level,
        category: template.category,
        timestamp: Math.floor(Date.now() / 1000)
      }
    })

    await badge.save()

    // Update community member count
    await updateMemberCount(community._id)

    res.status(201).json({
      id: badge._id,
      templateId: badge.templateId,
      owner: badge.owner,
      issuer: badge.issuer,
      community: community._id,
      tokenId: badge.tokenId,
      transactionId: badge.transactionId,
      issuedAt: badge.issuedAt,
      metadata: badge.metadata
    })
  } catch (error) {
    next(error)
  }
})

// Get badge by ID
router.get('/:id', async (req, res, next) => {
  try {
    const badge = await Badge.findById(req.params.id)
      .populate('templateId')
      .populate('community')

    if (!badge) {
      throw createError('Badge not found', 404)
    }

    res.json({
      id: badge._id,
      name: (badge.templateId as any).name,
      description: (badge.templateId as any).description,
      community: (badge.community as any).name,
      owner: badge.owner,
      issuer: badge.issuer,
      level: badge.metadata.level,
      category: badge.metadata.category,
      icon: (badge.templateId as any).icon,
      issuedAt: badge.issuedAt,
      tokenId: badge.tokenId,
      transactionId: badge.transactionId
    })
  } catch (error) {
    next(error)
  }
})

// Update badge template
router.put('/templates/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const template = await BadgeTemplate.findById(req.params.id).populate('community')
    
    if (!template || !template.isActive) {
      throw createError('Badge template not found', 404)
    }

    const community = template.community as any
    if (community.admin !== req.user!.stacksAddress) {
      throw createError('Only community admin can update badge templates', 403)
    }

    const { name, description, requirements, icon } = req.body

    if (name) template.name = name
    if (description) template.description = description
    if (requirements !== undefined) template.requirements = requirements
    if (icon) template.icon = icon

    await template.save()

    res.json({
      id: template._id,
      name: template.name,
      description: template.description,
      category: template.category,
      level: template.level,
      icon: template.icon,
      requirements: template.requirements,
      creator: template.creator,
      createdAt: template.createdAt
    })
  } catch (error) {
    next(error)
  }
})

// Revoke badge
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const badge = await Badge.findById(req.params.id).populate('community')
    
    if (!badge) {
      throw createError('Badge not found', 404)
    }

    const community = badge.community as any
    if (community.admin !== req.user!.stacksAddress) {
      throw createError('Only community admin can revoke badges', 403)
    }

    await Badge.findByIdAndDelete(req.params.id)

    // Update community member count
    await updateMemberCount(community._id)

    res.json({ message: 'Badge revoked successfully' })
  } catch (error) {
    next(error)
  }
})

export default router