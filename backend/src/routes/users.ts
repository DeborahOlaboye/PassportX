import { Router } from 'express'
import User from '../models/User'
import Badge from '../models/Badge'
import { authenticateToken, optionalAuth } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../types'

const router = Router()

// Get user profile
router.get('/profile/:address', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { address } = req.params
    const user = await User.findOne({ stacksAddress: address })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Check if profile is public or user is viewing their own profile
    if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
      throw createError('Profile is private', 403)
    }

    res.json({
      id: user._id,
      stacksAddress: user.stacksAddress,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      isPublic: user.isPublic,
      joinDate: user.joinDate
    })
  } catch (error) {
    next(error)
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { name, bio, avatar, isPublic } = req.body
    
    const user = await User.findOne({ stacksAddress: req.user!.stacksAddress })
    if (!user) {
      throw createError('User not found', 404)
    }

    if (name !== undefined) user.name = name
    if (bio !== undefined) user.bio = bio
    if (avatar !== undefined) user.avatar = avatar
    if (isPublic !== undefined) user.isPublic = isPublic

    await user.save()

    res.json({
      id: user._id,
      stacksAddress: user.stacksAddress,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      isPublic: user.isPublic,
      joinDate: user.joinDate
    })
  } catch (error) {
    next(error)
  }
})

// Get user badges (passport)
router.get('/badges/:address', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { address } = req.params
    const user = await User.findOne({ stacksAddress: address })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Check if profile is public or user is viewing their own badges
    if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
      throw createError('Profile is private', 403)
    }

    const badges = await Badge.find({ owner: address })
      .populate('templateId')
      .populate('community')
      .sort({ issuedAt: -1 })

    const formattedBadges = badges.map(badge => ({
      id: badge._id,
      name: (badge.templateId as any).name,
      description: (badge.templateId as any).description,
      community: (badge.community as any).name,
      level: badge.metadata.level,
      category: badge.metadata.category,
      timestamp: badge.metadata.timestamp,
      icon: (badge.templateId as any).icon,
      issuedAt: badge.issuedAt,
      tokenId: badge.tokenId,
      transactionId: badge.transactionId
    }))

    res.json(formattedBadges)
  } catch (error) {
    next(error)
  }
})

// Get user statistics
router.get('/stats/:address', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { address } = req.params
    const user = await User.findOne({ stacksAddress: address })

    if (!user) {
      throw createError('User not found', 404)
    }

    if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
      throw createError('Profile is private', 403)
    }

    const badges = await Badge.find({ owner: address }).populate('community')
    const communities = new Set(badges.map(badge => (badge.community as any)._id.toString()))
    const maxLevel = badges.length > 0 ? Math.max(...badges.map(badge => badge.metadata.level)) : 0

    res.json({
      totalBadges: badges.length,
      communities: communities.size,
      highestLevel: maxLevel,
      joinDate: user.joinDate
    })
  } catch (error) {
    next(error)
  }
})

export default router