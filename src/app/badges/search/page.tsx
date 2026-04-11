'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import SearchBar from '@/components/search/SearchBar';
import FilterPanel from '@/components/search/FilterPanel';
import SortDropdown, { SortOption } from '@/components/search/SortDropdown';
import Pagination, { ResultsInfo } from '@/components/search/Pagination';
import BadgeCard from '@/components/BadgeCard';
import { Loader2 } from 'lucide-react';
import {
  BadgeSearchFilters,
  buildBadgeSearchParams,
} from '@/lib/badges/searchQuery';

interface Badge {
  id: number;
  name: string;
  description: string;
  community: string;
  level: number;
  category: string;
  timestamp: number;
  icon?: string;
  verified?: boolean;
  tokenId?: number;
  transactionId?: string;
}

interface SearchResult {
  badges: Badge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

type ActiveFilters = BadgeSearchFilters;

export default function BadgeSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ActiveFilters>({
    levels: [],
    categories: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const hasFilters = useMemo(
    () =>
      !!searchQuery ||
      filters.levels.length > 0 ||
      filters.categories.length > 0 ||
      !!filters.community,
    [
      filters.categories.length,
      filters.community,
      filters.levels.length,
      searchQuery,
    ]
  );

  const fetchBadges = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setFetchError(null);
        setIsLoading(true);

        const params = buildBadgeSearchParams(
          searchQuery,
          sortBy,
          filters,
          currentPage
        );

        const response = await fetch(
          `/api/badges/search?${params.toString()}`,
          {
            signal,
          }
        );
        const data = await response.json();

        if (!response.ok || data?.success === false) {
          setFetchError(
            data?.message || 'Failed to load badges. Please try again.'
          );
          setResults(null);
          return;
        }

        if (data?.success) {
          setResults(data.data);
        } else {
          setResults({
            badges: [],
            total: 0,
            page: currentPage,
            limit: 20,
            totalPages: 0,
            hasMore: false,
          });
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Error fetching badges:', error);
        setFetchError('Failed to load badges. Please try again.');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, sortBy, filters, currentPage]
  );

  // Fetch badges when search parameters change
  useEffect(() => {
    const controller = new AbortController();

    fetchBadges(controller.signal).catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Unhandled error in badge search:', err);
    });

    return () => controller.abort();
  }, [fetchBadges]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ levels: [], categories: [] });
    setCurrentPage(1);
    setFetchError(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
    setFetchError(null);
  };

  const handleFilterChange = (newFilters: ActiveFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
    setFetchError(null);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page on sort change
    setFetchError(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Search Badges
          </h1>
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

        {/* Error State */}
        {fetchError && !isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-center text-sm text-red-700"
          >
            {fetchError}
          </div>
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
          <>
            <div className="flex items-center justify-between mb-4 gap-4">
              <ResultsInfo
                currentPage={results.page}
                limit={results.limit}
                total={results.total}
                className="flex-1"
              />
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  aria-label="Clear all filters and search"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {results.badges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  showVerification={true}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && results && results.badges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No badges found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking
              for
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
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
  );
}
