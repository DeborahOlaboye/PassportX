import express from 'express';
import RetryQueueService from '../services/RetryQueueService';
import DeadLetterQueueService from '../services/DeadLetterQueueService';
import RetryMetricsService from '../services/RetryMetricsService';
import ErrorMonitoringService from '../services/ErrorMonitoringService';
import CircuitBreakerRegistry from '../services/CircuitBreakerService';

const router = express.Router();

/**
 * GET /retry/queue/stats
 * Get retry queue statistics
 */
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await RetryQueueService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching retry queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch retry queue statistics' });
  }
});

/**
 * POST /retry/queue/process
 * Manually trigger retry queue processing
 */
router.post('/queue/process', async (req, res) => {
  try {
    const result = await RetryQueueService.processQueue();
    res.json({
      message: 'Retry queue processing completed',
      ...result
    });
  } catch (error) {
    console.error('Error processing retry queue:', error);
    res.status(500).json({ error: 'Failed to process retry queue' });
  }
});

/**
 * POST /retry/queue/:itemId/retry
 * Retry a specific item immediately
 */
router.post('/queue/:itemId/retry', async (req, res) => {
  try {
    const { itemId } = req.params;
    await RetryQueueService.retryNow(itemId);
    res.json({ message: 'Item scheduled for immediate retry' });
  } catch (error) {
    console.error('Error scheduling retry:', error);
    res.status(500).json({ error: 'Failed to schedule retry' });
  }
});

/**
 * DELETE /retry/queue/:itemId
 * Cancel retry for a specific item
 */
router.delete('/queue/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    await RetryQueueService.cancelRetry(itemId);
    res.json({ message: 'Retry cancelled and moved to dead letter queue' });
  } catch (error) {
    console.error('Error cancelling retry:', error);
    res.status(500).json({ error: 'Failed to cancel retry' });
  }
});

/**
 * POST /retry/queue/cleanup
 * Clean up old completed items
 */
router.post('/queue/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.body;
    const deletedCount = await RetryQueueService.cleanupOldItems(olderThanDays);
    res.json({
      message: 'Cleanup completed',
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up retry queue:', error);
    res.status(500).json({ error: 'Failed to clean up retry queue' });
  }
});

/**
 * GET /retry/dead-letter/stats
 * Get dead letter queue statistics
 */
router.get('/dead-letter/stats', async (req, res) => {
  try {
    const stats = await DeadLetterQueueService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dead letter queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch dead letter queue statistics' });
  }
});

/**
 * POST /retry/dead-letter/recover
 * Attempt to recover items from dead letter queue
 */
router.post('/dead-letter/recover', async (req, res) => {
  try {
    const filter = req.body;
    const result = await DeadLetterQueueService.recoverItems(filter);
    res.json({
      message: 'Recovery attempt completed',
      ...result
    });
  } catch (error) {
    console.error('Error recovering items:', error);
    res.status(500).json({ error: 'Failed to recover items' });
  }
});

/**
 * POST /retry/dead-letter/archive
 * Archive old dead letter items
 */
router.post('/dead-letter/archive', async (req, res) => {
  try {
    const { olderThanDays = 7 } = req.body;
    const archivedCount = await DeadLetterQueueService.archiveOldItems(olderThanDays);
    res.json({
      message: 'Archival completed',
      archivedCount
    });
  } catch (error) {
    console.error('Error archiving items:', error);
    res.status(500).json({ error: 'Failed to archive items' });
  }
});

/**
 * GET /retry/dead-letter/analysis
 * Get error analysis from dead letter queue
 */
router.get('/dead-letter/analysis', async (req, res) => {
  try {
    const analysis = await DeadLetterQueueService.getErrorAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error getting error analysis:', error);
    res.status(500).json({ error: 'Failed to get error analysis' });
  }
});

/**
 * GET /retry/dead-letter/manual-review
 * Get items requiring manual review
 */
router.get('/dead-letter/manual-review', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const items = await DeadLetterQueueService.getItemsForManualReview(limit);
    res.json(items);
  } catch (error) {
    console.error('Error getting items for manual review:', error);
    res.status(500).json({ error: 'Failed to get items for manual review' });
  }
});

/**
 * GET /retry/metrics
 * Get comprehensive retry metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await RetryMetricsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /retry/metrics/success-rate
 * Get success rate time series
 */
router.get('/metrics/success-rate', async (req, res) => {
  try {
    const hoursBack = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const timeSeries = await RetryMetricsService.getSuccessRateTimeSeries(hoursBack);
    res.json(timeSeries);
  } catch (error) {
    console.error('Error fetching success rate:', error);
    res.status(500).json({ error: 'Failed to fetch success rate time series' });
  }
});

/**
 * GET /retry/metrics/error-distribution
 * Get error distribution time series
 */
router.get('/metrics/error-distribution', async (req, res) => {
  try {
    const hoursBack = req.query.hours ? parseInt(req.query.hours as string) : 24;
    const distribution = await RetryMetricsService.getErrorDistributionTimeSeries(hoursBack);
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching error distribution:', error);
    res.status(500).json({ error: 'Failed to fetch error distribution' });
  }
});

/**
 * GET /retry/metrics/top-failing
 * Get top failing items
 */
router.get('/metrics/top-failing', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const items = await RetryMetricsService.getTopFailingItems(limit);
    res.json(items);
  } catch (error) {
    console.error('Error fetching top failing items:', error);
    res.status(500).json({ error: 'Failed to fetch top failing items' });
  }
});

/**
 * GET /retry/metrics/export
 * Export metrics as JSON
 */
router.get('/metrics/export', async (req, res) => {
  try {
    const exportData = await RetryMetricsService.exportMetrics();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="retry-metrics-${Date.now()}.json"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting metrics:', error);
    res.status(500).json({ error: 'Failed to export metrics' });
  }
});

/**
 * GET /retry/monitoring/health
 * Get system health status
 */
router.get('/monitoring/health', async (req, res) => {
  try {
    const health = await ErrorMonitoringService.getHealthStatus();
    res.json(health);
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ error: 'Failed to fetch health status' });
  }
});

/**
 * GET /retry/monitoring/alerts
 * Get recent alerts
 */
router.get('/monitoring/alerts', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const severity = req.query.severity as 'low' | 'medium' | 'high' | 'critical' | undefined;
    const alerts = ErrorMonitoringService.getAlerts(limit, severity);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /retry/monitoring/statistics
 * Get comprehensive monitoring statistics
 */
router.get('/monitoring/statistics', async (req, res) => {
  try {
    const stats = await ErrorMonitoringService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching monitoring statistics:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring statistics' });
  }
});

/**
 * GET /retry/circuit-breakers
 * Get all circuit breaker statistics
 */
router.get('/circuit-breakers', (req, res) => {
  try {
    const stats = CircuitBreakerRegistry.getAllStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching circuit breaker stats:', error);
    res.status(500).json({ error: 'Failed to fetch circuit breaker statistics' });
  }
});

/**
 * POST /retry/circuit-breakers/:name/reset
 * Reset a specific circuit breaker
 */
router.post('/circuit-breakers/:name/reset', (req, res) => {
  try {
    const { name } = req.params;
    const breaker = CircuitBreakerRegistry.getBreaker(name);
    breaker.forceClose();
    res.json({ message: `Circuit breaker '${name}' has been reset` });
  } catch (error) {
    console.error('Error resetting circuit breaker:', error);
    res.status(500).json({ error: 'Failed to reset circuit breaker' });
  }
});

export default router;
