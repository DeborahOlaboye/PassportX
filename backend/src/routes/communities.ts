import { Router } from 'express'
import * as communityController from '../controllers/communityController'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public routes
router.get('/', communityController.listCommunities)
router.get('/:id', communityController.getCommunity)

// Protected routes (require authentication)
router.post('/', authenticate, communityController.createCommunity)
router.put('/:id', authenticate, communityController.updateCommunity)
router.delete('/:id', authenticate, communityController.deleteCommunity)

export default router
