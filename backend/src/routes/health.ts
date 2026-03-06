import { Router } from 'express';
import mongoose from 'mongoose';
import { monitoringService } from '../middleware/monitoring';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns OK status with server timestamp and version.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: "OK" }
 *                 timestamp: { type: string, format: date-time }
 *                 version: { type: string, example: "1.0.0" }
 * /health/status:
 *   get:
 *     summary: Detailed health status
 *     description: Returns detailed health including database connection state and environment.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 * /health/metrics:
 *   get:
 *     summary: Request metrics
 *     description: Returns request count, response time, and error rate metrics.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server metrics
 * /health/db:
 *   get:
 *     summary: Database health
 *     description: Returns MongoDB connection state and database statistics.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database health info
 *       500:
 *         description: Database connection error
 */
// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health status
router.get('/status', (req, res) => {
  const health = monitoringService.getHealthStatus();
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    ...health,
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Request metrics
router.get('/metrics', (req, res) => {
  const metrics = monitoringService.getMetrics();
  res.json(metrics);
});

// Database health
router.get('/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbStats = await mongoose.connection.db?.stats();

    res.json({
      status: states[dbState as keyof typeof states],
      readyState: dbState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      stats: dbStats,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message,
    });
  }
});

export default router;
