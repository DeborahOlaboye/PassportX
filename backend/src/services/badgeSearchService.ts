import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'
import { IBadgeSearchQuery, IBadgeSearchResult } from '../types'
import { FilterQuery } from 'mongoose'

export class BadgeSearchService {
  /**
   * Search and filter badges
   */
  async searchBadges(query: IBadgeSearchQuery): Promise<IBadgeSearchResult> {
    const {
      search,
      level,
      category,
      issuer,
      community,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'newest'
    } = query

    // Build MongoDB filter
    const filter: FilterQuery<any> = {}

    // Text search on badge template name and description
    if (search) {
      const templates = await BadgeTemplate.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }).select('_id')

      const templateIds = templates.map(t => t._id)
      filter.templateId = { $in: templateIds }
    }

    // Filter by level
    if (level !== undefined) {
      if (Array.isArray(level)) {
        filter['metadata.level'] = { $in: level }
      } else {
        filter['metadata.level'] = level
      }
    }

    // Filter by category
    if (category) {
      if (Array.isArray(category)) {
        filter['metadata.category'] = { $in: category }
      } else {
        filter['metadata.category'] = category
      }
    }

    // Filter by issuer
    if (issuer) {
      filter.issuer = issuer
    }

    // Filter by community
    if (community) {
      filter.community = community
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.issuedAt = {}
      if (startDate) {
        filter.issuedAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.issuedAt.$lte = new Date(endDate)
      }
    }

    // Build sort options
    const sortOptions: any = {}
    switch (sortBy) {
      case 'newest':
        sortOptions.issuedAt = -1
        break
      case 'oldest':
        sortOptions.issuedAt = 1
        break
      case 'level-high':
        sortOptions['metadata.level'] = -1
        break
      case 'level-low':
        sortOptions['metadata.level'] = 1
        break
      case 'name-asc':
        sortOptions['templateId'] = 1
        break
      case 'name-desc':
        sortOptions['templateId'] = -1
        break
      default:
        sortOptions.issuedAt = -1
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [badges, total] = await Promise.all([
      Badge.find(filter)
        .populate('templateId')
        .populate('community')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Badge.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return {
      badges: badges as any,
      total,
      page,
      limit,
      totalPages,
      hasMore
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions() {
    const [levels, categories, communities] = await Promise.all([
      // Get unique levels
      Badge.distinct('metadata.level'),

      // Get unique categories
      Badge.distinct('metadata.category'),

      // Get communities with badge counts
      Badge.aggregate([
        {
          $group: {
            _id: '$community',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'communities',
            localField: '_id',
            foreignField: '_id',
            as: 'communityInfo'
          }
        },
        {
          $unwind: '$communityInfo'
        },
        {
          $project: {
            _id: 1,
            name: '$communityInfo.name',
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ])
    ])

    return {
      levels: levels.sort((a, b) => a - b),
      categories: categories.sort(),
      communities
    }
  }

  /**
   * Search badges by issuer
   */
  async searchByIssuer(issuer: string, page = 1, limit = 20) {
    return this.searchBadges({
      issuer,
      page,
      limit,
      sortBy: 'newest'
    })
  }

  /**
   * Get trending badges (most issued recently)
   */
  async getTrendingBadges(days = 7, limit = 10) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const trending = await Badge.aggregate([
      {
        $match: {
          issuedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$templateId',
          count: { $sum: 1 },
          lastIssued: { $max: '$issuedAt' }
        }
      },
      {
        $sort: { count: -1, lastIssued: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'badgetemplates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      {
        $unwind: '$template'
      }
    ])

    return trending
  }

  /**
   * Autocomplete search suggestions
   */
  async getSearchSuggestions(query: string, limit = 10) {
    if (!query || query.length < 2) {
      return []
    }

    const templates = await BadgeTemplate.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name description category')
      .limit(limit)
      .lean()

    return templates.map(t => ({
      id: t._id,
      name: t.name,
      description: t.description,
      category: t.category
    }))
  }
}

export default new BadgeSearchService()
