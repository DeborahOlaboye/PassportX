import express from 'express';
import RetryQueueService from '../services/RetryQueueService';
import DeadLetterQueueService from '../services/DeadLetterQueueService';
import RetryMetricsService from '../services/RetryMetricsService';
import ErrorMonitoringService from '../services/ErrorMonitoringService';
import CircuitBreakerRegistry from '../services/CircuitBreakerService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { sendRouteError } from '../utils/routeError';

const router = express.Router();

/**
 * GET /retry/queue/stats
 */
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await RetryQueueService.getStatistics();
    res.json(stats);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching retry queue stats', error);
  }
});

/**
 * POST /retry/queue/process
 */
router.post('/queue/process', async (req, res) => {
  try {
    const result = await RetryQueueService.processQueue();
    res.json({ message: 'Retry queue processing completed', ...result });
  } catch (error) {
    sendRouteError(req, res, 'Error processing retry queue', error);
  }
});

/**
 * POST /retry/queue/:itemId/retry
 */
router.post(
  '/queue/:itemId/retry',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { itemId } = req.params;
      await RetryQueueService.retryNow(itemId);
      res.json({ message: 'Item scheduled for immediate retry' });
    } catch (error) {
      sendRouteError(req, res, 'Error scheduling retry', error);
    }
  }
);

/**
 * DELETE /retry/queue/:itemId
 */
router.delete(
  '/queue/:itemId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { itemId } = req.params;
      await RetryQueueService.cancelRetry(itemId);
      res.json({ message: 'Retry cancelled and moved to dead letter queue' });
    } catch (error) {
      sendRouteError(req, res, 'Error cancelling retry', error);
    }
  }
);

/**
 * POST /retry/queue/cleanup
 */
router.post('/queue/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.body;
    const deletedCount = await RetryQueueService.cleanupOldItems(olderThanDays);
    res.json({ message: 'Cleanup completed', deletedCount });
  } catch (error) {
    sendRouteError(req, res, 'Error cleaning up retry queue', error);
  }
});

/**
 * GET /retry/dead-letter/stats
 */
router.get('/dead-letter/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await DeadLetterQueueService.getStatistics();
    res.json(stats);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching dead letter queue stats', error);
  }
});

/**
 * POST /retry/dead-letter/recover
 */
router.post('/dead-letter/recover', async (req, res) => {
  try {
    const filter = req.body;
    const result = await DeadLetterQueueService.recoverItems(filter);
    res.json({ message: 'Recovery attempt completed', ...result });
  } catch (error) {
    sendRouteError(req, res, 'Error recovering items', error);
  }
});

/**
 * POST /retry/dead-letter/archive
 */
router.post('/dead-letter/archive', async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.body;
    const archivedCount = await DeadLetterQueueService.archiveOldItems(
      olderThanDays
    );
    res.json({ message: 'Archival completed', archivedCount });
  } catch (error) {
    sendRouteError(req, res, 'Error archiving items', error);
  }
});

/**
 * GET /retry/dead-letter/analysis
 */
router.get('/dead-letter/analysis', authenticateToken, async (req, res) => {
  try {
    const analysis = await DeadLetterQueueService.getErrorAnalysis();
    res.json(analysis);
  } catch (error) {
    sendRouteError(req, res, 'Error getting error analysis', error);
  }
});

/**
 * GET /retry/dead-letter/manual-review
 */
router.get(
  '/dead-letter/manual-review',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const rawLimit = parseInt(req.query.limit as string, 10);
      const limit =
        isNaN(rawLimit) || rawLimit < 1 ? 50 : Math.min(rawLimit, 200);
      const items = await DeadLetterQueueService.getItemsForManualReview(limit);
      res.json(items);
    } catch (error) {
      sendRouteError(req, res, 'Error getting items for manual review', error);
    }
  }
);

/**
 * GET /retry/metrics
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = await RetryMetricsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching metrics', error);
  }
});

/**
 * GET /retry/metrics/success-rate
 */
router.get('/metrics/success-rate', authenticateToken, async (req, res) => {
  try {
    const hoursBack = req.query.hours
      ? parseInt(req.query.hours as string)
      : 24;
    const timeSeries = await RetryMetricsService.getSuccessRateTimeSeries(
      hoursBack
    );
    res.json(timeSeries);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching success rate', error);
  }
});

/**
 * GET /retry/metrics/error-distribution
 */
router.get('/metrics/error-distribution', async (req, res) => {
  try {
    const hoursBack = req.query.hours
      ? parseInt(req.query.hours as string)
      : 24;
    const distribution =
      await RetryMetricsService.getErrorDistributionTimeSeries(hoursBack);
    res.json(distribution);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching error distribution', error);
  }
});

/**
 * GET /retry/metrics/top-failing
 */
router.get('/metrics/top-failing', authenticateToken, async (req, res) => {
  try {
    const rawTopLimit = parseInt(req.query.limit as string, 10);
    const limit =
      isNaN(rawTopLimit) || rawTopLimit < 1 ? 10 : Math.min(rawTopLimit, 100);
    const items = await RetryMetricsService.getTopFailingItems(limit);
    res.json(items);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching top failing items', error);
  }
});

/**
 * GET /retry/metrics/export
 */
router.get(
  '/metrics/export',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const exportData = await RetryMetricsService.exportMetrics();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="retry-metrics-${Date.now()}.json"`
      );
      res.send(exportData);
    } catch (error) {
      sendRouteError(req, res, 'Error exporting metrics', error);
    }
  }
);

/**
 * GET /retry/monitoring/health
 */
router.get('/monitoring/health', authenticateToken, async (req, res) => {
  try {
    const health = await ErrorMonitoringService.getHealthStatus();
    res.json(health);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching health status', error);
  }
});

/**
 * GET /retry/monitoring/alerts
 */
router.get('/monitoring/alerts', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const severity = req.query.severity as
      | 'low'
      | 'medium'
      | 'high'
      | 'critical'
      | undefined;
    const alerts = ErrorMonitoringService.getAlerts(limit, severity);
    res.json(alerts);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching alerts', error);
  }
});

/**
 * GET /retry/monitoring/statistics
 */
router.get('/monitoring/statistics', authenticateToken, async (req, res) => {
  try {
    const stats = await ErrorMonitoringService.getStatistics();
    res.json(stats);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching monitoring statistics', error);
  }
});

/**
 * GET /retry/circuit-breakers
 */
router.get('/circuit-breakers', authenticateToken, (req, res) => {
  try {
    const stats = CircuitBreakerRegistry.getAllStats();
    res.json(stats);
  } catch (error) {
    sendRouteError(req, res, 'Error fetching circuit breaker stats', error);
  }
});

/**
 * POST /retry/circuit-breakers/:name/reset
 */
router.post(
  '/circuit-breakers/:name/reset',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    try {
      const { name } = req.params;
      const breaker = CircuitBreakerRegistry.getBreaker(name);
      breaker.forceClose();
      res.json({ message: `Circuit breaker '${name}' has been reset` });
    } catch (error) {
      sendRouteError(req, res, 'Error resetting circuit breaker', error);
    }
  }
);

export default router;
