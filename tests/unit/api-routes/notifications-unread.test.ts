/**
 * Tests for:
 *   GET /api/notifications/unread-count
 *   GET /api/notifications/stats
 *   PUT /api/notifications/read-all
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let unreadCountGET: (req: Request) => Promise<Response>;
let statsGET: (req: Request) => Promise<Response>;
let readAllPUT: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const unreadMod = await import(
    '../../../src/app/api/notifications/unread-count/route'
  );
  unreadCountGET = unreadMod.GET as unknown as typeof unreadCountGET;

  const statsMod = await import(
    '../../../src/app/api/notifications/stats/route'
  );
  statsGET = statsMod.GET as unknown as typeof statsGET;

  const readAllMod = await import(
    '../../../src/app/api/notifications/read-all/route'
  );
  readAllPUT = readAllMod.PUT as unknown as typeof readAllPUT;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ count: 3 }),
  });
});

function makeAuthRequest(url: string, method = 'GET'): Request {
  return new Request(url, {
    method,
    headers: { Authorization: 'Bearer token123' },
  });
}

describe('GET /api/notifications/unread-count', () => {
  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications/unread-count');
    const res = await unreadCountGET(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const req = new Request('http://localhost/api/notifications/unread-count');
    await unreadCountGET(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards authenticated request to backend', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications/unread-count'
    );
    const res = await unreadCountGET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('unread-count'),
      expect.any(Object)
    );
  });
});

describe('GET /api/notifications/stats', () => {
  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications/stats');
    const res = await statsGET(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const req = new Request('http://localhost/api/notifications/stats');
    await statsGET(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards authenticated request to backend', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications/stats');
    const res = await statsGET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('stats'),
      expect.any(Object)
    );
  });
});

describe('PUT /api/notifications/read-all', () => {
  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications/read-all', {
      method: 'PUT',
    });
    const res = await readAllPUT(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const req = new Request('http://localhost/api/notifications/read-all', {
      method: 'PUT',
    });
    await readAllPUT(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards authenticated request to backend', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications/read-all',
      'PUT'
    );
    const res = await readAllPUT(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('read-all'),
      expect.any(Object)
    );
  });
});
