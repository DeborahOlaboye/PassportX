# Badge Search and Filtering

## Overview

The Badge Search and Filtering feature allows users to quickly find specific badges using text search, filters, and sorting options. The feature includes autocomplete suggestions, multi-criteria filtering, and paginated results.

## Features

### 1. Text Search
- Search by badge name, description, or issuer
- Real-time autocomplete suggestions
- Debounced search (300ms) for performance
- Minimum 2 characters for suggestions

### 2. Filtering Options

#### Level Filter
- Filter by badge level (1-5)
- Multiple levels can be selected
- Levels: Beginner, Intermediate, Advanced, Expert, Master

#### Category Filter
- Filter by badge category
- Available categories:
  - Skill
  - Participation
  - Contribution
  - Leadership
  - Learning
  - Achievement
  - Milestone

#### Community Filter
- Filter badges by issuing community
- Shows badge count per community
- Single community selection

#### Date Range Filter
- Filter badges by issue date
- Start date and end date selectors
- ISO 8601 date format

### 3. Sorting Options

- **Newest First**: Most recently issued badges
- **Oldest First**: Oldest badges first
- **Level: High to Low**: Level 5 → Level 1
- **Level: Low to High**: Level 1 → Level 5
- **Name: A to Z**: Alphabetical ascending
- **Name: Z to A**: Alphabetical descending

### 4. Pagination
- 20 badges per page (configurable)
- Page numbers with ellipsis for large result sets
- Previous/Next navigation
- Results info (showing X-Y of Z badges)
- Scroll to top on page change

## API Endpoints

### Search Badges
```http
GET /api/badges/search
POST /api/badges/search
```

**Query Parameters:**
- `search` (string): Text search query
- `level` (number|array): Filter by level(s)
- `category` (string|array): Filter by category/categories
- `issuer` (string): Filter by issuer address
- `community` (string): Filter by community ID
- `startDate` (ISO 8601): Filter by start date
- `endDate` (ISO 8601): Filter by end date
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)
- `sortBy` (string): Sort option

**Example Request:**
```bash
GET /api/badges/search?search=JavaScript&level=5&category=skill&page=1&limit=20&sortBy=newest
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "badge123",
        "name": "JavaScript Expert",
        "description": "Master of JavaScript",
        "level": 5,
        "category": "skill",
        "community": "Community Name",
        "issuedAt": "2024-03-15T10:30:00Z",
        "verified": true
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasMore": true
  }
}
```

### Get Filter Options
```http
GET /api/badges/filters
```

Returns available filter options based on existing badges.

**Response:**
```json
{
  "success": true,
  "data": {
    "levels": [1, 2, 3, 4, 5],
    "categories": ["skill", "learning", "leadership"],
    "communities": [
      {
        "_id": "comm123",
        "name": "Tech Community",
        "count": 45
      }
    ]
  }
}
```

### Get Search Suggestions
```http
GET /api/badges/suggestions?q=java&limit=10
```

Returns autocomplete suggestions for search.

### Get Trending Badges
```http
GET /api/badges/trending?days=7&limit=10
```

Returns most issued badges in the specified time period.

### Search by Issuer
```http
GET /api/badges/issuer/:address?page=1&limit=20
```

Returns all badges issued by a specific address.

## Frontend Components

### SearchBar
Located: `src/components/search/SearchBar.tsx`

```tsx
import SearchBar from '@/components/search/SearchBar'

<SearchBar
  onSearch={(query) => handleSearch(query)}
  placeholder="Search badges..."
  showSuggestions={true}
/>
```

**Props:**
- `onSearch`: (query: string) => void
- `placeholder`: string (optional)
- `showSuggestions`: boolean (optional, default: true)
- `className`: string (optional)

### FilterPanel
Located: `src/components/search/FilterPanel.tsx`

```tsx
import FilterPanel from '@/components/search/FilterPanel'

<FilterPanel
  onFilterChange={(filters) => handleFilterChange(filters)}
/>
```

