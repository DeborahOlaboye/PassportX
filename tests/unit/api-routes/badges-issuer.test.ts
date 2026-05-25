/**
 * Tests for GET /api/badges/issuer/[address]
 */

const VALID_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const INVALID_ADDRESS = 'not-a-stacks-address';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (
  req: Request,
  ctx: { params: { address: string } }
) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    '../../../src/app/api/badges/issuer/[address]/route'
  );
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

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/badges/issuer/address');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/badges/issuer/[address]', () => {
  it('returns 400 for invalid Stacks address', async () => {
    const req = makeRequest();
    const res = await GET(req, { params: { address: INVALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty address', async () => {
    const req = makeRequest();
    const res = await GET(req, { params: { address: '' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when page is 0', async () => {
    const req = makeRequest({ page: '0' });
    const res = await GET(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit is 0', async () => {
    const req = makeRequest({ limit: '0' });
    const res = await GET(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when limit exceeds 100', async () => {
    const req = makeRequest({ limit: '101' });
    const res = await GET(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric page', async () => {
    const req = makeRequest({ page: 'first' });
    const res = await GET(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid address', async () => {
    const req = makeRequest();
    await GET(req, { params: { address: INVALID_ADDRESS } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards valid address to backend', async () => {
    const req = makeRequest();
    await GET(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_ADDRESS),
      expect.any(Object)
    );
  });

  it('uses default page=1 and limit=20 when not specified', async () => {
    const req = makeRequest();
    await GET(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=1.*limit=20|limit=20.*page=1/),
      expect.any(Object)
    );
  });

  it('accepts valid page and limit', async () => {
    const req = makeRequest({ page: '3', limit: '50' });
    const res = await GET(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=3'),
      expect.any(Object)
    );
  });
});
