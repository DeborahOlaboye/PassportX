/**
 * Tests for:
 *   GET  /api/auth/verify
 *   POST /api/auth/logout
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let verifyGET: (req: Request) => Promise<Response>;
let logoutPOST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const verifyMod = await import('../../../src/app/api/auth/verify/route');
  verifyGET = verifyMod.GET as unknown as typeof verifyGET;

  const logoutMod = await import('../../../src/app/api/auth/logout/route');
  logoutPOST = logoutMod.POST as unknown as typeof logoutPOST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: {
      get: (name: string) => {
        if (name === 'content-type') return 'application/json';
        if (name === 'set-cookie') return null;
        return null;
      },
    },
    json: async () => ({ authenticated: true, user: { id: 'user1' } }),
  });
});

describe('GET /api/auth/verify', () => {
  it('returns 401 when no cookie and no auth header are provided', async () => {
    const req = new Request('http://localhost/api/auth/verify');
    const res = await verifyGET(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const req = new Request('http://localhost/api/auth/verify');
    await verifyGET(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error message when unauthenticated', async () => {
    const req = new Request('http://localhost/api/auth/verify');
    const res = await verifyGET(req);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('forwards request when session cookie is present', async () => {
    const req = new Request('http://localhost/api/auth/verify', {
      headers: { Cookie: 'session=abc123' },
    });
    await verifyGET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('forwards request when Authorization header is present', async () => {
    const req = new Request('http://localhost/api/auth/verify', {
      headers: { Authorization: 'Bearer token123' },
    });
    await verifyGET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('passes the cookie to the backend', async () => {
    const req = new Request('http://localhost/api/auth/verify', {
      headers: { Cookie: 'session=my-cookie' },
    });
    await verifyGET(req);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Cookie).toBe('session=my-cookie');
  });
});

describe('POST /api/auth/logout', () => {
  it('forwards logout to backend', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'session=abc' },
    });
    await logoutPOST(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.any(Object)
    );
  });

  it('forwards cookies to backend on logout', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'session=logout-cookie' },
    });
    await logoutPOST(req);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Cookie).toBe('session=logout-cookie');
  });

  it('works without a cookie (unauthenticated logout)', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });
    const res = await logoutPOST(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
