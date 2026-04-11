export interface BadgeSearchFilters {
  levels: number[];
  categories: string[];
  community?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Build a URLSearchParams object for badge search requests.
 *
 * This helper ensures the same query parameter conventions are used
 * across client-side search pages and server API proxies.
 */
export const buildBadgeSearchParams = (
  searchQuery: string,
  sortBy: string,
  filters: BadgeSearchFilters,
  currentPage: number,
  limit = 20
): URLSearchParams => {
  const params = new URLSearchParams();

  if (searchQuery) params.append('search', searchQuery);
  if (sortBy) params.append('sortBy', sortBy);
  if (filters.levels.length > 0) params.append('level', filters.levels.join(','));
  if (filters.categories.length > 0)
    params.append('category', filters.categories.join(','));
  if (filters.community) params.append('community', filters.community);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  params.append('page', currentPage.toString());
  params.append('limit', limit.toString());

  return params;
};
