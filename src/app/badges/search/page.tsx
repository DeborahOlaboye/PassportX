'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
import SortDropdown, { SortOption } from '@/components/search/SortDropdown'
import Pagination, { ResultsInfo } from '@/components/search/Pagination'
import BadgeCard from '@/components/BadgeCard'
import { Loader2 } from 'lucide-react'

interface Badge {
  id: number
  name: string
  description: string
  community: string
  level: number
  category: string
  timestamp: number
  icon?: string
  verified?: boolean
  tokenId?: number
  transactionId?: string
}

interface SearchResult {
  badges: Badge[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

interface ActiveFilters {
  levels: number[]
  categories: string[]
  community?: string
  startDate?: string
  endDate?: string
}

export default function BadgeSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filters, setFilters] = useState<ActiveFilters>({
    levels: [],
    categories: [],
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch badges when search parameters change
  useEffect(() => {
    fetchBadges()
  }, [searchQuery, sortBy, filters, currentPage])

  const fetchBadges = async () => {
    try {
      setIsLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (sortBy) params.append('sortBy', sortBy)
      if (filters.levels.length > 0) params.append('level', filters.levels.join(','))
      if (filters.categories.length > 0) params.append('category', filters.categories.join(','))
      if (filters.community) params.append('community', filters.community)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      params.append('page', currentPage.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/badges/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.data)
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setCurrentPage(1) // Reset to first page on sort change
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Search Badges</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Find badges by name, description, level, category, or community
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} showSuggestions={true} />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative">
          <FilterPanel onFilterChange={handleFilterChange} />
          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>

        {/* Results Info */}
        {results && !isLoading && (
          <ResultsInfo
            currentPage={results.page}
            limit={results.limit}
            total={results.total}
            className="mb-4"
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading badges...</span>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && results && results.badges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {results.badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} showVerification={true} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results && results.badges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No badges found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for
            </p>
            {(searchQuery || filters.levels.length > 0 || filters.categories.length > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilters({ levels: [], categories: [] })
                  setCurrentPage(1)
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && results && results.totalPages > 1 && (
          <Pagination
            currentPage={results.page}
            totalPages={results.totalPages}
            onPageChange={handlePageChange}
            className="mt-8"
          />
        )}
      </div>
    </div>
  )
}
