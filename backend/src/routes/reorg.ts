import { Router, Request, Response } from 'express'
import ReorgHandlerService from '../services/ReorgHandlerService'
import ReorgMonitoringService from '../../src/services/ReorgMonitoringService'
import { authMiddleware } from '../middleware/auth'

const router = Router()

/**
 * GET /api/reorg/status
 * Returns current reorg state and statistics
 */
router.get('/status', authMiddleware, (req: Request, res: Response) => {
  try {
    const reorgHandler = ReorgHandlerService.getInstance()
    const reorgMonitor = ReorgMonitoringService.getInstance()

    const handlerStats = reorgHandler.getReorgStats()
    const monitorMetrics = reorgMonitor.getMetrics()

    const status = {
      isReorgInProgress: false, // This would be tracked in a real implementation
      lastReorgBlock: monitorMetrics.lastReorgTimestamp > 0 ? monitorMetrics.maxRollbackDepth : 0,
      totalReorgs: monitorMetrics.totalReorgs,
      lastReorgTimestamp: monitorMetrics.lastReorgTimestamp,
      handlerStats,
      monitorMetrics,
      timestamp: new Date().toISOString()
    }

    res.json(status)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get reorg status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/reorg/affected-entities?block=<blockHeight>
 * Returns entities affected by reorg at specified block
 */
router.get('/affected-entities', authMiddleware, (req: Request, res: Response) => {
  try {
    const { block } = req.query

    if (!block || isNaN(Number(block))) {
      return res.status(400).json({ error: 'Valid block height required' })
    }

    // In a real implementation, this would query the database
    // for entities affected by reorgs at the specified block
    const affectedEntities = {
      blockHeight: Number(block),
      entityIds: [], // Would be populated from database
      timestamp: new Date().toISOString()
    }

    res.json(affectedEntities)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get affected entities',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/reorg/metrics
 * Returns comprehensive reorg monitoring metrics
 */
router.get('/metrics', authMiddleware, (req: Request, res: Response) => {
  try {
    const reorgMonitor = ReorgMonitoringService.getInstance()
    const metrics = reorgMonitor.getMetrics()

    res.json({
      metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get reorg metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/reorg/alerts?limit=10
 * Returns recent reorg alerts
 */
router.get('/alerts', authMiddleware, (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    const reorgMonitor = ReorgMonitoringService.getInstance()
    const alerts = reorgMonitor.getRecentAlerts(limit)

    res.json({
      alerts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get reorg alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router