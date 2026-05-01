/**
 * Tests for GET /api/badges/trending
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/badges/trending/route');
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
  const url = new URL('http://localhost/api/badges/trending');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/badges/trending', () => {
  it('returns 400 when days is 0', async () => {
    const req = makeRequest({ days: '0' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when days is 366', async () => {
    const req = makeRequest({ days: '366' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative days', async () => {
    const req = makeRequest({ days: '-1' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric days', async () => {
    const req = makeRequest({ days: 'last-week' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is 0', async () => {
    const req = makeRequest({ limit: '0' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is 101', async () => {
    const req = makeRequest({ limit: '101' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric limit', async () => {
    const req = makeRequest({ limit: 'all' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid params', async () => {
    const req = makeRequest({ days: '0' });
    await GET(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uses default days=7 and limit=10 when not specified', async () => {
    const req = makeRequest({});
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('days=7'),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=10'),
      expect.any(Object)
    );
  });

  it('accepts valid days value', async () => {
    const req = makeRequest({ days: '30' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.any(Object)
    );
  });

  it('accepts days at boundary value 365', async () => {
    const req = makeRequest({ days: '365' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('accepts limit at boundary value 100', async () => {
    const req = makeRequest({ limit: '100' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
