import express, { Request, Response } from 'express';
import AnalyticsAggregator from '../services/analyticsAggregator';
import { createRateLimiter } from '../middleware/rateLimiter';
import { API_READ_RATE_LIMIT } from '../config/rateLimits';
import { sendRouteError } from '../utils/routeError';

const router = express.Router();

// Rate limiter for analytics read endpoints (200 requests per 15 minutes)
const analyticsLimiter = createRateLimiter(API_READ_RATE_LIMIT);

let analyticsAggregator: AnalyticsAggregator | null = null;

export function setAnalyticsAggregator(aggregator: AnalyticsAggregator) {
  analyticsAggregator = aggregator;
}

router.get(
  '/aggregated',
  analyticsLimiter,
  async (req: Request, res: Response) => {
    try {
      if (!analyticsAggregator) {
        return res.status(503).json({
          success: false,
          error: 'Analytics aggregator not initialized',
        });
      }

      const analytics = await analyticsAggregator.getAggregatedAnalytics();

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      sendRouteError(req, res, 'Error fetching aggregated analytics', error);
    }
  }
);

router.get('/issuance', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics();

    res.json({
      success: true,
      data: analytics.issuance,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching issuance analytics', error);
  }
});

router.get('/community', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics();

    res.json({
      success: true,
      data: analytics.community,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching community analytics', error);
  }
});

router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics();

    res.json({
      success: true,
      data: analytics.users,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching user analytics', error);
  }
});

router.get('/distribution', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const analytics = await analyticsAggregator.getAggregatedAnalytics();

    res.json({
      success: true,
      data: analytics.distribution,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching distribution analytics', error);
  }
});

router.get('/snapshots', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const period = (req.query.period as string) || 'daily';
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);

    const snapshots = await analyticsAggregator.getAnalyticsSnapshot(
      period,
      limit
    );

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching analytics snapshots', error);
  }
});

router.get('/trends/:metric', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const { metric } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    const validMetrics = [
      'totalBadgesIssued',
      'totalUsers',
      'totalCommunities',
      'newUsersThisPeriod',
      'activeUsersThisPeriod',
      'averageBadgesPerUser',
    ];

    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        error: `Invalid metric. Valid metrics: ${validMetrics.join(', ')}`,
      });
    }

    const trend = await analyticsAggregator.getMetricsTrend(metric, days);

    res.json({
      success: true,
      data: {
        metric,
        period: `${days} days`,
        trend,
      },
    });
  } catch (error) {
    sendRouteError(req, res, 'Error fetching metrics trend', error);
  }
});

router.post('/snapshot', async (req: Request, res: Response) => {
  try {
    if (!analyticsAggregator) {
      return res.status(503).json({
        success: false,
        error: 'Analytics aggregator not initialized',
      });
    }

    const { period } = req.body;

    if (!['hourly', 'daily', 'weekly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: hourly, daily, weekly',
      });
    }

    await analyticsAggregator.recordAnalyticsSnapshot(period);

    res.json({
      success: true,
      message: `Analytics snapshot recorded for period: ${period}`,
    });
  } catch (error) {
    sendRouteError(req, res, 'Error recording analytics snapshot', error);
  }
});

router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    sendRouteError(req, res, 'Error checking analytics health', error);
  }
});

export default router;
