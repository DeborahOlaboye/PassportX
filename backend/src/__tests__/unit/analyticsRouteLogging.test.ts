/**
 * Tests confirming analytics route uses sendRouteError (logger + requestId)
 * instead of console.error on failures.
 */
import express from 'express';
import request from 'supertest';
import { requestId } from '../../middleware/requestId';

jest.mock('../../services/analyticsAggregator');
jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
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
import analyticsRouter, {
  setAnalyticsAggregator,
} from '../../routes/analytics';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use('/api/analytics', analyticsRouter);
  return app;
}

describe('analytics route error logging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 503 when aggregator is not initialized', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/analytics/aggregated');
    expect(res.status).toBe(503);
  });

  it('returns 500 and logs via logger when aggregator throws', async () => {
    const mockAggregator = {
      getAggregatedAnalytics: jest.fn().mockRejectedValue(new Error('DB down')),
    } as any;
    setAnalyticsAggregator(mockAggregator);
    const app = buildApp();

    const res = await request(app).get('/api/analytics/aggregated');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching aggregated analytics'),
      expect.objectContaining({ error: 'DB down' })
    );
  });

  it('includes X-Request-ID header in error response', async () => {
    const mockAggregator = {
      getAggregatedAnalytics: jest.fn().mockRejectedValue(new Error('fail')),
    } as any;
    setAnalyticsAggregator(mockAggregator);
    const app = buildApp();

    const res = await request(app)
      .get('/api/analytics/aggregated')
      .set('X-Request-ID', 'test-trace-001');

    expect(res.headers['x-request-id']).toBe('test-trace-001');
    expect(res.body.requestId).toBe('test-trace-001');
  });

  it('returns 400 for invalid snapshot period', async () => {
    const mockAggregator = {
      recordAnalyticsSnapshot: jest.fn(),
    } as any;
    setAnalyticsAggregator(mockAggregator);
    const app = buildApp();

    const res = await request(app)
      .post('/api/analytics/snapshot')
      .send({ period: 'monthly' });

    expect(res.status).toBe(400);
    expect(mockAggregator.recordAnalyticsSnapshot).not.toHaveBeenCalled();
  });

  it('does not call console.error — logger.error is used instead', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockAggregator = {
      getAggregatedAnalytics: jest.fn().mockRejectedValue(new Error('err')),
    } as any;
    setAnalyticsAggregator(mockAggregator);
    const app = buildApp();

    await request(app).get('/api/analytics/issuance');
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
