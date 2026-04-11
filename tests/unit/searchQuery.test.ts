import { buildBadgeSearchParams } from '../../src/lib/badges/searchQuery';

describe('buildBadgeSearchParams', () => {
  it('builds query params for search filters', () => {
    const params = buildBadgeSearchParams(
      'test',
      'newest',
      {
        levels: [1, 2],
        categories: ['community', 'achievement'],
        community: 'passport',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      },
      2
    );

    expect(params.get('search')).toBe('test');
    expect(params.get('sortBy')).toBe('newest');
    expect(params.get('level')).toBe('1,2');
    expect(params.get('category')).toBe('community,achievement');
    expect(params.get('community')).toBe('passport');
    expect(params.get('startDate')).toBe('2026-01-01');
    expect(params.get('endDate')).toBe('2026-01-31');
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('20');
  });

  it('supports a custom page size limit', () => {
    const params = buildBadgeSearchParams(
      'custom',
      'popular',
      {
        levels: [],
        categories: [],
      },
      1,
      50
    );

    expect(params.get('limit')).toBe('50');
  });

  it('omits empty filters from the query string', () => {
    const params = buildBadgeSearchParams(
      '',
      'newest',
      {
        levels: [],
        categories: [],
      },
      1
    );

    expect(params.get('search')).toBeNull();
    expect(params.get('level')).toBeNull();
    expect(params.get('category')).toBeNull();
    expect(params.get('page')).toBe('1');
    expect(params.get('limit')).toBe('20');
  });
});
