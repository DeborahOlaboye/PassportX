import express, { Request, Response } from 'express';
import {
  AccessControlEventType,
  AnyAccessControlEvent,
} from '../types/accessControl';
import AccessControlEventHandler from '../services/AccessControlEventHandler';
import AccessControlAuditService from '../services/AccessControlAuditService';
import AccessControlSecurityMonitor from '../services/AccessControlSecurityMonitor';
import { createRateLimiter } from '../middleware/rateLimiter';
import { sendRouteError } from '../utils/routeError';
import { API_READ_RATE_LIMIT } from '../config/rateLimits';

const router = express.Router();

// Rate limiter for read-only audit and security endpoints
const auditReadLimiter = createRateLimiter(API_READ_RATE_LIMIT);

/** Validates that the incoming chainhook event body is a non-null object. */
function validateWebhookBody(body: unknown): body is Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

/**
 * Webhook endpoints for Chainhook access control events
 */

/**
 * POST /access-control/webhook/global-permission
 * Handle global permission change events
 */
router.post(
  '/webhook/global-permission',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      // Transform Chainhook event to AccessControlEvent
      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.GLOBAL_PERMISSION_SET
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing global permission webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/community-permission
 * Handle community permission change events
 */
router.post(
  '/webhook/community-permission',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.COMMUNITY_PERMISSION_SET
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing community permission webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/user-suspended
 * Handle user suspension events
 */
router.post('/webhook/user-suspended', async (req: Request, res: Response) => {
  try {
    if (!validateWebhookBody(req.body)) {
      return res
        .status(400)
        .json({ error: 'Request body must be a JSON object' });
    }
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.USER_SUSPENDED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    sendRouteError(req, res, 'Access control route error', error);
  }
});

/**
 * POST /access-control/webhook/user-unsuspended
 * Handle user unsuspension events
 */
router.post(
  '/webhook/user-unsuspended',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.USER_UNSUSPENDED
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing user unsuspension webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/issuer-authorized
 * Handle issuer authorization events
 */
router.post(
  '/webhook/issuer-authorized',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.ISSUER_AUTHORIZED
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing issuer authorization webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/issuer-revoked
 * Handle issuer revocation events
 */
router.post('/webhook/issuer-revoked', async (req: Request, res: Response) => {
  try {
    if (!validateWebhookBody(req.body)) {
      return res
        .status(400)
        .json({ error: 'Request body must be a JSON object' });
    }
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.ISSUER_REVOKED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    sendRouteError(req, res, 'Access control route error', error);
  }
});

/**
 * POST /access-control/webhook/permission-group-created
 * Handle permission group creation events
 */
router.post(
  '/webhook/permission-group-created',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.PERMISSION_GROUP_CREATED
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing permission group creation webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/member-role-changed
 * Handle community member role change events
 */
router.post(
  '/webhook/member-role-changed',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      // Determine if it's an assignment or revocation based on the payload
      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.ROLE_ASSIGNED
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing member role change webhook', error);
    }
  }
);

/**
 * POST /access-control/webhook/ownership-transferred
 * Handle community ownership transfer events
 */
router.post(
  '/webhook/ownership-transferred',
  async (req: Request, res: Response) => {
    try {
      const chainhookEvent = req.body;

      const event: AnyAccessControlEvent = transformChainhookEvent(
        chainhookEvent,
        AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED
      );

      await AccessControlEventHandler.handleEvent(event);

      res.status(200).json({ success: true });
    } catch (error) {
      sendRouteError(req, res, 'Error processing ownership transfer webhook', error);
    }
  }
);

/**
 * API endpoints for audit logs and monitoring
 */

/**
 * GET /access-control/audit/logs
 * Query audit logs
 */
router.get('/audit/logs', async (req: Request, res: Response) => {
  try {
    const filters = {
      principal: req.query.principal as string,
      targetPrincipal: req.query.targetPrincipal as string,
      communityId: req.query.communityId as string,
      eventType: req.query.eventType as AccessControlEventType,
      suspicious: req.query.suspicious === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const logs = await AccessControlAuditService.queryLogs(filters);
    res.json(logs);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching audit logs', error);
  }
});

/**
 * GET /access-control/audit/statistics
 * Get audit statistics
 */
router.get(
  '/audit/statistics',
  auditReadLimiter,
  async (req: Request, res: Response) => {
    try {
      const stats = await AccessControlAuditService.getStatistics();
      res.json(stats);
    } catch (error) {
      sendRouteError(req, res, 'Access control route error', error);
    }
  }
);

/**
 * GET /access-control/audit/suspicious
 * Get suspicious activity
 */
router.get(
  '/audit/suspicious',
  auditReadLimiter,
  async (req: Request, res: Response) => {
    try {
      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit =
        isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);
      const logs = await AccessControlAuditService.getSuspiciousActivity(limit);
      res.json(logs);
    } catch (error) {
      sendRouteError(req, res, 'Access control route error', error);
    }
  }
);

/**
 * GET /access-control/audit/user/:principal
 * Get user's access control history
 */
router.get(
  '/audit/user/:principal',
  auditReadLimiter,
  async (req: Request, res: Response) => {
    try {
      const { principal } = req.params;
      if (
        !principal ||
        typeof principal !== 'string' ||
        principal.trim() === ''
      ) {
        return res.status(400).json({ error: 'principal is required' });
      }
      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit =
        isNaN(rawLimit) || rawLimit < 1 ? 100 : Math.min(rawLimit, 500);
      const history = await AccessControlAuditService.getUserHistory(
        principal.trim(),
        limit
      );
      res.json(history);
    } catch (error) {
      sendRouteError(req, res, 'Access control route error', error);
    }
  }
);

/**
 * GET /access-control/audit/community/:communityId
 * Get community's access control history
 */
router.get(
  '/audit/community/:communityId',
  async (req: Request, res: Response) => {
    try {
      const { communityId } = req.params;
      if (
        !communityId ||
        typeof communityId !== 'string' ||
        communityId.trim() === ''
      ) {
        return res.status(400).json({ error: 'communityId is required' });
      }
      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit =
        isNaN(rawLimit) || rawLimit < 1 ? 100 : Math.min(rawLimit, 500);
      const history = await AccessControlAuditService.getCommunityHistory(
        communityId,
        limit
      );
      res.json(history);
    } catch (error) {
      sendRouteError(req, res, 'Error fetching community history', error);
    }
  }
);

/**
 * GET /access-control/audit/export
 * Export audit logs
 */
router.get('/audit/export', async (req: Request, res: Response) => {
  try {
    const filters = {
      principal: req.query.principal as string,
      communityId: req.query.communityId as string,
      eventType: req.query.eventType as AccessControlEventType,
    };

    const exportData = await AccessControlAuditService.exportLogs(filters);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="access-control-audit-${Date.now()}.json"`
    );
    res.send(exportData);
  } catch (error) {
    sendRouteError(req, res, 'Error exporting audit logs', error);
  }
});

/**
 * GET /access-control/security/alerts
 * Get security alerts
 */
router.get('/security/alerts', (req: Request, res: Response) => {
  try {
    const filters = {
      type: req.query.type as any,
      severity: req.query.severity as any,
      acknowledged: req.query.acknowledged === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const alerts = AccessControlSecurityMonitor.getAlerts(filters);
    res.json(alerts);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching security alerts', error);
  }
});

/**
 * POST /access-control/security/alerts/:alertId/acknowledge
 * Acknowledge a security alert
 */
router.post(
  '/security/alerts/:alertId/acknowledge',
  (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const success = AccessControlSecurityMonitor.acknowledgeAlert(alertId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Alert not found' });
      }
    } catch (error) {
      sendRouteError(req, res, 'Error acknowledging alert', error);
    }
  }
);

/**
 * GET /access-control/security/metrics
 * Get security metrics
 */
router.get(
  '/security/metrics',
  auditReadLimiter,
  async (req: Request, res: Response) => {
    try {
      const metrics = await AccessControlSecurityMonitor.getMetrics();
      res.json(metrics);
    } catch (error) {
      sendRouteError(req, res, 'Access control route error', error);
    }
  }
);

/**
 * Helper function to transform Chainhook event to AccessControlEvent
 */
function transformChainhookEvent(
  chainhookEvent: any,
  eventType: AccessControlEventType
): AnyAccessControlEvent {
  const transaction = chainhookEvent.transactions?.[0] || chainhookEvent;

  return {
    eventType,
    transactionHash:
      transaction.transaction_hash ||
      chainhookEvent.transaction_hash ||
      'unknown',
    blockHeight: chainhookEvent.block_identifier?.index || 0,
    timestamp: chainhookEvent.timestamp || Date.now(),
    principal: transaction.sender || chainhookEvent.sender || 'unknown',
    targetPrincipal: extractTargetPrincipal(transaction),
    contractAddress: extractContractAddress(transaction),
    method: extractMethod(transaction),
    data: chainhookEvent,
    metadata: extractMetadata(transaction, eventType),
  };
}

function extractTargetPrincipal(transaction: any): string | undefined {
  // Extract from contract call arguments
  const args = transaction.contract_call?.function_args || [];
  // Look for principal arguments
  for (const arg of args) {
    if (arg.type === 'principal') {
      return arg.value;
    }
  }
  return undefined;
}

function extractContractAddress(transaction: any): string {
  return (
    transaction.contract_call?.contract_id ||
    transaction.contract_identifier ||
    'unknown'
  );
}

function extractMethod(transaction: any): string {
  return (
    transaction.contract_call?.method ||
    transaction.contract_call?.function_name ||
    'unknown'
  );
}

function extractMetadata(
  transaction: any,
  eventType: AccessControlEventType
): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract metadata based on event type
  const args = transaction.contract_call?.function_args || [];

  // This is a simplified extraction - should be enhanced based on actual contract structure
  args.forEach((arg: any, index: number) => {
    if (arg.name) {
      metadata[arg.name] = arg.value;
    } else {
      metadata[`arg${index}`] = arg.value;
    }
  });

  return metadata;
}

export default router;
