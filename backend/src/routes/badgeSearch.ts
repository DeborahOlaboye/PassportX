import express from 'express';
import badgeSearchService from '../services/badgeSearchService';
import { IBadgeSearchQuery } from '../types';
import { validatePagination } from '../middleware/validation';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  API_READ_RATE_LIMIT,
  BADGE_PUBLIC_READ_RATE_LIMIT,
  BADGE_SUGGESTIONS_RATE_LIMIT,
} from '../config/rateLimits';
import { sendRouteError } from '../utils/routeError';

const router = express.Router();

// Rate limiter for search operations (200 requests per 15 minutes)
const searchLimiter = createRateLimiter(API_READ_RATE_LIMIT);

// Rate limiter for public read endpoints — filters and trending (120 req / 15 min)
const publicReadLimiter = createRateLimiter(BADGE_PUBLIC_READ_RATE_LIMIT);

// Rate limiter for autocomplete suggestions (60 req / 15 min — tighter due to regex DB hit)
const suggestionsLimiter = createRateLimiter(BADGE_SUGGESTIONS_RATE_LIMIT);

// Exhaustive whitelist of accepted sort values — mirrors the switch in badgeSearchService
const VALID_SORT_OPTIONS = [
  'newest',
  'oldest',
  'level-high',
  'level-low',
  'name-asc',
  'name-desc',
] as const;

type SortOption = (typeof VALID_SORT_OPTIONS)[number];

/**
 * POST /api/badges/search
 * Search and filter badges
 */
router.post('/search', searchLimiter, async (req, res) => {
  try {
    const query: IBadgeSearchQuery = req.body;
    const result = await badgeSearchService.searchBadges(query);
    res.json({ success: true, data: result });
  } catch (error) {
    sendRouteError(req, res, 'Error searching badges', error);
  }
});

/**
 * GET /api/badges/search
 * Search badges with query parameters
 */
router.get('/search', searchLimiter, validatePagination, async (req, res) => {
  try {
    const {
      search,
      level,
      category,
      issuer,
      community,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
    } = req.query;

    const query: IBadgeSearchQuery = {
      search: search as string,
      level: level
        ? level.toString().includes(',')
          ? level.toString().split(',').map(Number)
          : Number(level)
        : undefined,
      category: category
        ? category.toString().includes(',')
          ? category.toString().split(',')
          : (category as string)
        : undefined,
      issuer: issuer as string,
      community: community as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy as SortOption,
    };

    const result = await badgeSearchService.searchBadges(query);
    res.json({ success: true, data: result });
  } catch (error) {
    sendRouteError(req, res, 'Error searching badges', error);
  }
});

/**
 * GET /api/badges/filters
 * Get available filter options
 */
router.get('/filters', publicReadLimiter, async (req, res) => {
  try {
    const filters = await badgeSearchService.getFilterOptions();
    res.json({ success: true, data: filters });
  } catch (error) {
    sendRouteError(req, res, 'Error getting filter options', error);
  }
});

/**
 * GET /api/badges/trending
 * Get trending badges
 */
router.get('/trending', publicReadLimiter, async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 7;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const trending = await badgeSearchService.getTrendingBadges(days, limit);
    res.json({ success: true, data: trending });
  } catch (error) {
    sendRouteError(req, res, 'Error getting trending badges', error);
  }
});

/**
 * GET /api/badges/suggestions
 * Get search suggestions (autocomplete)
 */
router.get('/suggestions', suggestionsLimiter, async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await badgeSearchService.getSearchSuggestions(
      query,
      limit
    );
    res.json({ success: true, data: suggestions });
  } catch (error) {
    sendRouteError(req, res, 'Error getting search suggestions', error);
  }
});

/**
 * GET /api/badges/issuer/:address
 * Search badges by issuer
 */
router.get('/issuer/:address', validatePagination, async (req, res) => {
  try {
    const { address } = req.params;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const result = await badgeSearchService.searchByIssuer(
      address,
      page,
      limit
    );
    res.json({ success: true, data: result });
  } catch (error) {
    sendRouteError(req, res, 'Error searching badges by issuer', error);
  }
});

export default router;
