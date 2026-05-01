/**
 * Tests for POST /api/users/profile/avatar
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('@/lib/config', () => ({ BACKEND_URL: 'http://backend-mock:3001' }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import('../../../src/app/api/users/profile/avatar/route');
  POST = mod.POST as unknown as typeof POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ success: true, avatarUrl: 'https://cdn/avatar.jpg' }),
  });
});

function makeFileFormData(name: string, type: string, size: number): FormData {
  const content = new Uint8Array(size).fill(1);
  const file = new File([content], name, { type });
  const formData = new FormData();
  formData.set('avatar', file);
  return formData;
}

function makeRequest(formData: FormData, withAuth = true): Request {
  return new Request('http://localhost/api/users/profile/avatar', {
    method: 'POST',
    headers: {
      ...(withAuth && { Authorization: 'Bearer token123' }),
    },
    body: formData,
  });
}

describe('POST /api/users/profile/avatar', () => {
  it('returns 401 when no Authorization header', async () => {
    const fd = makeFileFormData('photo.jpg', 'image/jpeg', 1024);
    const req = makeRequest(fd, false);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('does not call backend when unauthenticated', async () => {
    const fd = makeFileFormData('photo.jpg', 'image/jpeg', 1024);
    const req = makeRequest(fd, false);
    await POST(req);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 400 when avatar field is missing', async () => {
    const formData = new FormData();
    const req = makeRequest(formData);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported file type', async () => {
    const fd = makeFileFormData('doc.pdf', 'application/pdf', 1024);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unsupported file type/i);
  });

  it('returns 400 for text/plain file type', async () => {
    const fd = makeFileFormData('readme.txt', 'text/plain', 100);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when file exceeds 5 MB', async () => {
    const fiveMBPlusOne = 5 * 1024 * 1024 + 1;
    const fd = makeFileFormData('large.jpg', 'image/jpeg', fiveMBPlusOne);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/file too large/i);
  });

  it('accepts image/jpeg file', async () => {
    const fd = makeFileFormData('photo.jpg', 'image/jpeg', 1024);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('accepts image/png file', async () => {
    const fd = makeFileFormData('avatar.png', 'image/png', 2048);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts image/webp file', async () => {
    const fd = makeFileFormData('photo.webp', 'image/webp', 1024);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts image/gif file', async () => {
    const fd = makeFileFormData('anim.gif', 'image/gif', 512);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('accepts file at exact 5 MB limit', async () => {
    const exactly5MB = 5 * 1024 * 1024;
    const fd = makeFileFormData('big.jpg', 'image/jpeg', exactly5MB);
    const req = makeRequest(fd);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
