/**
 * Tests for POST /api/users/passport/initialize
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    '../../../src/app/api/users/passport/initialize/route'
  );
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, passportId: 'pp-123' }),
  });
});

describe('POST /api/users/passport/initialize', () => {
  it('returns 401 when neither cookie nor auth header is provided', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
    });
    await POST(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error message when unauthenticated', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.error).toMatch(/authentication required/i);
  });

  it('forwards request when Authorization header is present', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer token123' },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('forwards request when session cookie is present', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
      headers: { Cookie: 'session=abc123' },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns 200 for valid authenticated request', async () => {
    const req = new Request('http://localhost/api/users/passport/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid-token' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
