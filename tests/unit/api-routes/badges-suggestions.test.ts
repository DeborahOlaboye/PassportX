/**
 * Tests for GET /api/badges/suggestions
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/badges/suggestions/route');
  GET = mod.GET as unknown as typeof GET;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, data: [] }),
  });
});

function makeRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/badges/suggestions');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/badges/suggestions', () => {
  it('returns empty data when q is missing', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns empty data when q is whitespace only', async () => {
    const req = makeRequest({ q: '   ' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when q exceeds 100 characters', async () => {
    const req = makeRequest({ q: 'a'.repeat(101) });
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when limit is 0', async () => {
    const req = makeRequest({ q: 'test', limit: '0' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is 101', async () => {
    const req = makeRequest({ q: 'test', limit: '101' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative limit', async () => {
    const req = makeRequest({ q: 'test', limit: '-5' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric limit', async () => {
    const req = makeRequest({ q: 'test', limit: 'abc' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('forwards valid request to backend', async () => {
    const req = makeRequest({ q: 'passport', limit: '10' });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=passport'),
      expect.any(Object)
    );
  });

  it('uses default limit of 10 when not specified', async () => {
    const req = makeRequest({ q: 'test' });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
      expect.any(Object)
    );
  });

  it('accepts limit at boundary value 1', async () => {
    const req = makeRequest({ q: 'test', limit: '1' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=1'),
      expect.any(Object)
    );
  });

  it('accepts limit at boundary value 100', async () => {
    const req = makeRequest({ q: 'test', limit: '100' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
