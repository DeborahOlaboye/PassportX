export interface BadgeSearchFilters {
  levels: number[];
  categories: string[];
  community?: string;
  startDate?: string;
  endDate?: string;
}

export const buildBadgeSearchParams = (
  searchQuery: string,
  sortBy: string,
  filters: BadgeSearchFilters,
  currentPage: number
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
  params.append('limit', '20');

  return params;
};
