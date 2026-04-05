describe('BACKEND_URL config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('uses BACKEND_URL when set', async () => {
    process.env.BACKEND_URL = 'http://backend:4000';
    delete process.env.BACKEND_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    const { BACKEND_URL } = await import('../config');
    expect(BACKEND_URL).toBe('http://backend:4000');
  });

  it('falls back to BACKEND_API_URL when BACKEND_URL is not set', async () => {
    delete process.env.BACKEND_URL;
    process.env.BACKEND_API_URL = 'http://api-url:4001';
    delete process.env.NEXT_PUBLIC_API_URL;
    const { BACKEND_URL } = await import('../config');
    expect(BACKEND_URL).toBe('http://api-url:4001');
  });

  it('falls back to NEXT_PUBLIC_API_URL as last alias', async () => {
    delete process.env.BACKEND_URL;
    delete process.env.BACKEND_API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://public-api:5000';
    const { BACKEND_URL } = await import('../config');
    expect(BACKEND_URL).toBe('http://public-api:5000');
  });

  it('falls back to localhost:3001 when no env var is set', async () => {
    delete process.env.BACKEND_URL;
    delete process.env.BACKEND_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    const { BACKEND_URL } = await import('../config');
    expect(BACKEND_URL).toBe('http://localhost:3001');
  });

  it('BACKEND_URL takes precedence over aliases', async () => {
    process.env.BACKEND_URL = 'http://preferred:4000';
    process.env.BACKEND_API_URL = 'http://alias1:4001';
    process.env.NEXT_PUBLIC_API_URL = 'http://alias2:5000';
    const { BACKEND_URL } = await import('../config');
    expect(BACKEND_URL).toBe('http://preferred:4000');
  });
});
