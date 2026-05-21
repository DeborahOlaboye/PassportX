import { Router, Request, Response } from 'express';
import BadgeTemplate from '../models/BadgeTemplate';
import Badge from '../models/Badge';
import Community from '../models/Community';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import {
  AuthRequest,
  IPopulatedBadge,
  IPopulatedBadgeTemplate,
} from '../types';
import { updateMemberCount } from '../services/communityService';
import { issueSingleBadge } from '../services/badgeService';
import logger from '../utils/logger';
import BadgeMetadataCacheInvalidator from '../services/badgeMetadataCacheInvalidator';
import BadgeUIRefreshService from '../services/badgeUIRefreshService';
import { BadgeMetadataUpdateEvent } from '../chainhook/types/handlers';
import {
  validateWebhookSignature,
  getWebhookValidationConfig,
} from '../middleware/webhookValidation';
import { isValidStacksAddress } from '../utils/addressValidation';
import { createRateLimiter } from '../middleware/rateLimiter';
import { BADGE_ISSUANCE_RATE_LIMIT } from '../config/rateLimits';
import { isValidObjectId } from '../utils/routeValidation';

const router = Router();

/** Maximum number of recipients allowed in a single batch-issuance request. */
const MAX_BATCH_SIZE = 100;

// Rate limiter for badge issuance operations (20 requests per 15 minutes)
const badgeIssuanceLimiter = createRateLimiter(BADGE_ISSUANCE_RATE_LIMIT);

let cacheInvalidator: BadgeMetadataCacheInvalidator | null = null;
let uiRefreshService: BadgeUIRefreshService | null = null;

export function initializeBadgeMetadataRoutes(
  _cacheInvalidator: BadgeMetadataCacheInvalidator,
  _uiRefreshService: BadgeUIRefreshService
) {
  cacheInvalidator = _cacheInvalidator;
  uiRefreshService = _uiRefreshService;
}

/**
 * @swagger
 * /api/badges/templates:
 *   post:
 *     summary: Create a badge template
 *     description: Create a new badge template for a community. Requires community admin privileges.
 *     tags: [Badges]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, category, level, communityId]
 *             properties:
 *               name: { type: string, example: "Early Contributor" }
 *               description: { type: string, example: "Awarded to early contributors" }
 *               category: { type: string, example: "contribution" }
 *               level: { type: integer, example: 1 }
 *               icon: { type: string, example: "trophy" }
 *               requirements: { type: string, example: "Must contribute 5+ PRs" }
 *               communityId: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *     responses:
 *       201:
 *         description: Badge template created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadgeTemplate'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Only community admins can create templates
 *       404:
 *         description: Community not found
 */
