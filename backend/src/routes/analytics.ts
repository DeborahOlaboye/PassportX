import express, { Request, Response } from 'express'
import AnalyticsAggregator from '../services/analyticsAggregator'

const router = express.Router()

let analyticsAggregator: AnalyticsAggregator | null = null

export function setAnalyticsAggregator(aggregator: AnalyticsAggregator) {
  analyticsAggregator = aggregator
}

const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error)
  res.status(500).json({
    success: false,
    error: message,
    details: error instanceof Error ? error.message : String(error)
  })
}

router.get('/aggregated', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics()

    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    handleError(res, error, 'Error fetching aggregated analytics')
  }
})

router.get('/issuance', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics()

    res.json({
      success: true,
      data: analytics.issuance
    })
  } catch (error) {
    handleError(res, error, 'Error fetching issuance analytics')
  }
})

router.get('/community', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics()

    res.json({
      success: true,
      data: analytics.community
    })
  } catch (error) {
    handleError(res, error, 'Error fetching community analytics')
  }
})

router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics()

    res.json({
      success: true,
      data: analytics.users
    })
  } catch (error) {
    handleError(res, error, 'Error fetching user analytics')
  }
})

router.get('/distribution', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics()

    res.json({
      success: true,
      data: analytics.distribution
    })
  } catch (error) {
    handleError(res, error, 'Error fetching distribution analytics')
  }
})

router.get('/snapshots', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const period = (req.query.period as string) || 'daily'
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000)

    const snapshots = await analyticsAggregator.getAnalyticsSnapshot(period, limit)

    res.json({
      success: true,
      data: snapshots
    })
  } catch (error) {
    handleError(res, error, 'Error fetching analytics snapshots')
  }
})

router.get('/trends/:metric', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const { metric } = req.params
    const days = Math.min(parseInt(req.query.days as string) || 30, 365)

    const validMetrics = [
      'totalBadgesIssued',
      'totalUsers',
      'totalCommunities',
      'newUsersThisPeriod',
      'activeUsersThisPeriod',
      'averageBadgesPerUser'
    ]

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Valid metrics: ${validMetrics.join(', ')}`
      })
    }

    const trend = await analyticsAggregator.getMetricsTrend(metric, days)

    res.json({
      success: true,
      data: {
        metric,
        period: `${days} days`,
        trend
      }
    })
  } catch (error) {
    handleError(res, error, 'Error fetching metrics trend')
  }
})

router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized'
      })
    }

    const { period } = req.body

    if (!['hourly', 'daily', 'weekly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: hourly, daily, weekly'
      })
    }

    await analyticsAggregator.recordAnalyticsSnapshot(period)

    res.json({
      success: true,
      message: `Analytics snapshot recorded for period: ${period}`
    })
  } catch (error) {
    handleError(res, error, 'Error recording analytics snapshot')
  }
})

router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    handleError(res, error, 'Error checking analytics health')
  }
})

export default router
