/**
 * Tests confirming issue #223 fixes:
 * - All destructive endpoints require admin authentication
 * - olderThanDays is validated: 0, negative, and non-integer are rejected
 * - parseInt isNaN guards prevent NaN from reaching services
 */
import express from 'express';
import request from 'supertest';

jest.mock('../../utils/logger', () => ({
  default: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockProcessQueue = jest
  .fn()
  .mockResolvedValue({ processed: 0, failed: 0 });
const mockRetryNow = jest.fn().mockResolvedValue(undefined);
const mockCancelRetry = jest.fn().mockResolvedValue(undefined);
const mockCleanupOldItems = jest.fn().mockResolvedValue(0);
const mockRecoverItems = jest.fn().mockResolvedValue({ recovered: 0 });
const mockArchiveOldItems = jest.fn().mockResolvedValue(0);
const mockGetStatistics = jest.fn().mockResolvedValue({});
const mockGetItemsForManualReview = jest.fn().mockResolvedValue([]);
const mockGetMetrics = jest.fn().mockResolvedValue({});
const mockGetSuccessRateTimeSeries = jest.fn().mockResolvedValue([]);
const mockGetErrorDistributionTimeSeries = jest.fn().mockResolvedValue([]);
const mockGetTopFailingItems = jest.fn().mockResolvedValue([]);
const mockGetHealthStatus = jest.fn().mockResolvedValue({});
const mockGetAlerts = jest.fn().mockReturnValue([]);
const mockGetErrorAnalysis = jest.fn().mockResolvedValue({});
const mockGetAllStats = jest.fn().mockReturnValue([]);

jest.mock('../../services/RetryQueueService', () => ({
  default: {
    getStatistics: () => mockGetStatistics(),
    processQueue: () => mockProcessQueue(),
    retryNow: (id: string) => mockRetryNow(id),
    cancelRetry: (id: string) => mockCancelRetry(id),
    cleanupOldItems: (days: number) => mockCleanupOldItems(days),
  },
}));

jest.mock('../../services/DeadLetterQueueService', () => ({
  default: {
    getStatistics: () => mockGetStatistics(),
    recoverItems: (f: any) => mockRecoverItems(f),
    archiveOldItems: (days: number) => mockArchiveOldItems(days),
    getErrorAnalysis: () => mockGetErrorAnalysis(),
    getItemsForManualReview: (limit: number) =>
      mockGetItemsForManualReview(limit),
  },
}));

jest.mock('../../services/RetryMetricsService', () => ({
  default: {
    getMetrics: () => mockGetMetrics(),
    getSuccessRateTimeSeries: (h: number) => mockGetSuccessRateTimeSeries(h),
    getErrorDistributionTimeSeries: (h: number) =>
      mockGetErrorDistributionTimeSeries(h),
    getTopFailingItems: (l: number) => mockGetTopFailingItems(l),
    exportMetrics: () => mockGetMetrics(),
  },
}));

jest.mock('../../services/ErrorMonitoringService', () => ({
  default: {
    getHealthStatus: () => mockGetHealthStatus(),
    getAlerts: (l: number, s: any) => mockGetAlerts(l, s),
    getStatistics: () => mockGetStatistics(),
  },
}));

jest.mock('../../services/CircuitBreakerService', () => ({
  default: {
    getAllStats: () => mockGetAllStats(),
    getBreaker: () => ({ forceClose: jest.fn() }),
  },
}));

let authNextFn: jest.Mock;
let requireAdminNextFn: jest.Mock;
let isAdminUser = false;

jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    req.user = { userId: 'user-1', stacksAddress: 'SP_USER' };
    authNextFn = next;
    next();
  }),
  requireAdmin: jest.fn((req: any, res: any, next: any) => {
    requireAdminNextFn = next;
    if (isAdminUser) {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  }),
}));

import { authenticateToken, requireAdmin } from '../../middleware/auth';
import retryRouter from '../../routes/retry';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/retry', retryRouter);
  return app;
};

describe('retry route — issue #223 fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAdminUser = false;
  });

  describe('POST /retry/queue/process — requires admin', () => {
    it('returns 403 for non-admin users', async () => {
      const res = await request(buildApp()).post('/retry/queue/process');
      expect(res.status).toBe(403);
      expect(authenticateToken).toHaveBeenCalled();
      expect(requireAdmin).toHaveBeenCalled();
    });

    it('processes queue for admin users', async () => {
      isAdminUser = true;
      const res = await request(buildApp()).post('/retry/queue/process');
      expect(res.status).toBe(200);
      expect(mockProcessQueue).toHaveBeenCalled();
    });
  });

  describe('POST /retry/queue/cleanup — requires admin + validates olderThanDays', () => {
    it('returns 403 for non-admin users', async () => {
      const res = await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: 7 });
      expect(res.status).toBe(403);
    });

    it('returns 400 when olderThanDays is 0', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: 0 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive integer/);
    });

    it('returns 400 when olderThanDays is negative', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: -5 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when olderThanDays is a string', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: 'all' });
      expect(res.status).toBe(400);
    });

    it('succeeds with valid olderThanDays and passes safe value to service', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: 14 });
      expect(res.status).toBe(200);
      expect(mockCleanupOldItems).toHaveBeenCalledWith(14);
    });

    it('caps olderThanDays at 365', async () => {
      isAdminUser = true;
      await request(buildApp())
        .post('/retry/queue/cleanup')
        .send({ olderThanDays: 9999 });
      expect(mockCleanupOldItems).toHaveBeenCalledWith(365);
    });
  });

  describe('POST /retry/dead-letter/archive — requires admin + validates olderThanDays', () => {
    it('returns 403 for non-admin users', async () => {
      const res = await request(buildApp())
        .post('/retry/dead-letter/archive')
        .send({ olderThanDays: 7 });
      expect(res.status).toBe(403);
    });

    it('returns 400 when olderThanDays is 0', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/dead-letter/archive')
        .send({ olderThanDays: 0 });
      expect(res.status).toBe(400);
    });

    it('succeeds with valid olderThanDays', async () => {
      isAdminUser = true;
      const res = await request(buildApp())
        .post('/retry/dead-letter/archive')
        .send({ olderThanDays: 30 });
      expect(res.status).toBe(200);
      expect(mockArchiveOldItems).toHaveBeenCalledWith(30);
    });
  });

  describe('GET /retry/metrics/success-rate — isNaN guard on hours', () => {
    it('defaults to 24 hours when hours param is non-numeric', async () => {
      isAdminUser = true;
      await request(buildApp()).get('/retry/metrics/success-rate?hours=abc');
      expect(mockGetSuccessRateTimeSeries).toHaveBeenCalledWith(24);
    });

    it('clamps hours to 168 (1 week) when over maximum', async () => {
      isAdminUser = true;
      await request(buildApp()).get('/retry/metrics/success-rate?hours=9999');
      expect(mockGetSuccessRateTimeSeries).toHaveBeenCalledWith(168);
    });
  });

  describe('DELETE /retry/queue/:itemId — requires admin', () => {
    it('returns 403 for non-admin users', async () => {
      const res = await request(buildApp()).delete('/retry/queue/item-123');
      expect(res.status).toBe(403);
    });

    it('succeeds for admin users', async () => {
      isAdminUser = true;
      const res = await request(buildApp()).delete('/retry/queue/item-123');
      expect(res.status).toBe(200);
      expect(mockCancelRetry).toHaveBeenCalledWith('item-123');
    });
  });
});
