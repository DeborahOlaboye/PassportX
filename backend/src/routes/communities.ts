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

export default router
