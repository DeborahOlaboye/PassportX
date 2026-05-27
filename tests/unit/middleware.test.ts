import { middleware } from '../../src/middleware';

function mockRequest(pathname: string, token?: string, ip?: string) {
  const url = new URL(`http://localhost:3000${pathname}`);
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (ip) headers.set('x-forwarded-for', ip);
  return {
    nextUrl: url,
    headers,
    cookies: { get: () => undefined },
  };
}

describe('Frontend Middleware', () => {
  describe('public paths', () => {
    it('should allow access to login page', () => {
      const req = mockRequest('/login');
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it('should allow access to public assets', () => {
      const req = mockRequest('/public/assets/image.png');
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it('should allow access to sign page', () => {
      const req = mockRequest('/sign');
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe('authentication', () => {
    it('should redirect unauthenticated users to login', () => {
      const req = mockRequest('/passport');
      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location') || '';
      expect(location).toContain('/login');
      expect(location).toContain('redirect=%2Fpassport');
    });

    it('should allow authenticated users through', () => {
      const req = mockRequest('/passport', 'valid-token');
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });

  describe('security headers', () => {
    it('should set security headers on all responses', () => {
      const req = mockRequest('/login');
      const res = middleware(req);
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(res.headers.get('X-Frame-Options')).toBe('DENY');
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should set HSTS header', () => {
      const req = mockRequest('/login');
      const res = middleware(req);
      expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    it('should set Permissions-Policy header', () => {
      const req = mockRequest('/login');
      const res = middleware(req);
      expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within rate limit', () => {
      const req = mockRequest('/login', undefined, '10.0.0.1');
      const res = middleware(req);
      expect(res.status).toBe(200);
    });
  });
});
