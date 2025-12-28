import express from 'express'
import verificationService from '../services/verificationService'
import { IVerificationResponse } from '../types'

const router = express.Router()

/**
 * POST /api/verify/badge
 * Verify a single badge
 */
router.post('/badge', async (req, res) => {
  try {
    const { badgeId, claimedOwner } = req.body

    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'Badge ID is required'
      } as IVerificationResponse)
    }

    const verification = await verificationService.verifyBadge(badgeId, claimedOwner)

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found'
      } as IVerificationResponse)
    }

    res.json({
      success: true,
      verification
    } as IVerificationResponse)
  } catch (error) {
    console.error('Error verifying badge:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as IVerificationResponse)
  }
})

/**
 * GET /api/verify/badge/:badgeId
 * Get verification status for a badge
 */
router.get('/badge/:badgeId', async (req, res) => {
  try {
    const { badgeId } = req.params

    const verification = await verificationService.verifyBadge(badgeId)

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found'
      } as IVerificationResponse)
    }

    res.json({
      success: true,
      verification
    } as IVerificationResponse)
  } catch (error) {
    console.error('Error getting verification status:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as IVerificationResponse)
  }
})

/**
 * GET /api/verify/public/:badgeId
 * Get public verification info (for sharing)
 */
router.get('/public/:badgeId', async (req, res) => {
  try {
    const { badgeId } = req.params

    const publicInfo = await verificationService.getPublicVerificationInfo(badgeId)

    if (!publicInfo) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found'
      })
    }

    res.json({
      success: true,
      data: publicInfo
    })
  } catch (error) {
    console.error('Error getting public verification info:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * POST /api/verify/batch
 * Verify multiple badges
 */
router.post('/batch', async (req, res) => {
  try {
    const { badgeIds } = req.body

    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Badge IDs array is required'
      })
    }

    if (badgeIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 badges can be verified at once'
      })
    }

    const verifications = await verificationService.verifyBadgeBatch(badgeIds)

    res.json({
      success: true,
      verifications,
      count: verifications.length
    })
  } catch (error) {
    console.error('Error verifying badges in batch:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/verify/user/:address
 * Verify all badges for a user
 */
router.get('/user/:address', async (req, res) => {
  try {
    const { address } = req.params

    const verifications = await verificationService.verifyUserBadges(address)

    res.json({
      success: true,
      verifications,
      count: verifications.length
    })
  } catch (error) {
    console.error('Error verifying user badges:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/verify/blockchain/:badgeId
 * Check if badge is verified on blockchain
 */
router.get('/blockchain/:badgeId', async (req, res) => {
  try {
    const { badgeId } = req.params

    const isVerified = await verificationService.checkBlockchainVerification(badgeId)

    res.json({
      success: true,
      verified: isVerified
    })
  } catch (error) {
    console.error('Error checking blockchain verification:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

export default router
