/**
 * Tests for GET and PUT /api/users/[address]
 * Verifies that invalid Stacks addresses and malformed bodies are rejected
 * before the request is forwarded to the backend.
 */

const VALID_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const INVALID_ADDRESS = 'not-a-stacks-address';
const SHORT_ADDRESS = 'SP123';

// Minimal mock for fetch so we can verify proxying behaviour
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

// Lazily import the route handlers after mocks are set up
let GET: (
  req: Request,
  ctx: { params: { address: string } }
) => Promise<Response>;
let PUT: (
  req: Request,
  ctx: { params: { address: string } }
) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/users/[address]/route');
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

function makeRequest(method = 'GET', body?: unknown): Request {
  return new Request('http://localhost/api/users/address', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

describe('GET /api/users/[address]', () => {
  it('returns 400 when address is not a valid Stacks address', async () => {
    const req = makeRequest('GET');
    const res = await GET(req, { params: { address: INVALID_ADDRESS } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid stacks address/i);
  });

  it('returns 400 when address is too short', async () => {
    const req = makeRequest('GET');
    const res = await GET(req, { params: { address: SHORT_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when address has invalid prefix', async () => {
    const req = makeRequest('GET');
    const res = await GET(req, {
      params: { address: 'AB2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7' },
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty address', async () => {
    const req = makeRequest('GET');
    const res = await GET(req, { params: { address: '' } });
    expect(res.status).toBe(400);
  });

  it('does NOT call fetch when address is invalid', async () => {
    const req = makeRequest('GET');
    await GET(req, { params: { address: INVALID_ADDRESS } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards request to backend when address is valid', async () => {
    const req = makeRequest('GET');
    await GET(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_ADDRESS),
      expect.any(Object)
    );
  });
});

describe('PUT /api/users/[address]', () => {
  it('returns 400 when address is invalid', async () => {
    const req = makeRequest('PUT', { name: 'Alice' });
    const res = await PUT(req, { params: { address: INVALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name exceeds 100 characters', async () => {
    const req = makeRequest('PUT', { name: 'a'.repeat(101) });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 when bio exceeds 500 characters', async () => {
    const req = makeRequest('PUT', { bio: 'x'.repeat(501) });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid format', async () => {
    const req = makeRequest('PUT', { email: 'bad-email' });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('forwards valid request to backend', async () => {
    const req = makeRequest('PUT', { name: 'Alice', bio: 'Hello world' });
    await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accepts valid email in body', async () => {
    const req = makeRequest('PUT', { email: 'alice@example.com' });
    await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
