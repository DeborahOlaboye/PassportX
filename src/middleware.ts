import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/sign', '/api/auth', '/public', '/_next/static', '/favicon.ico', '/logo.png'];
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path) || pathname === path);
}

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const sessionCookie = request.cookies.get('session');
  return sessionCookie?.value || null;
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

function addSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https:;"
  );
}

function logRequest(pathname: string, status: number, durationMs: number): void {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${pathname} -> ${status} (${durationMs}ms)`;
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    console.warn(message);
  }
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    logRequest(pathname, 429, Date.now() - startTime);
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response.headers);
    logRequest(pathname, response.status, Date.now() - startTime);
    return response;
  }

  const token = getAuthToken(request);
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    logRequest(pathname, 307, Date.now() - startTime);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', crypto.randomUUID());
  requestHeaders.set('x-request-start', startTime.toString());

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  addSecurityHeaders(response.headers);
  logRequest(pathname, response.status, Date.now() - startTime);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
