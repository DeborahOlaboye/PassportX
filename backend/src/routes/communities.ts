import { Router } from 'express'
import * as communityController from '../controllers/communityController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Public routes
router.get('/', communityController.listCommunities)
router.get('/:id', communityController.getCommunity)

// Protected routes (require authentication)
router.post('/', authenticateToken, communityController.createCommunity)
router.put('/:id', authenticateToken, communityController.updateCommunity)
router.delete('/:id', authenticateToken, communityController.deleteCommunity)

// Member management routes
router.post('/:id/members', authenticateToken, communityController.addMember)
router.delete('/:id/members/:userAddress', authenticateToken, communityController.removeMember)

// Admin management routes
router.post('/:id/admins', authenticateToken, communityController.addAdmin)
router.delete('/:id/admins/:adminAddress', authenticateToken, communityController.removeAdmin)

// Analytics and leaderboard routes
router.get('/:id/analytics', communityController.getAnalytics)
router.get('/:id/leaderboard', communityController.getLeaderboard)

export default router
