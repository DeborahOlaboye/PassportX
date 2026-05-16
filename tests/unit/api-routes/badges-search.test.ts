/**
 * Tests for GET and POST /api/badges/search
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: import('next/server').NextRequest) => Promise<Response>;
let POST: (req: import('next/server').NextRequest) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/badges/search/route');
  GET = mod.GET as unknown as typeof GET;
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ results: [], total: 0 }),
  });
});

describe('GET /api/badges/search', () => {
  it('forwards request to backend when no query is provided', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/badges/search');
    await GET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when query exceeds 200 characters', async () => {
    const { NextRequest } = await import('next/server');
    const longQ = 'a'.repeat(201);
    const req = new NextRequest(
      `http://localhost/api/badges/search?q=${longQ}`
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('accepts query of exactly 200 characters', async () => {
    const { NextRequest } = await import('next/server');
    const q = 'a'.repeat(200);
    const req = new NextRequest(`http://localhost/api/badges/search?q=${q}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid limit param', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/badges/search?q=test&limit=abc'
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for limit out of range', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/badges/search?q=test&limit=0'
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid limit within range', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/badges/search?q=test&limit=25'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid page param', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/badges/search?q=test&page=-1'
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('sanitizes query before forwarding to backend', async () => {
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/badges/search?q=hello%09world'
    );
    await GET(req);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('badges/search');
  });
});

describe('POST /api/badges/search', () => {
  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/badges/search', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for array body', async () => {
    const req = new Request('http://localhost/api/badges/search', {
      method: 'POST',
      body: JSON.stringify([{ q: 'test' }]),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(400);
  });

  it('forwards valid object body to backend', async () => {
    const req = new Request('http://localhost/api/badges/search', {
      method: 'POST',
      body: JSON.stringify({ filters: { category: 'skill' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as unknown as import('next/server').NextRequest);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
