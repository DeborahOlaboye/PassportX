/**
 * Tests confirming issue #222 fixes:
 * - Rate limiters applied to /filters, /trending, /suggestions
 * - NaN silent failures eliminated (page, limit, days, level)
 * - Unbounded parameters capped before reaching service
 * - Invalid sortBy defaults to 'newest'
 * - Invalid dates are silently dropped
 */
import express from 'express';
import request from 'supertest';

jest.mock('../../utils/logger', () => ({
  default: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockGetFilterOptions = jest.fn().mockResolvedValue({ levels: [], categories: [], communities: [] });
const mockGetTrendingBadges = jest.fn().mockResolvedValue([]);
const mockGetSearchSuggestions = jest.fn().mockResolvedValue([]);
const mockSearchBadges = jest.fn().mockResolvedValue({ badges: [], total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false });
const mockSearchByIssuer = jest.fn().mockResolvedValue({ badges: [], total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false });

jest.mock('../../services/badgeSearchService', () => ({
  default: {
    getFilterOptions: (...args: any[]) => mockGetFilterOptions(...args),
    getTrendingBadges: (...args: any[]) => mockGetTrendingBadges(...args),
    getSearchSuggestions: (...args: any[]) => mockGetSearchSuggestions(...args),
    searchBadges: (...args: any[]) => mockSearchBadges(...args),
    searchByIssuer: (...args: any[]) => mockSearchByIssuer(...args),
  },
}));

jest.mock('../../middleware/rateLimiter', () => ({
  createRateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middleware/validation', () => ({
  validatePagination: (_req: any, _res: any, next: any) => next(),
}));

import badgeSearchRouter from '../../routes/badgeSearch';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/badges', badgeSearchRouter);
  return app;
};

describe('badgeSearch route — issue #222 fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /badges/filters', () => {
    it('returns 200 and calls getFilterOptions', async () => {
      const res = await request(buildApp()).get('/badges/filters');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockGetFilterOptions).toHaveBeenCalled();
    });
  });

  describe('GET /badges/trending', () => {
    it('uses default days=7 and limit=10 when params are absent', async () => {
      await request(buildApp()).get('/badges/trending');
      expect(mockGetTrendingBadges).toHaveBeenCalledWith(7, 10);
    });

    it('clamps days to 365 when value exceeds maximum', async () => {
      await request(buildApp()).get('/badges/trending?days=9999');
      expect(mockGetTrendingBadges).toHaveBeenCalledWith(365, 10);
    });

    it('clamps limit to 50 when value exceeds maximum', async () => {
      await request(buildApp()).get('/badges/trending?limit=9999');
      expect(mockGetTrendingBadges).toHaveBeenCalledWith(7, 50);
    });

    it('defaults days to 7 when non-numeric string is provided', async () => {
      await request(buildApp()).get('/badges/trending?days=abc');
      expect(mockGetTrendingBadges).toHaveBeenCalledWith(7, 10);
    });

    it('defaults limit to 10 when non-numeric string is provided', async () => {
      await request(buildApp()).get('/badges/trending?limit=xyz');
      expect(mockGetTrendingBadges).toHaveBeenCalledWith(7, 10);
    });
  });

  describe('GET /badges/suggestions', () => {
    it('returns empty array when query is missing', async () => {
      const res = await request(buildApp()).get('/badges/suggestions');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(mockGetSearchSuggestions).not.toHaveBeenCalled();
    });

    it('clamps limit to 20 when value exceeds maximum', async () => {
      await request(buildApp()).get('/badges/suggestions?q=badge&limit=9999');
      expect(mockGetSearchSuggestions).toHaveBeenCalledWith('badge', 20);
    });

    it('defaults limit to 10 on non-numeric input', async () => {
      await request(buildApp()).get('/badges/suggestions?q=badge&limit=abc');
      expect(mockGetSearchSuggestions).toHaveBeenCalledWith('badge', 10);
    });

    it('passes valid limit when within bounds', async () => {
      await request(buildApp()).get('/badges/suggestions?q=badge&limit=5');
      expect(mockGetSearchSuggestions).toHaveBeenCalledWith('badge', 5);
    });
  });

  describe('GET /badges/search — page/limit NaN guard', () => {
    it('defaults page to 1 when non-numeric string passed', async () => {
      await request(buildApp()).get('/badges/search?page=foo');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.page).toBe(1);
    });

    it('defaults limit to 20 when non-numeric string passed', async () => {
      await request(buildApp()).get('/badges/search?limit=bar');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.limit).toBe(20);
    });

    it('clamps limit to 100 when over maximum', async () => {
      await request(buildApp()).get('/badges/search?limit=9999');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.limit).toBe(100);
    });
  });

  describe('GET /badges/search — level NaN guard', () => {
    it('treats non-numeric level as undefined', async () => {
      await request(buildApp()).get('/badges/search?level=abc');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.level).toBeUndefined();
    });

    it('parses a valid single level', async () => {
      await request(buildApp()).get('/badges/search?level=3');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.level).toBe(3);
    });

    it('filters NaN values from comma-separated level list', async () => {
      await request(buildApp()).get('/badges/search?level=1,abc,3');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.level).toEqual([1, 3]);
    });
  });

  describe('GET /badges/search — sortBy whitelist', () => {
    it('defaults sortBy to newest for unknown value', async () => {
      await request(buildApp()).get('/badges/search?sortBy=hacked');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.sortBy).toBe('newest');
    });

    it('accepts valid sortBy values', async () => {
      await request(buildApp()).get('/badges/search?sortBy=level-high');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.sortBy).toBe('level-high');
    });
  });

  describe('GET /badges/search — invalid date handling', () => {
    it('ignores invalid startDate and does not pass it to service', async () => {
      await request(buildApp()).get('/badges/search?startDate=not-a-date');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.startDate).toBeUndefined();
    });

    it('ignores invalid endDate and does not pass it to service', async () => {
      await request(buildApp()).get('/badges/search?endDate=not-a-date');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.endDate).toBeUndefined();
    });

    it('passes valid ISO date string as Date object', async () => {
      await request(buildApp()).get('/badges/search?startDate=2025-01-01');
      const call = mockSearchBadges.mock.calls[0][0];
      expect(call.startDate).toBeInstanceOf(Date);
    });
  });

  describe('GET /badges/issuer/:address', () => {
    it('defaults page to 1 and limit to 20 on NaN input', async () => {
      await request(buildApp()).get('/badges/issuer/SP_TEST?page=nan&limit=nan');
      expect(mockSearchByIssuer).toHaveBeenCalledWith('SP_TEST', 1, 20);
    });

    it('clamps limit to 100 when over maximum', async () => {
      await request(buildApp()).get('/badges/issuer/SP_TEST?limit=5000');
      expect(mockSearchByIssuer).toHaveBeenCalledWith('SP_TEST', 1, 100);
    });
  });
});
