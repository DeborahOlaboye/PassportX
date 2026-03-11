import { Router, Request, Response } from 'express';
import ChainhookManager from '../services/chainhookManager';
import { authenticateToken as authMiddleware } from '../middleware/auth';
import EventReplayService from '../services/EventReplayService';
import ChainhookEventProcessor from '../services/chainhookEventProcessor';
import logger from '../utils/logger';

const router = Router();
let chainhookManager: ChainhookManager | null = null;

export function initializeChainhookRoutes(manager: ChainhookManager) {
  chainhookManager = manager;
}

router.get('/status', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const status = chainhookManager.getStatus();

    res.json({
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get Chainhook status', { error });
    res.status(500).json({
      error: 'Failed to get Chainhook status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    if (chainhookManager.isActive()) {
      return res
        .status(400)
        .json({ error: 'Chainhook manager is already running' });
    }

    await chainhookManager.start();
    logger.info('Chainhook manager started');

    res.json({
      message: 'Chainhook manager started successfully',
      status: chainhookManager.getStatus(),
    });
  } catch (error) {
    logger.error('Failed to start Chainhook manager', { error });
    res.status(500).json({
      error: 'Failed to start Chainhook manager',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/stop', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    if (!chainhookManager.isActive()) {
      return res
        .status(400)
        .json({ error: 'Chainhook manager is not running' });
    }

    await chainhookManager.stop();
    logger.info('Chainhook manager stopped');

    res.json({
      message: 'Chainhook manager stopped successfully',
    });
  } catch (error) {
    logger.error('Failed to stop Chainhook manager', { error });
    res.status(500).json({
      error: 'Failed to stop Chainhook manager',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ status: 'unavailable' });
    }

    const health = chainhookManager.getHealthCheck().getStatus();

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    logger.error('Failed to get health status', { error });
    res.status(500).json({
      error: 'Failed to get health status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/subscriptions', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const subscriptionManager = chainhookManager.getSubscriptionManager();
    const subscriptions = subscriptionManager.getAllSubscriptions();

    res.json({
      subscriptions,
      total: subscriptions.length,
      statistics: subscriptionManager.getStatistics(),
    });
  } catch (error) {
    logger.error('Failed to get subscriptions', { error });
    res.status(500).json({
      error: 'Failed to get subscriptions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/subscriptions', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const { name, eventType, predicateConfig, filters } = req.body;

    if (!name || !eventType) {
      return res.status(400).json({ error: 'name and eventType are required' });
    }
    if (typeof name !== 'string' || name.length > 200) {
      return res
        .status(400)
        .json({ error: 'name must be a string of at most 200 characters' });
    }
    if (typeof eventType !== 'string' || eventType.length > 100) {
      return res.status(400).json({
        error: 'eventType must be a string of at most 100 characters',
      });
    }

    const subscriptionManager = chainhookManager.getSubscriptionManager();
    const subscription = subscriptionManager.createSubscription(
      name,
      eventType,
      predicateConfig,
      filters
    );

    res.status(201).json({
      subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    logger.error('Failed to create subscription', { error });
    res.status(500).json({
      error: 'Failed to create subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete(
  '/subscriptions/:id',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      if (!chainhookManager) {
        return res
          .status(503)
          .json({ error: 'Chainhook manager not initialized' });
      }

      const subscriptionManager = chainhookManager.getSubscriptionManager();
      const deleted = subscriptionManager.deleteSubscription(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.json({
        message: 'Subscription deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete subscription', { error });
      res.status(500).json({
        error: 'Failed to delete subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get('/predicates', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const predicateManager = chainhookManager.getPredicateManager();
    const predicates = predicateManager.getAllPredicates();

    res.json({
      predicates,
      total: predicates.length,
      statistics: predicateManager.getStatistics(),
    });
  } catch (error) {
    logger.error('Failed to get predicates', { error });
    res.status(500).json({
      error: 'Failed to get predicates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/predicates', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const { name, type, network, if_this, then_that } = req.body;

    if (!name || !type || !network || !if_this || !then_that) {
      return res.status(400).json({
        error: 'name, type, network, if_this, and then_that are required',
      });
    }
    if (typeof name !== 'string' || name.length > 200) {
      return res
        .status(400)
        .json({ error: 'name must be a string of at most 200 characters' });
    }
    const VALID_NETWORKS = new Set(['mainnet', 'testnet']);
    if (typeof network !== 'string' || !VALID_NETWORKS.has(network)) {
      return res
        .status(400)
        .json({ error: 'network must be "mainnet" or "testnet"' });
    }

    const predicateManager = chainhookManager.getPredicateManager();
    const predicate = predicateManager.createPredicate(
      name,
      type,
      network as 'mainnet' | 'testnet' | 'devnet',
      if_this,
      then_that
    );

    res.status(201).json({
      predicate,
      message: 'Predicate created successfully',
    });
  } catch (error) {
    logger.error('Failed to create predicate', { error });
    res.status(500).json({
      error: 'Failed to create predicate',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete(
  '/predicates/:uuid',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      if (!chainhookManager) {
        return res
          .status(503)
          .json({ error: 'Chainhook manager not initialized' });
      }

      const predicateManager = chainhookManager.getPredicateManager();
      const deleted = predicateManager.deletePredicate(req.params.uuid);

      if (!deleted) {
        return res.status(404).json({ error: 'Predicate not found' });
      }

      res.json({
        message: 'Predicate deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete predicate', { error });
      res.status(500).json({
        error: 'Failed to delete predicate',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const chainhookLogger = chainhookManager.getLogger();
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit =
      isNaN(rawLimit) || rawLimit < 1 ? 100 : Math.min(rawLimit, 1000);
    const logs = chainhookLogger.getLogs(undefined, limit);

    res.json({
      logs,
      total: chainhookLogger.getLogCount(),
      statistics: chainhookLogger.getLogStatistics(),
    });
  } catch (error) {
    logger.error('Failed to get logs', { error });
    res.status(500).json({
      error: 'Failed to get logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/logs/errors', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res
        .status(503)
        .json({ error: 'Chainhook manager not initialized' });
    }

    const chainhookLogger = chainhookManager.getLogger();
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit =
      isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 500);
    const errorLogs = chainhookLogger.getErrorLogs(limit);

    res.json({
      logs: errorLogs,
      total: errorLogs.length,
    });
  } catch (error) {
    logger.error('Failed to get error logs', { error });
    res.status(500).json({
      error: 'Failed to get error logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const MAX_BLOCK_RANGE = 100_000;
const MAX_HISTORICAL_LIMIT = 1000;

/** Returns a valid Date or undefined; never returns an Invalid Date object. */
function safeDate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Returns a validated non-negative integer or undefined. */
function safeBlock(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : parseInt(value as string, 10);
  return isNaN(n) || n < 0 ? undefined : n;
}

router.get(
  '/events/historical',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const replayService = new EventReplayService();

      const startBlock = safeBlock(req.query.startBlock);
      const endBlock = safeBlock(req.query.endBlock);

      // Reject requests where endBlock < startBlock or range exceeds cap
      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock < startBlock
      ) {
        return res
          .status(400)
          .json({ error: 'endBlock must be >= startBlock' });
      }
      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock - startBlock > MAX_BLOCK_RANGE
      ) {
        return res.status(400).json({
          error: `Block range must not exceed ${MAX_BLOCK_RANGE.toLocaleString()} blocks`,
        });
      }

      const rawLimit = parseInt(req.query.limit as string, 10);
      const rawOffset = parseInt(req.query.offset as string, 10);

      const filters = {
        eventType: req.query.eventType as string,
        contractAddress: req.query.contractAddress as string,
        method: req.query.method as string,
        startDate: safeDate(req.query.startDate),
        endDate: safeDate(req.query.endDate),
        startBlock,
        endBlock,
        transactionHash: req.query.transactionHash as string,
        limit:
          isNaN(rawLimit) || rawLimit < 1
            ? 100
            : Math.min(rawLimit, MAX_HISTORICAL_LIMIT),
        offset: isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset,
      };

      const events = await replayService.getHistoricalEvents(filters);

      res.json({
        events,
        total: events.length,
        filters,
      });
    } catch (error) {
      logger.error('Failed to fetch historical events', { error });
      res.status(500).json({
        error: 'Failed to fetch historical events',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get(
  '/events/statistics',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const replayService = new EventReplayService();

      const startBlock = safeBlock(req.query.startBlock);
      const endBlock = safeBlock(req.query.endBlock);

      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock < startBlock
      ) {
        return res
          .status(400)
          .json({ error: 'endBlock must be >= startBlock' });
      }
      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock - startBlock > MAX_BLOCK_RANGE
      ) {
        return res.status(400).json({
          error: `Block range must not exceed ${MAX_BLOCK_RANGE.toLocaleString()} blocks`,
        });
      }

      const filters = {
        eventType: req.query.eventType as string,
        contractAddress: req.query.contractAddress as string,
        method: req.query.method as string,
        startDate: safeDate(req.query.startDate),
        endDate: safeDate(req.query.endDate),
        startBlock,
        endBlock,
        transactionHash: req.query.transactionHash as string,
      };

      const statistics = await replayService.getEventStatistics(filters);

      res.json(statistics);
    } catch (error) {
      logger.error('Failed to get event statistics', { error });
      res.status(500).json({
        error: 'Failed to get event statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.post(
  '/events/replay',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!chainhookManager) {
        return res
          .status(503)
          .json({ error: 'Chainhook manager not initialized' });
      }

      const replayService = new EventReplayService();
      const eventProcessor = new ChainhookEventProcessor();

      const startBlock = safeBlock(req.body.startBlock);
      const endBlock = safeBlock(req.body.endBlock);

      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock < startBlock
      ) {
        return res
          .status(400)
          .json({ error: 'endBlock must be >= startBlock' });
      }
      if (
        startBlock !== undefined &&
        endBlock !== undefined &&
        endBlock - startBlock > MAX_BLOCK_RANGE
      ) {
        return res.status(400).json({
          error: `Block range must not exceed ${MAX_BLOCK_RANGE.toLocaleString()} blocks`,
        });
      }

      const rawLimit =
        typeof req.body.limit === 'number'
          ? req.body.limit
          : parseInt(req.body.limit, 10);

      const filters = {
        eventType: req.body.eventType,
        contractAddress: req.body.contractAddress,
        method: req.body.method,
        startDate: safeDate(req.body.startDate),
        endDate: safeDate(req.body.endDate),
        startBlock,
        endBlock,
        transactionHash: req.body.transactionHash,
        limit:
          isNaN(rawLimit) || rawLimit < 1
            ? 100
            : Math.min(rawLimit, MAX_HISTORICAL_LIMIT),
      };

      const result = await replayService.replayEvents(filters, eventProcessor);

      res.json({
        message: 'Event replay completed',
        ...result,
      });
    } catch (error) {
      logger.error('Failed to replay events', { error });
      res.status(500).json({
        error: 'Failed to replay events',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
