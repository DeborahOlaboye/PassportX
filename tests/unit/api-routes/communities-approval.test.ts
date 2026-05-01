/**
 * Tests for GET and POST /api/communities/[communityId]/approval
 */

const VALID_COMMUNITY_ID = '507f1f77bcf86cd799439011';
const INVALID_COMMUNITY_ID = 'not-a-valid-id';
const VALID_ADDRESS = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const INVALID_ADDRESS = 'not-an-address';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let GET: (req: Request, ctx: { params: { communityId: string } }) => Promise<Response>;
let POST: (req: Request, ctx: { params: { communityId: string } }) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    '../../../src/app/api/communities/[communityId]/approval/route'
  );
  GET = mod.GET as unknown as typeof GET;
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true }),
  });
});

function makeGetRequest(): Request {
  return new Request(
    `http://localhost/api/communities/${VALID_COMMUNITY_ID}/approval`
  );
}

function makePostRequest(body: unknown): Request {
  return new Request(
    `http://localhost/api/communities/${VALID_COMMUNITY_ID}/approval`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

describe('GET /api/communities/[communityId]/approval', () => {
  it('returns 400 for invalid communityId', async () => {
    const req = makeGetRequest();
    const res = await GET(req, { params: { communityId: INVALID_COMMUNITY_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short communityId', async () => {
    const req = makeGetRequest();
    const res = await GET(req, { params: { communityId: '12345' } });
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid communityId', async () => {
    const req = makeGetRequest();
    await GET(req, { params: { communityId: INVALID_COMMUNITY_ID } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards request to backend for valid communityId', async () => {
    const req = makeGetRequest();
    await GET(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_COMMUNITY_ID),
      expect.any(Object)
    );
  });
});

describe('POST /api/communities/[communityId]/approval', () => {
  it('returns 400 for invalid communityId', async () => {
    const req = makePostRequest({
      approved: true,
      approverAddress: VALID_ADDRESS,
    });
    const res = await POST(req, { params: { communityId: INVALID_COMMUNITY_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when approverAddress is missing', async () => {
    const req = makePostRequest({ approved: true });
    const res = await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when approverAddress is invalid Stacks format', async () => {
    const req = makePostRequest({
      approved: true,
      approverAddress: INVALID_ADDRESS,
    });
    const res = await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rejecting without a reason', async () => {
    const req = makePostRequest({
      approved: false,
      approverAddress: VALID_ADDRESS,
    });
    const res = await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(res.status).toBe(400);
  });

  it('does not call backend for invalid communityId', async () => {
    const req = makePostRequest({
      approved: true,
      approverAddress: VALID_ADDRESS,
    });
    await POST(req, { params: { communityId: INVALID_COMMUNITY_ID } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards valid approve request to backend', async () => {
    const req = makePostRequest({
      approved: true,
      approverAddress: VALID_ADDRESS,
    });
    await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('approve'),
      expect.any(Object)
    );
  });

  it('forwards valid reject request with reason to backend', async () => {
    const req = makePostRequest({
      approved: false,
      approverAddress: VALID_ADDRESS,
      reason: 'Does not meet community guidelines',
    });
    await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('reject'),
      expect.any(Object)
    );
  });

  it('returns success response for valid approval', async () => {
    const req = makePostRequest({
      approved: true,
      approverAddress: VALID_ADDRESS,
    });
    const res = await POST(req, { params: { communityId: VALID_COMMUNITY_ID } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Community approved');
  });
});
