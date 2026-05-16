import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { parseBackendJson } from '@/lib/backend-proxy';
import { BACKEND_URL } from '@/lib/config';
import { isNonEmptyString } from '@/lib/api-validation';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Request body must be valid JSON', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return createErrorResponse('Request body must be a JSON object', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const b = body as Record<string, unknown>;

    if (!isNonEmptyString(b.address)) {
      return createErrorResponse(
        'address is required and must be a non-empty string',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    if (!isNonEmptyString(b.signature)) {
      return createErrorResponse(
        'signature is required and must be a non-empty string',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendJson(response);

    const backendResponse = NextResponse.json(data, {
      status: response.status,
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      backendResponse.headers.set('set-cookie', setCookieHeader);
    }

    return backendResponse;
  } catch (error) {
    return createErrorResponse('Failed to authenticate', error);
  }
}
