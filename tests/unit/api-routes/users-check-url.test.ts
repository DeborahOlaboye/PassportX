/**
 * Tests for GET /api/users/profile/check-url/[customUrl]
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request, ctx: { params: { customUrl: string } }) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    '../../../src/app/api/users/profile/check-url/[customUrl]/route'
  );
  GET = mod.GET as unknown as typeof GET;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ available: true }),
  });
});

function makeRequest(customUrl: string): Request {
  return new Request(`http://localhost/api/users/profile/check-url/${customUrl}`, {
    method: 'GET',
  });
}

describe('GET /api/users/profile/check-url/[customUrl]', () => {
  it('returns 400 for uppercase slug', async () => {
    const res = await GET(makeRequest('Alice'), { params: { customUrl: 'Alice' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug that is too short (2 chars)', async () => {
    const res = await GET(makeRequest('ab'), { params: { customUrl: 'ab' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug that is too long (31 chars)', async () => {
    const slug = 'a' + 'b'.repeat(29) + 'c';
    const res = await GET(makeRequest(slug), { params: { customUrl: slug } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug with leading hyphen', async () => {
    const res = await GET(makeRequest('-alice'), { params: { customUrl: '-alice' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug with trailing hyphen', async () => {
    const res = await GET(makeRequest('alice-'), { params: { customUrl: 'alice-' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for slug with consecutive hyphens', async () => {
    const res = await GET(makeRequest('alice--bob'), {
      params: { customUrl: 'alice--bob' },
    });
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid slug', async () => {
    await GET(makeRequest('INVALID'), { params: { customUrl: 'INVALID' } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards valid slug to backend', async () => {
    const slug = 'alice-passport';
    await GET(makeRequest(slug), { params: { customUrl: slug } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(slug),
      expect.any(Object)
    );
  });

  it('accepts a 3-character slug', async () => {
    const slug = 'abc';
    const res = await GET(makeRequest(slug), { params: { customUrl: slug } });
    expect(res.status).toBe(200);
  });

  it('accepts a 30-character slug', async () => {
    const slug = 'a' + 'b'.repeat(28) + 'c';
    const res = await GET(makeRequest(slug), { params: { customUrl: slug } });
    expect(res.status).toBe(200);
  });
});
