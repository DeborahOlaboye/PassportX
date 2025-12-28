import { Router, Request, Response } from 'express'
import ChainhookManager from '../services/chainhookManager'
import { authMiddleware } from '../middleware/auth'
import EventReplayService from '../services/EventReplayService'
import ChainhookEventProcessor from '../services/chainhookEventProcessor'

const router = Router()
let chainhookManager: ChainhookManager | null = null

export function initializeChainhookRoutes(manager: ChainhookManager) {
  chainhookManager = manager
}

router.get('/status', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const status = chainhookManager.getStatus()

    res.json({
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Chainhook status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    if (chainhookManager.isRunning()) {
      return res.status(400).json({ error: 'Chainhook manager is already running' })
    }

    await chainhookManager.start()

    res.json({
      message: 'Chainhook manager started successfully',
      status: chainhookManager.getStatus()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to start Chainhook manager',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/stop', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    if (!chainhookManager.isRunning()) {
      return res.status(400).json({ error: 'Chainhook manager is not running' })
    }

    await chainhookManager.stop()

    res.json({
      message: 'Chainhook manager stopped successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop Chainhook manager',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/health', (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ status: 'unavailable' })
    }

    const health = chainhookManager.getHealthCheck().getStatus()

    res.status(health.status === 'healthy' ? 200 : 503).json(health)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get health status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/subscriptions', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const subscriptionManager = chainhookManager.getSubscriptionManager()
    const subscriptions = subscriptionManager.getAllSubscriptions()

    res.json({
      subscriptions,
      total: subscriptions.length,
      statistics: subscriptionManager.getStatistics()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get subscriptions',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/subscriptions', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const { name, eventType, predicateConfig, filters } = req.body

    if (!name || !eventType) {
      return res.status(400).json({ error: 'name and eventType are required' })
    }

    const subscriptionManager = chainhookManager.getSubscriptionManager()
    const subscription = subscriptionManager.createSubscription(name, eventType, predicateConfig, filters)

    res.status(201).json({
      subscription,
      message: 'Subscription created successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.delete('/subscriptions/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const subscriptionManager = chainhookManager.getSubscriptionManager()
    const deleted = subscriptionManager.deleteSubscription(req.params.id)

    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found' })
    }

    res.json({
      message: 'Subscription deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/predicates', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const predicateManager = chainhookManager.getPredicateManager()
    const predicates = predicateManager.getAllPredicates()

    res.json({
      predicates,
      total: predicates.length,
      statistics: predicateManager.getStatistics()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get predicates',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/predicates', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const { name, type, network, if_this, then_that } = req.body

    if (!name || !type || !network || !if_this || !then_that) {
      return res.status(400).json({
        error: 'name, type, network, if_this, and then_that are required'
      })
    }

    const predicateManager = chainhookManager.getPredicateManager()
    const predicate = predicateManager.createPredicate(name, type, network, if_this, then_that)

    res.status(201).json({
      predicate,
      message: 'Predicate created successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create predicate',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.delete('/predicates/:uuid', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const predicateManager = chainhookManager.getPredicateManager()
    const deleted = predicateManager.deletePredicate(req.params.uuid)

    if (!deleted) {
      return res.status(404).json({ error: 'Predicate not found' })
    }

    res.json({
      message: 'Predicate deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete predicate',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const logger = chainhookManager.getLogger()
    const limit = parseInt(req.query.limit as string) || 100
    const logs = logger.getLogs(undefined, limit)

    res.json({
      logs,
      total: logger.getLogCount(),
      statistics: logger.getLogStatistics()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/logs/errors', authMiddleware, (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const logger = chainhookManager.getLogger()
    const limit = parseInt(req.query.limit as string) || 50
    const errorLogs = logger.getErrorLogs(limit)

    res.json({
      logs: errorLogs,
      total: errorLogs.length
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get error logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/events/historical', authMiddleware, async (req: Request, res: Response) => {
  try {
    const replayService = new EventReplayService()

    const filters = {
      eventType: req.query.eventType as string,
      contractAddress: req.query.contractAddress as string,
      method: req.query.method as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      startBlock: req.query.startBlock ? parseInt(req.query.startBlock as string) : undefined,
      endBlock: req.query.endBlock ? parseInt(req.query.endBlock as string) : undefined,
      transactionHash: req.query.transactionHash as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    }

    const events = await replayService.getHistoricalEvents(filters)

    res.json({
      events,
      total: events.length,
      filters
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch historical events',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.get('/events/statistics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const replayService = new EventReplayService()

    const filters = {
      eventType: req.query.eventType as string,
      contractAddress: req.query.contractAddress as string,
      method: req.query.method as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      startBlock: req.query.startBlock ? parseInt(req.query.startBlock as string) : undefined,
      endBlock: req.query.endBlock ? parseInt(req.query.endBlock as string) : undefined,
      transactionHash: req.query.transactionHash as string
    }

    const statistics = await replayService.getEventStatistics(filters)

    res.json(statistics)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get event statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

router.post('/events/replay', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!chainhookManager) {
      return res.status(503).json({ error: 'Chainhook manager not initialized' })
    }

    const replayService = new EventReplayService()
    const eventProcessor = chainhookManager.getEventProcessor()

    if (!eventProcessor) {
      return res.status(503).json({ error: 'Event processor not available' })
    }

    const filters = {
      eventType: req.body.eventType,
      contractAddress: req.body.contractAddress,
      method: req.body.method,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      startBlock: req.body.startBlock,
      endBlock: req.body.endBlock,
      transactionHash: req.body.transactionHash,
      limit: req.body.limit || 100
    }

    const result = await replayService.replayEvents(filters, eventProcessor)

    res.json({
      message: 'Event replay completed',
      ...result
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to replay events',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
