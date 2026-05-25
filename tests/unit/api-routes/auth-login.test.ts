/**
 * Tests for POST /api/auth/login
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/auth/login/route');
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ token: 'abc123' }),
  });
});

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/login', () => {
  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 for array body', async () => {
    const res = await POST(
      makeRequest([{ address: 'SP123', signature: 'sig' }])
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when address is missing', async () => {
    const res = await POST(makeRequest({ signature: 'valid-sig-value' }));
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when address is empty string', async () => {
    const res = await POST(makeRequest({ address: '', signature: 'valid-sig' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature is missing', async () => {
    const res = await POST(
      makeRequest({ address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7' })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when signature is empty string', async () => {
    const res = await POST(
      makeRequest({
        address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        signature: '',
      })
    );
    expect(res.status).toBe(400);
  });

  it('forwards valid request to backend', async () => {
    const res = await POST(
      makeRequest({
        address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        signature: 'valid-hex-signature-value',
      })
    );
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.any(Object)
    );
  });

  it('forwards set-cookie header from backend response', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      headers: {
        get: (name: string) =>
          name === 'set-cookie' ? 'session=abc; HttpOnly' : 'application/json',
      },
      json: async () => ({ token: 'abc' }),
    });
    const res = await POST(
      makeRequest({
        address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        signature: 'valid-sig',
      })
    );
    expect(res.headers.get('set-cookie')).toBe('session=abc; HttpOnly');
  });
});
