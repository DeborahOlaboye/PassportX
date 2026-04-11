import { NextResponse } from 'next/server';

/**
 * Maximum allowed size for backend response bodies (10 MB).
 */
export const MAX_RESPONSE_BODY_SIZE = 10 * 1024 * 1024;

/**
 * Configuration options for backend response validation.
 */
export interface BackendResponseValidationOptions {
  maxBodySize?: number;
  allowedContentTypes?: string[];
}

/**
 * Default validation options for backend responses.
 */
export const DEFAULT_VALIDATION_OPTIONS: BackendResponseValidationOptions = {
  maxBodySize: MAX_RESPONSE_BODY_SIZE,
  allowedContentTypes: ['application/json', 'text/plain', 'text/html'],
};

/**
 * Safely parse JSON from a backend response.
 * If the response body is not valid JSON (e.g. HTML error page, empty body),
 * returns a fallback object with the HTTP status text instead of throwing.
 */
export async function parseBackendJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  // Non-JSON body — backend may have returned an HTML error page or plain text
  const text = await response.text();
  return { error: text.trim() || response.statusText };
}

/**
 * Proxy a backend response directly to the client, safely parsing the body.
 * Preserves the original HTTP status code from the backend.
 */
export async function proxyBackendResponse(
  response: Response,
  extraHeaders?: Record<string, string>
): Promise<NextResponse> {
  const data = await parseBackendJson(response);
  return NextResponse.json(data, {
    status: response.status,
    headers: extraHeaders,
  });
}
