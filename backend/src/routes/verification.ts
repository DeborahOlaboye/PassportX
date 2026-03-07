import express from 'express';
import verificationService from '../services/verificationService';
import { IVerificationResponse } from '../types';
import { verificationRateLimit } from '../middleware/verificationValidation';

const router = express.Router();

const verificationLimiter = verificationRateLimit;

/**
 * @swagger
 * /api/verify/badge:
 *   post:
 *     summary: Verify a badge
 *     description: Verify the authenticity and ownership of a badge. Optionally provide a claimedOwner address to check ownership.
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [badgeId]
 *             properties:
 *               badgeId: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *               claimedOwner: { type: string, example: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9" }
 *     responses:
 *       200:
 *         description: Verification result
 *       400:
 *         description: Badge ID is required
 *       404:
 *         description: Badge not found
 */
router.post('/badge', verificationLimiter, async (req, res) => {
  try {
    const { badgeId, claimedOwner } = req.body;

    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'Badge ID is required',
      } as IVerificationResponse);
    }

    const verification = await verificationService.verifyBadge(
      badgeId,
      claimedOwner
    );

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      } as IVerificationResponse);
    }

    res.json({
      success: true,
      verification,
    } as IVerificationResponse);
  } catch (error) {
    console.error('Error verifying badge:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as IVerificationResponse);
  }
});

/**
 * @swagger
 * /api/verify/badge/{badgeId}:
 *   get:
 *     summary: Get badge verification status
 *     description: Get the verification status of a badge by its ID.
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Verification status
 *       404:
 *         description: Badge not found
 */
router.get('/badge/:badgeId', verificationLimiter, async (req, res) => {
  try {
    const { badgeId } = req.params;

    const verification = await verificationService.verifyBadge(badgeId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      } as IVerificationResponse);
    }

    res.json({
      success: true,
      verification,
    } as IVerificationResponse);
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    } as IVerificationResponse);
  }
});

/**
 * @swagger
 * /api/verify/public/{badgeId}:
 *   get:
 *     summary: Get public verification info
 *     description: Returns shareable public verification details for a badge.
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public verification info
 *       404:
 *         description: Badge not found
 */
router.get('/public/:badgeId', verificationLimiter, async (req, res) => {
  try {
    const { badgeId } = req.params;

    const publicInfo = await verificationService.getPublicVerificationInfo(
      badgeId
    );

    if (!publicInfo) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found',
      });
    }

    res.json({
      success: true,
      data: publicInfo,
    });
  } catch (error) {
    console.error('Error getting public verification info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/verify/batch:
 *   post:
 *     summary: Batch verify badges
 *     description: Verify up to 50 badges in a single request.
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [badgeIds]
 *             properties:
 *               badgeIds:
 *                 type: array
 *                 items: { type: string }
 *                 maxItems: 50
 *     responses:
 *       200:
 *         description: Batch verification results
 *       400:
 *         description: Invalid input or exceeds 50 badge limit
 * /api/verify/user/{address}:
 *   get:
 *     summary: Verify all badges for a user
 *     description: Returns verification status for all badges owned by a user.
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Verification results for all user badges
 * /api/verify/blockchain/{badgeId}:
 *   get:
 *     summary: Check on-chain badge verification
 *     description: Check whether a badge has been verified on the Stacks blockchain.
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: On-chain verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 verified: { type: boolean }
 */
router.post('/batch', verificationLimiter, async (req, res) => {
  try {
    const { badgeIds } = req.body;

    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Badge IDs array is required',
      });
    }

    if (badgeIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 badges can be verified at once',
      });
    }

    const verifications = await verificationService.verifyBadgeBatch(badgeIds);

    res.json({
      success: true,
      verifications,
      count: verifications.length,
    });
  } catch (error) {
    console.error('Error verifying badges in batch:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/verify/user/:address
 * Verify all badges for a user
 */
router.get('/user/:address', verificationLimiter, async (req, res) => {
  try {
    const { address } = req.params;

    const verifications = await verificationService.verifyUserBadges(address);

    res.json({
      success: true,
      verifications,
      count: verifications.length,
    });
  } catch (error) {
    console.error('Error verifying user badges:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/verify/blockchain/:badgeId
 * Check if badge is verified on blockchain
 */
router.get('/blockchain/:badgeId', verificationLimiter, async (req, res) => {
  try {
    const { badgeId } = req.params;

    const isVerified = await verificationService.checkBlockchainVerification(
      badgeId
    );

    res.json({
      success: true,
      verified: isVerified,
    });
  } catch (error) {
    console.error('Error checking blockchain verification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
