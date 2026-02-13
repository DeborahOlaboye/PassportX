import { Router } from 'express'
import * as communityController from '../controllers/communityController'
import { authenticateToken } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'
import { createRateLimiter } from '../middleware/rateLimiter'
import { COMMUNITY_WRITE_RATE_LIMIT, API_READ_RATE_LIMIT } from '../config/rateLimits'

const router = Router()

// Rate limiters
const communityWriteLimiter = createRateLimiter(COMMUNITY_WRITE_RATE_LIMIT)
const readLimiter = createRateLimiter(API_READ_RATE_LIMIT)

// Public routes (relaxed read limits)
router.get('/', readLimiter, validatePagination, communityController.listCommunities)
router.get('/:id', readLimiter, communityController.getCommunity)

// Protected routes (require authentication, stricter write limits)
router.post('/', communityWriteLimiter, authenticateToken, communityController.createCommunity)
router.put('/:id', communityWriteLimiter, authenticateToken, communityController.updateCommunity)
router.delete('/:id', communityWriteLimiter, authenticateToken, communityController.deleteCommunity)

// Member management routes (write limits)
router.post('/:id/members', communityWriteLimiter, authenticateToken, communityController.addMember)
router.delete('/:id/members/:userAddress', communityWriteLimiter, authenticateToken, communityController.removeMember)

// Admin management routes (write limits)
router.post('/:id/admins', communityWriteLimiter, authenticateToken, communityController.addAdmin)
router.delete('/:id/admins/:adminAddress', communityWriteLimiter, authenticateToken, communityController.removeAdmin)

// Analytics and leaderboard routes (read limits)
router.get('/:id/analytics', readLimiter, communityController.getAnalytics)
router.get('/:id/leaderboard', readLimiter, validatePagination, communityController.getLeaderboard)
router.get('/:id/members', readLimiter, validatePagination, communityController.getMembers)

export default router
