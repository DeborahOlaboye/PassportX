/**
 * Tests for notification API routes:
 *   GET  /api/notifications
 *   PUT  /api/notifications/[id]
 *   DELETE /api/notifications/[id]
 */

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
const SHORT_ID = '507f1f77bcf86cd79943901';
const NON_HEX_ID = '507f1f77bcf86cd79943901g';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let notificationListGET: (req: Request) => Promise<Response>;
let notificationIdPUT: (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;
let notificationIdDELETE: (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;

beforeAll(async () => {
  const listMod = await import('../../../src/app/api/notifications/route');
  notificationListGET = listMod.GET as unknown as typeof notificationListGET;

  const idMod = await import('../../../src/app/api/notifications/[id]/route');
  notificationIdPUT = idMod.PUT as unknown as typeof notificationIdPUT;
  notificationIdDELETE = idMod.DELETE as unknown as typeof notificationIdDELETE;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true }),
  });
});

function makeAuthRequest(url: string, method = 'GET'): Request {
  return new Request(url, {
    method,
    headers: { Authorization: 'Bearer token123' },
  });
}

function makeIdContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/notifications', () => {
  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications');
    const res = await notificationListGET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for page=0', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications?page=0');
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for limit=0', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications?limit=0');
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for limit=101', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications?limit=101');
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative page', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications?page=-1');
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric limit', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications?limit=abc');
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid type filter', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications?type=unknown_type'
    );
    const res = await notificationListGET(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid page and limit', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications?page=2&limit=20'
    );
    const res = await notificationListGET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accepts valid notification type filter', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications?type=badge_minted'
    );
    const res = await notificationListGET(req);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/notifications/[id]', () => {
  it('returns 400 when id is too short', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications/id/read', 'PUT');
    const res = await notificationIdPUT(req, makeIdContext(SHORT_ID));
    expect(res.status).toBe(400);
  });

  it('returns 400 when id contains non-hex chars', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications/id/read', 'PUT');
    const res = await notificationIdPUT(req, makeIdContext(NON_HEX_ID));
    expect(res.status).toBe(400);
  });

  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications/id/read', {
      method: 'PUT',
    });
    const res = await notificationIdPUT(req, makeIdContext(VALID_OBJECT_ID));
    expect(res.status).toBe(401);
  });

  it('does not call backend for invalid id', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications/id/read', 'PUT');
    await notificationIdPUT(req, makeIdContext(SHORT_ID));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('forwards valid id to backend', async () => {
    const req = makeAuthRequest('http://localhost/api/notifications/id/read', 'PUT');
    await notificationIdPUT(req, makeIdContext(VALID_OBJECT_ID));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_OBJECT_ID),
      expect.any(Object)
    );
  });
});

describe('DELETE /api/notifications/[id]', () => {
  it('returns 400 when id is invalid', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications/id',
      'DELETE'
    );
    const res = await notificationIdDELETE(req, makeIdContext(SHORT_ID));
    expect(res.status).toBe(400);
  });

  it('returns 401 when no auth header', async () => {
    const req = new Request('http://localhost/api/notifications/id', {
      method: 'DELETE',
    });
    const res = await notificationIdDELETE(req, makeIdContext(VALID_OBJECT_ID));
    expect(res.status).toBe(401);
  });

  it('forwards valid delete to backend', async () => {
    const req = makeAuthRequest(
      'http://localhost/api/notifications/id',
      'DELETE'
    );
    await notificationIdDELETE(req, makeIdContext(VALID_OBJECT_ID));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(VALID_OBJECT_ID),
      expect.any(Object)
    );
  });
});
