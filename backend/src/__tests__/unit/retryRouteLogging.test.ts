/**
 * Tests confirming retry routes use sendRouteError
 * and no longer call console.error on failures.
 */
import express from 'express';
import request from 'supertest';
import { requestId } from '../../middleware/requestId';

jest.mock('../../services/RetryQueueService', () => ({
  default: {
    getStatistics: jest.fn(),
    processQueue: jest.fn(),
    retryNow: jest.fn(),
    cancelRetry: jest.fn(),
    cleanupOldItems: jest.fn(),
  },
}));
jest.mock('../../services/DeadLetterQueueService', () => ({
  default: {
    getStatistics: jest.fn(),
    recoverItems: jest.fn(),
    archiveOldItems: jest.fn(),
    getErrorAnalysis: jest.fn(),
    getItemsForManualReview: jest.fn(),
  },
}));
jest.mock('../../services/RetryMetricsService', () => ({
  default: {
    getMetrics: jest.fn(),
    getSuccessRateTimeSeries: jest.fn(),
    getErrorDistributionTimeSeries: jest.fn(),
    getTopFailingItems: jest.fn(),
    exportMetrics: jest.fn(),
  },
}));
jest.mock('../../services/ErrorMonitoringService', () => ({
  default: {
    getHealthStatus: jest.fn(),
    getAlerts: jest.fn(),
    getStatistics: jest.fn(),
  },
}));
jest.mock('../../services/CircuitBreakerService', () => ({
  default: { getAllStats: jest.fn(), getBreaker: jest.fn() },
}));
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../utils/logger', () => ({
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import logger from '../../utils/logger';
import RetryQueueService from '../../services/RetryQueueService';
import DeadLetterQueueService from '../../services/DeadLetterQueueService';
import retryRouter from '../../routes/retry';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use('/retry', retryRouter);
  return app;
}

describe('retry route error logging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 500 and logs when queue process throws', async () => {
    (RetryQueueService.processQueue as jest.Mock).mockRejectedValue(
      new Error('Queue error')
    );
    const app = buildApp();
    const res = await request(app).post('/retry/queue/process');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error processing retry queue'),
      expect.any(Object)
    );
  });

  it('returns 500 and logs when dead letter stats throws', async () => {
    (DeadLetterQueueService.getStatistics as jest.Mock).mockRejectedValue(
      new Error('DLQ error')
    );
    const app = buildApp();
    const res = await request(app).get('/retry/dead-letter/stats');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('includes requestId in error response', async () => {
    (RetryQueueService.processQueue as jest.Mock).mockRejectedValue(
      new Error('fail')
    );
    const app = buildApp();
    const res = await request(app)
      .post('/retry/queue/process')
      .set('X-Request-ID', 'retry-trace-42');
    expect(res.body.requestId).toBe('retry-trace-42');
  });

  it('does not call console.error on failure', async () => {
    (RetryQueueService.cleanupOldItems as jest.Mock).mockRejectedValue(
      new Error('cleanup failed')
    );
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const app = buildApp();
    await request(app).post('/retry/queue/cleanup').send({ olderThanDays: 7 });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
