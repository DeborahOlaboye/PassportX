import { Router, Request, Response } from 'express';
import CommunityCreationService from '../services/communityCreationService';
import CommunityCreationNotificationService from '../services/communityCreationNotificationService';
import CommunityCacheService from '../services/communityCacheService';
import { CommunityCreationEvent } from '../services/communityCreationService';
import { authenticateToken } from '../middleware/auth';
import {
  validateWebhookSignature,
  getWebhookValidationConfig,
} from '../middleware/webhookValidation';
import { createRateLimiter } from '../middleware/rateLimiter';
import { COMMUNITY_WRITE_RATE_LIMIT } from '../config/rateLimits';
import { sendRouteError } from '../utils/routeError';
import logger from '../utils/logger';

const router = Router();

// Rate limiter for community creation operations (15 requests per 15 minutes)
const communityCreationLimiter = createRateLimiter(COMMUNITY_WRITE_RATE_LIMIT);

let communityCreationService: CommunityCreationService | null = null;
let notificationService: CommunityCreationNotificationService | null = null;
let cacheService: CommunityCacheService | null = null;

export function initializeCommunityCreationRoutes(
  _communityCreationService: CommunityCreationService,
  _notificationService: CommunityCreationNotificationService,
  _cacheService: CommunityCacheService
) {
  communityCreationService = _communityCreationService;
  notificationService = _notificationService;
  cacheService = _cacheService;
}

function validateCommunityCreationEvent(event: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!event || typeof event !== 'object') {
    errors.push('Event must be a valid object');
    return { valid: false, errors };
  }

  if (!event.communityId || typeof event.communityId !== 'string') {
    errors.push('communityId is required and must be a string');
  }

  if (!event.communityName || typeof event.communityName !== 'string') {
    errors.push('communityName is required and must be a string');
  }

  if (!event.ownerAddress || typeof event.ownerAddress !== 'string') {
    errors.push('ownerAddress is required and must be a string');
  }

  if (!event.contractAddress || typeof event.contractAddress !== 'string') {
    errors.push('contractAddress is required and must be a string');
  }

  if (!event.transactionHash || typeof event.transactionHash !== 'string') {
    errors.push('transactionHash is required and must be a string');
  }

  if (typeof event.blockHeight !== 'number' || event.blockHeight < 0) {
    errors.push('blockHeight must be a non-negative number');
  }

  if (typeof event.timestamp !== 'number' || event.timestamp < 0) {
    errors.push('timestamp must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

router.post(
  '/webhook/events',
  validateWebhookSignature(getWebhookValidationConfig()),
  async (req: Request, res: Response) => {
    try {
      if (!communityCreationService || !notificationService || !cacheService) {
        logger.warn('Community creation services not initialized', { requestId: req.requestId });
        return res.status(503).json({
          success: false,
          error: 'Community creation services not initialized',
          code: 'SERVICE_NOT_INITIALIZED',
        });
      }

      const event: CommunityCreationEvent = req.body;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'Request body is required',
          code: 'MISSING_REQUEST_BODY',
        });
      }

      const validation = validateCommunityCreationEvent(event);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid community creation event',
          details: validation.errors,
          code: 'VALIDATION_ERROR',
        });
      }

      const result =
        await communityCreationService.processCommunityCreationEvent(event);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.message,
          details: result.error,
          code: 'PROCESSING_ERROR',
        });
      }

      try {
        const notifications = await notificationService.buildNotificationBatch(
          event,
          [event.ownerAddress],
          { includeInstructions: true, includeDashboardLink: true }
        );

        cacheService.onCommunityCreated(event);

        res.status(201).json({
          success: true,
          communityId: result.communityId,
          message: result.message,
          notificationsSent: notifications.length,
          code: 'COMMUNITY_CREATED',
        });
      } catch (notificationError) {
        logger.error('Error sending notifications', { requestId: req.requestId, error: notificationError instanceof Error ? notificationError.message : String(notificationError) });
        res.status(201).json({
          success: true,
          communityId: result.communityId,
          message: result.message,
          notificationsSent: 0,
          warning: 'Community created but notification delivery failed',
          code: 'COMMUNITY_CREATED_NOTIFICATION_ERROR',
        });
      }
    } catch (error) {
      sendRouteError(req, res, 'Error processing community creation webhook', error);
    }
  }
);

