/**
 * Tests for analytics API routes:
 *   GET  /api/analytics/walletconnect
 *   POST /api/analytics
 */

const mockDb = {
  collection: jest.fn().mockReturnValue({
    countDocuments: jest.fn().mockResolvedValue(0),
    distinct: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
  }),
};

jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({ db: mockDb }),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let walletconnectGET: (req: Request) => Promise<Response>;
let analyticsPOST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const wcMod = await import('../../../src/app/api/analytics/walletconnect/route');
  walletconnectGET = wcMod.GET as unknown as typeof walletconnectGET;

  const aMod = await import('../../../src/app/api/analytics/route');
  analyticsPOST = aMod.POST as unknown as typeof analyticsPOST;
});

beforeEach(() => {
  jest.clearAllMocks();
  const coll = mockDb.collection();
  (coll.countDocuments as jest.Mock).mockResolvedValue(5);
  (coll.distinct as jest.Mock).mockResolvedValue(['addr1', 'addr2']);
  (coll.aggregate as jest.Mock).mockReturnValue({
    toArray: jest.fn().mockResolvedValue([]),
  });
  (coll.insertOne as jest.Mock).mockResolvedValue({ insertedId: 'mock-id' });
});

function makeGetRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/analytics/walletconnect');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/analytics/walletconnect', () => {
  it('returns 400 for unrecognized range value', async () => {
    const req = makeGetRequest({ range: '1y' });
    const res = await walletconnectGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for uppercase range value', async () => {
    const req = makeGetRequest({ range: '7D' });
    const res = await walletconnectGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for numeric range value', async () => {
    const req = makeGetRequest({ range: '7' });
    const res = await walletconnectGET(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid range values', async () => {
    for (const range of ['24h', '7d', '30d', '90d', 'all']) {
      const req = makeGetRequest({ range });
      const res = await walletconnectGET(req);
      expect(res.status).toBe(200);
    }
  });

  it('uses default range 7d when not specified', async () => {
    const req = makeGetRequest({});
    const res = await walletconnectGET(req);
    expect(res.status).toBe(200);
  });
});

describe('POST /api/analytics', () => {
  it('returns 400 when eventName is missing', async () => {
    const req = makePostRequest({ timestamp: '2024-01-01T00:00:00Z' });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when timestamp is missing', async () => {
    const req = makePostRequest({ eventName: 'wallet_connected' });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when eventName is not in allowlist', async () => {
    const req = makePostRequest({
      eventName: 'arbitrary_event',
      timestamp: '2024-01-01T00:00:00Z',
    });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when timestamp is not a valid date string', async () => {
    const req = makePostRequest({
      eventName: 'wallet_connected',
      timestamp: 'not-a-date',
    });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }',
    });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid wallet_connected event', async () => {
    const req = makePostRequest({
      eventName: 'wallet_connected',
      timestamp: '2024-01-01T00:00:00.000Z',
      walletAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('accepts valid badge_minted event', async () => {
    const req = makePostRequest({
      eventName: 'badge_minted',
      timestamp: '2024-06-15T12:00:00.000Z',
    });
    const res = await analyticsPOST(req);
    expect(res.status).toBe(200);
  });

  it('inserts event into database for valid input', async () => {
    const req = makePostRequest({
      eventName: 'page_view',
      timestamp: '2024-01-01T00:00:00.000Z',
    });
    await analyticsPOST(req);
    const coll = mockDb.collection();
    expect(coll.insertOne).toHaveBeenCalledTimes(1);
  });
});
