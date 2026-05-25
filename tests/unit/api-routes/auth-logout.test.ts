/**
 * Tests for POST /api/auth/logout auth requirement
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/auth/logout/route');
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => null },
    json: async () => ({ message: 'Logged out' }),
  });
});

describe('POST /api/auth/logout', () => {
  it('returns 401 when neither cookie nor auth header is present', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('proceeds when cookie header is present', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'session=abc123; HttpOnly' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('proceeds when Authorization header is present', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer token123' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('forwards Authorization header to backend', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer mytoken' },
    });
    await POST(req);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer mytoken');
  });

  it('forwards set-cookie from backend to clear session', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      headers: {
        get: (name: string) =>
          name === 'set-cookie' ? 'session=; Max-Age=0; HttpOnly' : null,
      },
      json: async () => ({ message: 'Logged out' }),
    });
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'session=abc' },
    });
    const res = await POST(req);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
