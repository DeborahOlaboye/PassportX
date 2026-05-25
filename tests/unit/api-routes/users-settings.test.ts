/**
 * Tests for PUT /api/users/[address]/settings
 */

const VALID_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const INVALID_ADDRESS = 'invalid-address';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let PUT: (
  req: Request,
  ctx: { params: { address: string } }
) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    '../../../src/app/api/users/[address]/settings/route'
  );
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

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/users/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    },
    body: JSON.stringify(body),
  });
}

describe('PUT /api/users/[address]/settings', () => {
  it('returns 400 for invalid Stacks address', async () => {
    const req = makeRequest({ theme: 'dark' });
    const res = await PUT(req, { params: { address: INVALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty address', async () => {
    const req = makeRequest({ theme: 'dark' });
    const res = await PUT(req, { params: { address: '' } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when emailNotifications is not boolean', async () => {
    const req = makeRequest({ emailNotifications: 'yes' });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when visibility has invalid value', async () => {
    const req = makeRequest({ visibility: 'everyone' });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when theme has invalid value', async () => {
    const req = makeRequest({ theme: 'neon' });
    const res = await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid address', async () => {
    const req = makeRequest({ theme: 'dark' });
    await PUT(req, { params: { address: INVALID_ADDRESS } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards valid settings to backend', async () => {
    const req = makeRequest({
      emailNotifications: true,
      theme: 'dark',
      visibility: 'public',
    });
    await PUT(req, { params: { address: VALID_ADDRESS } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_ADDRESS),
      expect.any(Object)
    );
  });

  it('accepts all valid visibility values', async () => {
    for (const v of ['public', 'private', 'friends']) {
      const req = makeRequest({ visibility: v });
      const res = await PUT(req, { params: { address: VALID_ADDRESS } });
      expect(res.status).toBe(200);
    }
  });

  it('accepts all valid theme values', async () => {
    for (const t of ['light', 'dark', 'system']) {
      const req = makeRequest({ theme: t });
      const res = await PUT(req, { params: { address: VALID_ADDRESS } });
      expect(res.status).toBe(200);
    }
  });
});
