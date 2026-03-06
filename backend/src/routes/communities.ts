import { Router } from 'express';
import * as communityController from '../controllers/communityController';
import { authenticateToken } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  COMMUNITY_WRITE_RATE_LIMIT,
  API_READ_RATE_LIMIT,
} from '../config/rateLimits';

const router = Router();

// Rate limiters
const communityWriteLimiter = createRateLimiter(COMMUNITY_WRITE_RATE_LIMIT);
const readLimiter = createRateLimiter(API_READ_RATE_LIMIT);

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: List all communities
 *     description: Returns a paginated list of all active communities.
 *     tags: [Communities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of communities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Community'
 *   post:
 *     summary: Create a community
 *     description: Create a new community. The authenticated user becomes the creator and first admin.
 *     tags: [Communities]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description]
 *             properties:
 *               name: { type: string, example: "PassportX DAO" }
 *               description: { type: string, example: "The official PassportX community" }
 *     responses:
 *       201:
 *         description: Community created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Community'
 *       401:
 *         description: Authentication required
 */
// Public routes (relaxed read limits)
router.get(
  '/',
  readLimiter,
  validatePagination,
  communityController.listCommunities
);

/**
 * @swagger
 * /api/communities/{id}:
 *   get:
 *     summary: Get a community by ID
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Community details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Community'
 *       404:
 *         description: Community not found
 *   put:
 *     summary: Update a community
 *     tags: [Communities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Community updated
 *       403:
 *         description: Not authorized
 *   delete:
 *     summary: Delete a community
 *     tags: [Communities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Community deleted
 *       403:
 *         description: Not authorized
 */
router.get('/:id', readLimiter, communityController.getCommunity);

// Protected routes (require authentication, stricter write limits)
router.post(
  '/',
  communityWriteLimiter,
  authenticateToken,
  communityController.createCommunity
);
router.put(
  '/:id',
  communityWriteLimiter,
  authenticateToken,
  communityController.updateCommunity
);
router.delete(
  '/:id',
  communityWriteLimiter,
  authenticateToken,
  communityController.deleteCommunity
);

/**
 * @swagger
 * /api/communities/{id}/members:
 *   post:
 *     summary: Add a member to a community
 *     tags: [Communities]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userAddress]
 *             properties:
 *               userAddress: { type: string, example: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9" }
 *     responses:
 *       200:
 *         description: Member added
 *       403:
 *         description: Not authorized
 *   get:
 *     summary: Get community members
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of members
 */
// Member management routes (write limits)
router.post(
  '/:id/members',
  communityWriteLimiter,
  authenticateToken,
  communityController.addMember
);
router.delete(
  '/:id/members/:userAddress',
  communityWriteLimiter,
  authenticateToken,
  communityController.removeMember
);

/**
 * @swagger
 * /api/communities/{id}/analytics:
 *   get:
 *     summary: Get community analytics
 *     description: Returns badge issuance stats, member growth, and activity metrics for the community.
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Community analytics
 * /api/communities/{id}/leaderboard:
 *   get:
 *     summary: Get community leaderboard
 *     description: Returns members ranked by badge count and level.
 *     tags: [Communities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Leaderboard entries
 */
// Admin management routes (write limits)
router.post(
  '/:id/admins',
  communityWriteLimiter,
  authenticateToken,
  communityController.addAdmin
);
router.delete(
  '/:id/admins/:adminAddress',
  communityWriteLimiter,
  authenticateToken,
  communityController.removeAdmin
);

// Analytics and leaderboard routes (read limits)
router.get('/:id/analytics', readLimiter, communityController.getAnalytics);
router.get(
  '/:id/leaderboard',
  readLimiter,
  validatePagination,
  communityController.getLeaderboard
);
router.get(
  '/:id/members',
  readLimiter,
  validatePagination,
  communityController.getMembers
);

export default router;
