/**
 * Tests for GET /api/badges/filters
 * This endpoint has no user-controlled parameters — verifies basic forwarding.
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/badges/filters/route');
  GET = mod.GET as unknown as typeof GET;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({
      categories: ['skill', 'participation'],
      levels: [1, 2, 3],
    }),
  });
});

describe('GET /api/badges/filters', () => {
  it('calls the backend to retrieve filter options', async () => {
    const req = new Request('http://localhost/api/badges/filters');
    await GET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/badges/filters'),
      expect.any(Object)
    );
  });

  it('returns 200 status with backend response', async () => {
    const req = new Request('http://localhost/api/badges/filters');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('returns Cache-Control header for CDN caching', async () => {
    const req = new Request('http://localhost/api/badges/filters');
    const res = await GET(req);
    const cacheControl = res.headers.get('cache-control');
    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain('s-maxage');
  });

  it('returns filter data in response body', async () => {
    const req = new Request('http://localhost/api/badges/filters');
    const res = await GET(req);
    const body = await res.json();
    expect(body.categories).toBeDefined();
  });
});