router.post(
  '/templates',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const {
        name,
        description,
        category,
        level,
        icon,
        requirements,
        communityId,
      } = req.body;

      if (!name || !description || !category || !level || !communityId) {
        throw createError('Missing required fields', 400);
      }

      const community = await Community.findById(communityId);
      if (!community || !community.isActive) {
        throw createError('Community not found', 404);
      }

      if (!community.admins.includes(req.user!.stacksAddress)) {
        throw createError(
          'Only community admin can create badge templates',
          403
        );
      }

      const template = new BadgeTemplate({
        name,
        description,
        category,
        level,
        icon: icon || '🏆',
        requirements,
        community: communityId,
        creator: req.user!.stacksAddress,
      });

      await template.save();

      // Add template to community
      community.badgeTemplates.push(template._id as any);
      await community.save();

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
        createdAt: template.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/badges/templates/community/{communityId}:
 *   get:
 *     summary: Get badge templates for a community
 *     description: Returns all active badge templates belonging to a given community.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64a1b2c3d4e5f6a7b8c9d0e1
 *     responses:
 *       200:
 *         description: List of badge templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BadgeTemplate'
 */
router.get(
  '/templates/community/:communityId',
  validatePagination,
  async (req, res, next) => {
    try {
      const { communityId } = req.params;

      if (!isValidObjectId(communityId)) {
        return res.status(400).json({ error: 'Invalid communityId format' });
      }

      const templates = await BadgeTemplate.find({
        community: communityId,
        isActive: true,
      }).sort({ createdAt: -1 });

      res.json(
        templates.map((template) => ({
          id: template._id,
          name: template.name,
          description: template.description,
          category: template.category,
          level: template.level,
          icon: template.icon,
          requirements: template.requirements,
          creator: template.creator,
          createdAt: template.createdAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/badges/issue:
 *   post:
 *     summary: Issue a badge to a user
 *     description: Issue a badge from a template to a recipient. Only community admins can issue badges.
 *     tags: [Badges]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [templateId, recipientAddress]
 *             properties:
 *               templateId: { type: string, example: "64a1b2c3d4e5f6a7b8c9d0e1" }
 *               recipientAddress: { type: string, example: "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9" }
 *               transactionId: { type: string, example: "0xabc123" }
 *               tokenId: { type: string, example: "token-001" }
 *     responses:
 *       201:
 *         description: Badge issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Badge'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Only community admins can issue badges
 *       409:
 *         description: Badge already issued to this user
 */
router.post(
  '/issue',
  badgeIssuanceLimiter,
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const { templateId, recipientAddress, transactionId, tokenId } = req.body;

      if (!templateId || !recipientAddress) {
        throw createError(
          'Template ID and recipient address are required',
          400
        );
      }

      if (typeof templateId !== 'string' || templateId.trim() === '') {
        throw createError('templateId must be a non-empty string', 400);
      }

      if (!isValidObjectId(templateId)) {
        throw createError('templateId must be a valid ObjectId', 400);
      }

      if (!isValidStacksAddress(recipientAddress)) {
        throw createError(
          'recipientAddress is not a valid Stacks address',
          400
        );
      }

      if (
        transactionId !== undefined &&
        (typeof transactionId !== 'string' || transactionId.length > 256)
      ) {
        throw createError(
          'transactionId must be a string of at most 256 characters',
          400
        );
      }

      if (
        tokenId !== undefined &&
        (typeof tokenId !== 'string' || tokenId.length > 128)
      ) {
        throw createError(
          'tokenId must be a string of at most 128 characters',
          400
        );
      }

      const template = (await BadgeTemplate.findById(templateId).populate(
        'community'
      )) as IPopulatedBadgeTemplate | null;
      if (!template || !template.isActive) {
        throw createError('Badge template not found', 404);
      }

      const community = template.community;
      if (!community.admins.includes(req.user!.stacksAddress)) {
        throw createError('Only community admin can issue badges', 403);
      }

      // Check if badge already issued to this user
      const existingBadge = await Badge.findOne({
        templateId,
        owner: recipientAddress,
      });

      if (existingBadge) {
        throw createError('Badge already issued to this user', 409);
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
          timestamp: Math.floor(Date.now() / 1000),
        },
      });

      await badge.save();

      // Update community member count
      await updateMemberCount(String(community._id));

      res.status(201).json({
        id: badge._id,
        templateId: badge.templateId,
        owner: badge.owner,
        issuer: badge.issuer,
        community: community._id,
        tokenId: badge.tokenId,
        transactionId: badge.transactionId,
        issuedAt: badge.issuedAt,
        metadata: badge.metadata,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/badges/{id}:
 *   get:
 *     summary: Get a badge by ID
 *     description: Retrieve full badge details including template and community info.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 64a1b2c3d4e5f6a7b8c9d0e1
 *     responses:
 *       200:
 *         description: Badge details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Badge'
 *       404:
 *         description: Badge not found
 *   delete:
 *     summary: Revoke a badge
 *     description: Permanently revoke (delete) a badge. Only community admins can revoke badges.
 *     tags: [Badges]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Badge revoked successfully
 *       403:
 *         description: Only community admins can revoke badges
 *       404:
 *         description: Badge not found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const badge = (await Badge.findById(req.params.id)
      .populate('templateId')
      .populate('community')) as IPopulatedBadge | null;

    if (!badge) {
      throw createError('Badge not found', 404);
    }

    res.json({
      id: badge._id,
      name: badge.templateId.name,
      description: badge.templateId.description,
      community: badge.community.name,
      owner: badge.owner,
      issuer: badge.issuer,
      level: badge.metadata.level,
      category: badge.metadata.category,
      icon: badge.templateId.icon,
      issuedAt: badge.issuedAt,
      tokenId: badge.tokenId,
      transactionId: badge.transactionId,
    });
  } catch (error) {
    next(error);
  }
});

// Update badge template
router.put(
  '/templates/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const template = (await BadgeTemplate.findById(req.params.id).populate(
        'community'
      )) as IPopulatedBadgeTemplate | null;

      if (!template || !template.isActive) {
        throw createError('Badge template not found', 404);
      }

      const community = template.community;
      if (!community.admins.includes(req.user!.stacksAddress)) {
        throw createError(
          'Only community admin can update badge templates',
          403
        );
      }

      const { name, description, requirements, icon } = req.body;

      if (name) template.name = name;
      if (description) template.description = description;
      if (requirements !== undefined) template.requirements = requirements;
      if (icon) template.icon = icon;

      await template.save();

      res.json({
        id: template._id,
        name: template.name,
        description: template.description,
        category: template.category,
        level: template.level,
        icon: template.icon,
        requirements: template.requirements,
        creator: template.creator,
        createdAt: template.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Batch issue badges to multiple users
router.post(
  '/issue/batch',
  badgeIssuanceLimiter,
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const { templateId, recipientAddresses, transactionId } = req.body;

      if (
        !templateId ||
        !recipientAddresses ||
        !Array.isArray(recipientAddresses)
      ) {
        throw createError(
          'Template ID and recipient addresses array are required',
          400
        );
      }

      if (typeof templateId !== 'string' || templateId.trim() === '') {
        throw createError('templateId must be a non-empty string', 400);
      }

      if (!isValidObjectId(templateId)) {
        throw createError('templateId must be a valid ObjectId', 400);
      }

      if (
        transactionId !== undefined &&
        (typeof transactionId !== 'string' || transactionId.length > 256)
      ) {
        throw createError(
          'transactionId must be a string of at most 256 characters',
          400
        );
      }

      if (recipientAddresses.length === 0) {
        throw createError('recipientAddresses must be a non-empty array', 400);
      }

      if (recipientAddresses.length > MAX_BATCH_SIZE) {
        throw createError(
          `Batch size cannot exceed ${MAX_BATCH_SIZE} recipients`,
          400
        );
      }

      // Pre-flight: every element must be a non-empty string before any DB write
      const nonStringIndex = recipientAddresses.findIndex(
        (addr) => typeof addr !== 'string' || addr.trim() === ''
      );
      if (nonStringIndex !== -1) {
        throw createError(
          `recipientAddresses[${nonStringIndex}] must be a non-empty string`,
          400
        );
      }

      // Pre-flight: validate Stacks address format for all elements
      const invalidAddressIndex = recipientAddresses.findIndex(
        (addr) => !isValidStacksAddress(addr)
      );
      if (invalidAddressIndex !== -1) {
        throw createError(
          `recipientAddresses[${invalidAddressIndex}] is not a valid Stacks address`,
          400
        );
      }

      // Deduplicate within the request to avoid double-writes
      const uniqueAddresses = [...new Set(recipientAddresses as string[])];

      const template = (await BadgeTemplate.findById(templateId).populate(
        'community'
      )) as IPopulatedBadgeTemplate | null;
      if (!template || !template.isActive) {
        throw createError('Badge template not found', 404);
      }

      const community = template.community;
      if (!community.admins.includes(req.user!.stacksAddress)) {
        throw createError('Only community admin can issue badges', 403);
      }

      const results = [];
      const errors = [];

      for (const recipientAddress of uniqueAddresses) {
        try {
          const issued = await issueSingleBadge(
            template,
            recipientAddress,
            req.user!.stacksAddress,
            transactionId
          );
          results.push({ ...issued, success: true });
        } catch (error: unknown) {
          errors.push({
            recipientAddress,
            error:
              error instanceof Error ? error.message : 'Failed to issue badge',
          });
        }
      }

      // Update community member count
      await updateMemberCount(String(community._id));

      res.status(201).json({
        success: true,
        issued: results.length,
        failed: errors.length,
        results,
        errors,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Revoke badge
router.delete(
  '/:id',
  badgeIssuanceLimiter,
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const badge = (await Badge.findById(req.params.id).populate(
        'community'
      )) as IPopulatedBadge | null;

      if (!badge) {
        throw createError('Badge not found', 404);
      }

      const community = badge.community;
      if (!community.admins.includes(req.user!.stacksAddress)) {
        throw createError('Only community admin can revoke badges', 403);
      }

      await Badge.findByIdAndDelete(req.params.id);

      // Update community member count
      await updateMemberCount(String(community._id));

      res.json({ message: 'Badge revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Webhook: Handle badge metadata updates
router.post(
  '/webhook/metadata',
  validateWebhookSignature(getWebhookValidationConfig()),
  async (req: Request, res: Response) => {
    try {
      if (!cacheInvalidator || !uiRefreshService) {
        logger.error('Badge metadata services not initialized');
        return res.status(503).json({
          success: false,
          error: 'Badge metadata services not initialized',
          code: 'SERVICE_NOT_INITIALIZED',
        });
      }

      const event: BadgeMetadataUpdateEvent = req.body;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'Request body is required',
          code: 'MISSING_REQUEST_BODY',
        });
      }

      if (!event.badgeId || !event.transactionHash) {
        return res.status(400).json({
          success: false,
          error: 'badgeId and transactionHash are required',
          code: 'VALIDATION_ERROR',
        });
      }

      await cacheInvalidator.invalidateBadgeCache({
        badgeId: event.badgeId,
        changedFields: [],
        timestamp: event.timestamp || Date.now(),
        transactionHash: event.transactionHash,
        blockHeight: event.blockHeight || 0,
      });

      await uiRefreshService.notifyBadgeMetadataUpdate(
        event.badgeId,
        event.category ? ['category'] : [],
        {
          transactionHash: event.transactionHash,
          blockHeight: event.blockHeight,
        }
      );

      res.json({
        success: true,
        message: 'Badge metadata update processed successfully',
        badgeId: event.badgeId,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Error processing badge metadata webhook', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to process badge metadata update',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'PROCESSING_ERROR',
      });
    }
  }
);

export default router;
