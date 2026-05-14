/**
 * Tests for GET and PUT /api/users/profile
 */

const VALID_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const INVALID_ADDRESS = 'not-valid';
const VALID_CUSTOM_URL = 'alice-passport';
const INVALID_CUSTOM_URL = 'UPPERCASE';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request) => Promise<Response>;
let PUT: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/users/profile/route');
  GET = mod.GET as unknown as typeof GET;
  PUT = mod.PUT as unknown as typeof PUT;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true }),
  });
});

function makeGetRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/users/profile');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { method: 'GET' });
}

function makePutRequest(body: unknown, withAuth = true): Request {
  return new Request('http://localhost/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(withAuth && { Authorization: 'Bearer token123' }),
    },
    body: JSON.stringify(body),
  });
}

describe('GET /api/users/profile', () => {
  it('returns 400 when neither address nor customUrl is provided', async () => {
    const req = makeGetRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when address is invalid Stacks format', async () => {
    const req = makeGetRequest({ address: INVALID_ADDRESS });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when customUrl has invalid format', async () => {
    const req = makeGetRequest({ customUrl: INVALID_CUSTOM_URL });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when customUrl has consecutive hyphens', async () => {
    const req = makeGetRequest({ customUrl: 'alice--bob' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('forwards valid address to backend', async () => {
    const req = makeGetRequest({ address: VALID_ADDRESS });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_ADDRESS),
      expect.any(Object)
    );
  });

  it('forwards valid customUrl to backend', async () => {
    const req = makeGetRequest({ customUrl: VALID_CUSTOM_URL });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_CUSTOM_URL),
      expect.any(Object)
    );
  });

  it('does not call backend for invalid address', async () => {
    const req = makeGetRequest({ address: INVALID_ADDRESS });
    await GET(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('PUT /api/users/profile', () => {
  it('returns 401 when no Authorization header', async () => {
    const req = makePutRequest({ name: 'Alice' }, false);
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
      body: '{ this is not json }',
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const req = makePutRequest({ name: 'a'.repeat(101) });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const req = makePutRequest({ email: 'not-an-email' });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('forwards valid body to backend', async () => {
    const req = makePutRequest({ name: 'Alice', bio: 'Hello' });
    await PUT(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
