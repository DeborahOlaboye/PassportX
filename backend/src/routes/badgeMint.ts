import { Router, Request, Response } from 'express';
import BadgeMintService from '../services/badgeMintService';
import BadgeMintNotificationService from '../services/badgeMintNotificationService';
import BadgeCacheService from '../services/badgeCacheService';
import { BadgeMintEvent } from '../chainhook/types/handlers';
import { authenticateToken } from '../middleware/auth';
import { validateWebhookSignature, getWebhookValidationConfig } from '../middleware/webhookValidation';

const router = Router();

let badgeMintService: BadgeMintService | null = null;
let notificationService: BadgeMintNotificationService | null = null;
let cacheService: BadgeCacheService | null = null;

export function initializeBadgeMintRoutes(
  _badgeMintService: BadgeMintService,
  _notificationService: BadgeMintNotificationService,
  _cacheService: BadgeCacheService
) {
  badgeMintService = _badgeMintService;
  notificationService = _notificationService;
  cacheService = _cacheService;
}

function validateBadgeMintEvent(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!event || typeof event !== 'object') {
    errors.push('Event must be a valid object');
    return { valid: false, errors };
  }

  if (!event.userId || typeof event.userId !== 'string') {
    errors.push('userId is required and must be a string');
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

  if (event.badgeName && typeof event.badgeName !== 'string') {
    errors.push('badgeName must be a string if provided');
  }

  if (event.criteria && typeof event.criteria !== 'string') {
    errors.push('criteria must be a string if provided');
  }

  return { valid: errors.length === 0, errors };
}

router.post('/webhook/mint', validateWebhookSignature(getWebhookValidationConfig()), async (req: Request, res: Response) => {
  try {
    if (!badgeMintService || !notificationService || !cacheService) {
      console.error('Badge mint services not initialized');
      return res.status(503).json({
        success: false,
        error: 'Badge mint services not initialized',
        code: 'SERVICE_NOT_INITIALIZED'
      });
    }

    const event: BadgeMintEvent = req.body;

    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required',
        code: 'MISSING_REQUEST_BODY'
      });
    }

    const validation = validateBadgeMintEvent(event);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid badge mint event',
        details: validation.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const result = await badgeMintService.processBadgeMintEvent(event);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
        details: result.error,
        code: 'PROCESSING_ERROR'
      });
    }

    try {
      const notifications = await notificationService.buildNotificationBatch(
        event,
        [event.userId],
        [],
        { includeInstructions: true, includePassportLink: true, includeCommunityLink: false }
      );

      cacheService.onBadgeMinted(event);

      res.status(201).json({
        success: true,
        badgeId: result.badgeId,
        message: result.message,
        notificationsSent: notifications.length,
        code: 'BADGE_MINTED'
      });
    } catch (notificationError) {
      console.error('Error sending badge mint notifications:', notificationError);
      res.status(201).json({
        success: true,
        badgeId: result.badgeId,
        message: result.message,
        notificationsSent: 0,
        warning: 'Badge minted but notification delivery failed',
        code: 'BADGE_MINTED_NOTIFICATION_ERROR'
      });
    }
  } catch (error) {
    console.error('Error processing badge mint webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process badge mint event',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

router.post('/sync', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!badgeMintService) {
      return res.status(503).json({
        error: 'Badge mint service not initialized'
      });
    }

    const { badgeId, contractAddress, recipientAddress, badgeName, criteria } = req.body;

    if (!badgeId || !contractAddress || !recipientAddress || !badgeName) {
      return res.status(400).json({
        error: 'Missing required fields: badgeId, contractAddress, recipientAddress, badgeName'
      });
    }

    const result = await badgeMintService.syncBadgeFromBlockchain(
      badgeId,
      contractAddress,
      recipientAddress,
      badgeName,
      criteria || 'completing a task'
    );

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
        details: result.error
      });
    }

    if (cacheService) {
      cacheService.invalidatePattern('^badges:');
      cacheService.invalidatePattern(`^passport:${recipientAddress}`);
    }

    res.json({
      success: true,
      badgeId: result.badgeId,
      message: result.message
    });
  } catch (error) {
    console.error('Error syncing badge from blockchain:', error);
    res.status(500).json({
      error: 'Failed to sync badge from blockchain',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/status/:badgeId', async (req: Request, res: Response) => {
  try {
    if (!badgeMintService) {
      return res.status(503).json({
        error: 'Badge mint service not initialized'
      });
    }

    const { badgeId } = req.params;
    const { contractAddress } = req.query;

    if (!badgeId || !contractAddress) {
      return res.status(400).json({
        error: 'Missing required parameters: badgeId, contractAddress'
      });
    }

    return res.json({
      success: true,
      badgeId,
      contractAddress,
      message: 'Badge minting is active and monitoring for minting events'
    });
  } catch (error) {
    console.error('Error checking badge mint status:', error);
    res.status(500).json({
      error: 'Failed to check badge mint status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/notifications/test', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!notificationService) {
      return res.status(503).json({
        error: 'Notification service not initialized'
      });
    }

    const { badgeId, badgeName, userId, criteria } = req.body;

    if (!badgeId || !badgeName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: badgeId, badgeName, userId'
      });
    }

    const testEvent: BadgeMintEvent = {
      badgeId,
      badgeName,
      userId,
      criteria: criteria || 'completing a task',
      contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
      transactionHash: 'test-tx-hash',
      blockHeight: 0,
      timestamp: Date.now()
    };

    const notification = notificationService.createBadgeMintNotification(testEvent, {
      includeInstructions: true,
      includePassportLink: true,
      includeCommunityLink: false
    });

    if (!notificationService.validateNotificationPayload(notification)) {
      return res.status(400).json({
        error: 'Generated notification is invalid'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error generating test badge mint notification:', error);
    res.status(500).json({
      error: 'Failed to generate test notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/cache/stats', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!cacheService) {
      return res.status(503).json({
        error: 'Cache service not initialized'
      });
    }

    const stats = cacheService.getStats();

    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    console.error('Error getting badge cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/cache/clear', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!cacheService) {
      return res.status(503).json({
        error: 'Cache service not initialized'
      });
    }

    cacheService.clear();

    res.json({
      success: true,
      message: 'Badge cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing badge cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/audit-logs', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!badgeMintService) {
      return res.status(503).json({
        error: 'Badge mint service not initialized'
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const logs = badgeMintService.getAuditLogs(limit, offset);

    res.json({
      success: true,
      logs,
      count: logs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/audit-logs/user/:userId', authenticateToken, (req: Request, res: Response) => {
  try {
    if (!badgeMintService) {
      return res.status(503).json({
        error: 'Badge mint service not initialized'
      });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'userId is required'
      });
    }

    const logs = badgeMintService.getAuditLogsByRecipient(userId);

    res.json({
      success: true,
      logs,
      count: logs.length,
      userId
    });
  } catch (error) {
    console.error('Error retrieving user audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