**Props:**
- `onFilterChange`: (filters: ActiveFilters) => void
- `className`: string (optional)

### SortDropdown
Located: `src/components/search/SortDropdown.tsx`

```tsx
import SortDropdown from '@/components/search/SortDropdown'

<SortDropdown
  value={sortBy}
  onChange={(sort) => setSortBy(sort)}
/>
```

**Props:**
- `value`: SortOption
- `onChange`: (value: SortOption) => void
- `className`: string (optional)

### Pagination
Located: `src/components/search/Pagination.tsx`

```tsx
import Pagination from '@/components/search/Pagination'

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(page) => setPage(page)}
/>
```

**Props:**
- `currentPage`: number
- `totalPages`: number
- `onPageChange`: (page: number) => void
- `className`: string (optional)

## Database Indexes

The following indexes are automatically created for optimal search performance:

### Badge Collection
```javascript
// Search and filter indexes
{ 'metadata.level': 1, issuedAt: -1 }
{ 'metadata.category': 1, issuedAt: -1 }
{ issuer: 1, issuedAt: -1 }
{ issuedAt: -1 }

// Compound indexes
{ 'metadata.level': 1, 'metadata.category': 1, issuedAt: -1 }
{ community: 1, 'metadata.level': 1, issuedAt: -1 }
{ owner: 1, 'metadata.category': 1, issuedAt: -1 }
```

### BadgeTemplate Collection
```javascript
// Text search
{ name: 'text', description: 'text' }

// Additional indexes
{ name: 1 }
{ isActive: 1, category: 1 }
```

## Performance Optimizations

1. **Debounced Search**: Search input is debounced by 300ms to reduce API calls
2. **Indexed Queries**: All search and filter fields are indexed
3. **Pagination**: Results are paginated to limit data transfer
4. **Lean Queries**: MongoDB `.lean()` used for faster read operations
5. **Compound Indexes**: Multi-field queries use compound indexes
6. **Text Indexes**: Full-text search on template names and descriptions

## Usage Examples

### Basic Text Search
```typescript
// Search for "JavaScript" badges
const results = await fetch('/api/badges/search?search=JavaScript')
```

### Multi-Filter Search
```typescript
// Search for level 4-5 skill badges in specific community
const results = await fetch('/api/badges/search', {
  method: 'POST',
  body: JSON.stringify({
    search: 'programming',
    level: [4, 5],
    category: 'skill',
    community: 'comm123',
    sortBy: 'newest',
    page: 1,
    limit: 20
  })
})
```

### Date Range Search
```typescript
// Find badges issued in March 2024
const results = await fetch('/api/badges/search', {
  method: 'POST',
  body: JSON.stringify({
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    sortBy: 'oldest'
  })
})
```

## Testing

### Run Integration Tests
```bash
npm run test tests/integration/badge-search.test.ts
```

### Run Component Tests
```bash
npm run test tests/unit/search-components.test.tsx
```

## Future Enhancements

- [ ] Saved search filters
- [ ] Search history
- [ ] Advanced query syntax (AND, OR, NOT)
- [ ] Fuzzy search
- [ ] Export search results
- [ ] Share search URLs
- [ ] Badge recommendations based on search
- [ ] Real-time search result updates

## Troubleshooting

### Search Returns No Results
1. Check that badges exist in the database
2. Verify search query matches badge names/descriptions
3. Remove filters to see all badges
4. Check database indexes are created

### Slow Search Performance
1. Verify indexes are created: `db.badges.getIndexes()`
2. Check query uses indexes: `.explain("executionStats")`
3. Reduce result limit
4. Enable query caching

### Autocomplete Not Working
1. Check minimum 2 characters entered
2. Verify `/api/badges/suggestions` endpoint is accessible
3. Check browser console for errors
4. Verify debounce delay (300ms)

## Related Documentation

- [Badge System Overview](./BADGES.md)
- [API Documentation](./API.md)
- [Component Library](./COMPONENTS.md)
- [Database Schema](./DATABASE.md)
