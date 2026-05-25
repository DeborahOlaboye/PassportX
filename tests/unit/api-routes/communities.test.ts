/**
 * Tests for GET and POST /api/communities
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request) => Promise<Response>;
let POST: (req: Request) => Promise<Response>;

const VALID_OWNER = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

beforeAll(async () => {
  const mod = await import('../../../src/app/api/communities/route');
  GET = mod.GET as unknown as typeof GET;
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ communities: [], total: 0 }),
  });
});

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/communities', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/communities', () => {
  const validBody = {
    txId: '0xabc123',
    name: 'Test Community',
    description: 'A test community',
    owner: VALID_OWNER,
    network: 'testnet',
    stxPayment: 100,
    theme: { primaryColor: '#ff0000', secondaryColor: '#0000ff' },
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      allowBadgeIssuance: true,
      allowCustomBadges: false,
    },
  };

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/communities', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makePostRequest({ txId: '0x1' }));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when owner is not a valid Stacks address', async () => {
    const res = await POST(
      makePostRequest({ ...validBody, owner: 'not-an-address' })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid website URL', async () => {
    const res = await POST(
      makePostRequest({ ...validBody, website: 'not-a-url' })
    );
    expect(res.status).toBe(400);
  });

  it('accepts valid https website URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ community: { _id: 'abc' } }),
    });
    const res = await POST(
      makePostRequest({ ...validBody, website: 'https://example.com' })
    );
    expect(res.status).toBe(201);
  });

  it('returns 400 for invalid network value', async () => {
    const res = await POST(
      makePostRequest({ ...validBody, network: 'devnet' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid hex color in theme', async () => {
    const res = await POST(
      makePostRequest({
        ...validBody,
        theme: { primaryColor: 'red', secondaryColor: '#000' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for tags exceeding item limit', async () => {
    const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    const res = await POST(
      makePostRequest({ ...validBody, tags: tooManyTags })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for tags containing empty string', async () => {
    const res = await POST(
      makePostRequest({ ...validBody, tags: ['valid', ''] })
    );
    expect(res.status).toBe(400);
  });

  it('forwards valid request to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      headers: { get: () => 'application/json' },
      json: async () => ({ community: { _id: 'abc123' } }),
    });
    const res = await POST(makePostRequest(validBody));
    expect(res.status).toBe(201);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/communities'),
      expect.any(Object)
    );
  });

  it('returns 400 for name exceeding 100 characters', async () => {
    const res = await POST(
      makePostRequest({ ...validBody, name: 'x'.repeat(101) })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/communities', () => {
  it('calls backend and returns community list', async () => {
    const req = new Request('http://localhost/api/communities');
    const res = await GET(req);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });

  it('sanitizes search param before forwarding', async () => {
    const req = new Request(
      'http://localhost/api/communities?search=hello%09world'
    );
    await GET(req);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('search=');
  });

  it('clamps limit to 100 maximum', async () => {
    const req = new Request('http://localhost/api/communities?limit=9999');
    await GET(req);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=100');
  });

  it('uses default limit of 10 for invalid limit param', async () => {
    const req = new Request('http://localhost/api/communities?limit=abc');
    await GET(req);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
  });
});
