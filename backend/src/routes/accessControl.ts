import express, { Request, Response } from 'express';
import { AccessControlEventType, AnyAccessControlEvent } from '../types/accessControl';
import AccessControlEventHandler from '../services/AccessControlEventHandler';
import AccessControlAuditService from '../services/AccessControlAuditService';
import AccessControlSecurityMonitor from '../services/AccessControlSecurityMonitor';

const router = express.Router();

/**
 * Webhook endpoints for Chainhook access control events
 */

/**
 * POST /access-control/webhook/global-permission
 * Handle global permission change events
 */
router.post('/webhook/global-permission', async (req: Request, res: Response) => {
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
    console.error('Error processing global permission webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/community-permission
 * Handle community permission change events
 */
router.post('/webhook/community-permission', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.COMMUNITY_PERMISSION_SET
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing community permission webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/user-suspended
 * Handle user suspension events
 */
router.post('/webhook/user-suspended', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.USER_SUSPENDED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing user suspension webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/user-unsuspended
 * Handle user unsuspension events
 */
router.post('/webhook/user-unsuspended', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.USER_UNSUSPENDED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing user unsuspension webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/issuer-authorized
 * Handle issuer authorization events
 */
router.post('/webhook/issuer-authorized', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.ISSUER_AUTHORIZED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing issuer authorization webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/issuer-revoked
 * Handle issuer revocation events
 */
router.post('/webhook/issuer-revoked', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.ISSUER_REVOKED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing issuer revocation webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/permission-group-created
 * Handle permission group creation events
 */
router.post('/webhook/permission-group-created', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.PERMISSION_GROUP_CREATED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing permission group creation webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/member-role-changed
 * Handle community member role change events
 */
router.post('/webhook/member-role-changed', async (req: Request, res: Response) => {
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
    console.error('Error processing member role change webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/webhook/ownership-transferred
 * Handle community ownership transfer events
 */
router.post('/webhook/ownership-transferred', async (req: Request, res: Response) => {
  try {
    const chainhookEvent = req.body;

    const event: AnyAccessControlEvent = transformChainhookEvent(
      chainhookEvent,
      AccessControlEventType.COMMUNITY_OWNERSHIP_TRANSFERRED
    );

    await AccessControlEventHandler.handleEvent(event);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing ownership transfer webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0
    };

    const logs = await AccessControlAuditService.queryLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/audit/statistics
 * Get audit statistics
 */
router.get('/audit/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await AccessControlAuditService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/audit/suspicious
 * Get suspicious activity
 */
router.get('/audit/suspicious', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await AccessControlAuditService.getSuspiciousActivity(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/audit/user/:principal
 * Get user's access control history
 */
router.get('/audit/user/:principal', async (req: Request, res: Response) => {
  try {
    const { principal } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const history = await AccessControlAuditService.getUserHistory(principal, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/audit/community/:communityId
 * Get community's access control history
 */
router.get('/audit/community/:communityId', async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const history = await AccessControlAuditService.getCommunityHistory(communityId, limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching community history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/audit/export
 * Export audit logs
 */
router.get('/audit/export', async (req: Request, res: Response) => {
  try {
    const filters = {
      principal: req.query.principal as string,
      communityId: req.query.communityId as string,
      eventType: req.query.eventType as AccessControlEventType
    };

    const exportData = await AccessControlAuditService.exportLogs(filters);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="access-control-audit-${Date.now()}.json"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
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
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const alerts = AccessControlSecurityMonitor.getAlerts(filters);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /access-control/security/alerts/:alertId/acknowledge
 * Acknowledge a security alert
 */
router.post('/security/alerts/:alertId/acknowledge', (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const success = AccessControlSecurityMonitor.acknowledgeAlert(alertId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /access-control/security/metrics
 * Get security metrics
 */
router.get('/security/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await AccessControlSecurityMonitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper function to transform Chainhook event to AccessControlEvent
 */
function transformChainhookEvent(chainhookEvent: any, eventType: AccessControlEventType): AnyAccessControlEvent {
  const transaction = chainhookEvent.transactions?.[0] || chainhookEvent;

  return {
    eventType,
    transactionHash: transaction.transaction_hash || chainhookEvent.transaction_hash || 'unknown',
    blockHeight: chainhookEvent.block_identifier?.index || 0,
    timestamp: chainhookEvent.timestamp || Date.now(),
    principal: transaction.sender || chainhookEvent.sender || 'unknown',
    targetPrincipal: extractTargetPrincipal(transaction),
    contractAddress: extractContractAddress(transaction),
    method: extractMethod(transaction),
    data: chainhookEvent,
    metadata: extractMetadata(transaction, eventType)
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
  return transaction.contract_call?.contract_id || transaction.contract_identifier || 'unknown';
}

function extractMethod(transaction: any): string {
  return transaction.contract_call?.method || transaction.contract_call?.function_name || 'unknown';
}

function extractMetadata(transaction: any, eventType: AccessControlEventType): Record<string, any> {
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
