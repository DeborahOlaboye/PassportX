import express from 'express'
import badgeSearchService from '../services/badgeSearchService'
import { IBadgeSearchQuery } from '../types'

const router = express.Router()

/**
 * POST /api/badges/search
 * Search and filter badges
 */
router.post('/search', async (req, res) => {
  try {
    const query: IBadgeSearchQuery = req.body

    const result = await badgeSearchService.searchBadges(query)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error searching badges:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search badges'
    })
  }
})

/**
 * GET /api/badges/search
 * Search badges with query parameters
 */
router.get('/search', async (req, res) => {
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
      sortBy
    } = req.query

    const query: IBadgeSearchQuery = {
      search: search as string,
      level: level ? (level.toString().includes(',') ? level.toString().split(',').map(Number) : Number(level)) : undefined,
      category: category ? (category.toString().includes(',') ? category.toString().split(',') : category as string) : undefined,
      issuer: issuer as string,
      community: community as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as any
    }

    const result = await badgeSearchService.searchBadges(query)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error searching badges:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search badges'
    })
  }
})

/**
 * GET /api/badges/filters
 * Get available filter options
 */
router.get('/filters', async (req, res) => {
  try {
    const filters = await badgeSearchService.getFilterOptions()

    res.json({
      success: true,
      data: filters
    })
  } catch (error) {
    console.error('Error getting filter options:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get filter options'
    })
  }
})

/**
 * GET /api/badges/trending
 * Get trending badges
 */
router.get('/trending', async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 7
    const limit = req.query.limit ? Number(req.query.limit) : 10

    const trending = await badgeSearchService.getTrendingBadges(days, limit)

    res.json({
      success: true,
      data: trending
    })
  } catch (error) {
    console.error('Error getting trending badges:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get trending badges'
    })
  }
})

/**
 * GET /api/badges/suggestions
 * Get search suggestions (autocomplete)
 */
router.get('/suggestions', async (req, res) => {
  try {
    const query = req.query.q as string
    const limit = req.query.limit ? Number(req.query.limit) : 10

    if (!query) {
      return res.json({
        success: true,
        data: []
      })
    }

    const suggestions = await badgeSearchService.getSearchSuggestions(query, limit)

    res.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Error getting search suggestions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get search suggestions'
    })
  }
})

/**
 * GET /api/badges/issuer/:address
 * Search badges by issuer
 */
router.get('/issuer/:address', async (req, res) => {
  try {
    const { address } = req.params
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 20

    const result = await badgeSearchService.searchByIssuer(address, page, limit)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error searching badges by issuer:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search badges by issuer'
    })
  }
})

export default router