router.post(
  '/sync',
  communityCreationLimiter,
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!communityCreationService) {
        return res.status(503).json({
          error: 'Community creation service not initialized',
        });
      }

      const {
        blockchainId,
        contractAddress,
        ownerAddress,
        communityName,
        description,
      } = req.body;

      if (
        !blockchainId ||
        !contractAddress ||
        !ownerAddress ||
        !communityName
      ) {
        return res.status(400).json({
          error:
            'Missing required fields: blockchainId, contractAddress, ownerAddress, communityName',
        });
      }

      const result = await communityCreationService.syncCommunityFromBlockchain(
        blockchainId,
        contractAddress,
        ownerAddress,
        communityName,
        description || ''
      );

      if (!result.success) {
        return res.status(400).json({
          error: result.message,
          details: result.error,
        });
      }

      if (cacheService) {
        cacheService.invalidatePattern('^communities:');
      }

      res.json({
        success: true,
        communityId: result.communityId,
        message: result.message,
      });
    } catch (error) {
      sendRouteError(req, res, 'Error syncing community from blockchain', error);
    }
  }
);

router.get('/status/:blockchainId', async (req: Request, res: Response) => {
  try {
    if (!communityCreationService) {
      return res.status(503).json({
        error: 'Community creation service not initialized',
      });
    }

    const { blockchainId } = req.params;
    const { contractAddress } = req.query;

    if (!blockchainId || !contractAddress) {
      return res.status(400).json({
        error: 'Missing required parameters: blockchainId, contractAddress',
      });
    }

    const community = await communityCreationService.getCommunityByBlockchainId(
      blockchainId,
      contractAddress as string
    );

    if (!community) {
      return res.status(404).json({
        error: 'Community not found',
        blockchainId,
        synced: false,
      });
    }

    res.json({
      success: true,
      synced: true,
      communityId: community._id,
      communityName: community.name,
      slug: community.slug,
      admin: community.admins[0],
      createdAt: community.createdAt,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error checking community sync status', error);
  }
});

router.post(
  '/notifications/test',
  communityCreationLimiter,
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!notificationService) {
        return res.status(503).json({
          error: 'Notification service not initialized',
        });
      }

      const { communityId, communityName, ownerAddress } = req.body;

      if (!communityId || !communityName || !ownerAddress) {
        return res.status(400).json({
          error:
            'Missing required fields: communityId, communityName, ownerAddress',
        });
      }

      const testEvent: CommunityCreationEvent = {
        communityId,
        communityName,
        description: 'Test community',
        ownerAddress,
        createdAtBlockHeight: 0,
        contractAddress:
          'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'test-tx-hash',
        blockHeight: 0,
        timestamp: Date.now(),
      };

      const notification = notificationService.createWelcomeNotification(
        testEvent,
        {
          includeInstructions: true,
          includeDashboardLink: true,
        }
      );

      if (!notificationService.validateNotificationPayload(notification)) {
        return res.status(400).json({
          error: 'Generated notification is invalid',
        });
      }

      res.json({
        success: true,
        notification,
      });
    } catch (error) {
      sendRouteError(req, res, 'Error generating test notification', error);
    }
  }
);

router.get('/cache/stats', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!cacheService) {
      return res.status(503).json({
        error: 'Cache service not initialized',
      });
    }

    const stats = cacheService.getStats();

    res.json({
      success: true,
      cache: stats,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error getting cache stats', error);
  }
});

router.post(
  '/cache/clear',
  authenticateToken,
  (req: Request, res: Response) => {
    try {
      if (!cacheService) {
        return res.status(503).json({
          error: 'Cache service not initialized',
        });
      }

      cacheService.clear();

      res.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      sendRouteError(req, res, 'Error clearing cache', error);
    }
  }
);

export default router;
