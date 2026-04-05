/**
 * Canonical backend URL for all server-side Next.js API route proxies.
 *
 * Preferred env var: BACKEND_URL
 * Accepted aliases (backward compat): BACKEND_API_URL, NEXT_PUBLIC_API_URL
 *
 * Using NEXT_PUBLIC_API_URL in server-only route handlers is incorrect because
 * NEXT_PUBLIC_ vars are inlined at build time for the browser bundle; they work
 * on the server only by coincidence. BACKEND_URL is the correct server-side name.
 */
export const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';
