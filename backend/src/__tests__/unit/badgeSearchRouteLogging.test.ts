/**
 * Tests confirming badge search routes use sendRouteError
 * and no longer call console.error on failures.
 */
import express from 'express';
import request from 'supertest';
import { requestId } from '../../middleware/requestId';

jest.mock('../../services/badgeSearchService', () => ({
  default: {
    searchBadges: jest.fn(),
    getFilterOptions: jest.fn(),
    getTrendingBadges: jest.fn(),
    getSearchSuggestions: jest.fn(),
    searchByIssuer: jest.fn(),
  },
}));
jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../middleware/validation', () => ({
  validatePagination: (_req: any, _res: any, next: any) => next(),
}));
jest.mock('../../utils/logger', () => ({
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import logger from '../../utils/logger';
import badgeSearchService from '../../services/badgeSearchService';
import badgeSearchRouter from '../../routes/badgeSearch';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestId);
  app.use('/api/badges', badgeSearchRouter);
  return app;
}

describe('badge search route error logging', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 500 and logs via logger when POST /search throws', async () => {
    (badgeSearchService.searchBadges as jest.Mock).mockRejectedValue(
      new Error('Search failed')
    );
    const app = buildApp();
    const res = await request(app).post('/api/badges/search').send({});
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error searching badges'),
      expect.objectContaining({ error: 'Search failed' })
    );
  });

  it('returns 500 and logs via logger when GET /filters throws', async () => {
    (badgeSearchService.getFilterOptions as jest.Mock).mockRejectedValue(
      new Error('Filter error')
    );
    const app = buildApp();
    const res = await request(app).get('/api/badges/filters');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns 500 and logs via logger when GET /trending throws', async () => {
    (badgeSearchService.getTrendingBadges as jest.Mock).mockRejectedValue(
      new Error('Trending error')
    );
    const app = buildApp();
    const res = await request(app).get('/api/badges/trending');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns 500 and logs via logger when GET /suggestions throws', async () => {
    (badgeSearchService.getSearchSuggestions as jest.Mock).mockRejectedValue(
      new Error('Suggestions error')
    );
    const app = buildApp();
    const res = await request(app).get('/api/badges/suggestions?q=test');
    expect(res.status).toBe(500);
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns empty array for GET /suggestions when q is missing', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/badges/suggestions');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(badgeSearchService.getSearchSuggestions).not.toHaveBeenCalled();
  });

  it('includes requestId in 500 response body', async () => {
    (badgeSearchService.getFilterOptions as jest.Mock).mockRejectedValue(
      new Error('fail')
    );
    const app = buildApp();
    const res = await request(app)
      .get('/api/badges/filters')
      .set('X-Request-ID', 'badge-trace-99');
    expect(res.body.requestId).toBe('badge-trace-99');
  });

  it('does not call console.error', async () => {
    (badgeSearchService.searchBadges as jest.Mock).mockRejectedValue(
      new Error('err')
    );
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = buildApp();
    await request(app).post('/api/badges/search').send({});
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
