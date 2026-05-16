import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { parseBackendJson } from '@/lib/backend-proxy';
import { BACKEND_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    if (!cookie && !authHeader) {
      return createErrorResponse(
        'Authentication required: provide a session cookie or Authorization header',
        null,
        { status: 401, logLevel: 'warn' }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
        ...(authHeader && { Authorization: authHeader }),
      },
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
    return createErrorResponse('Failed to logout', error);
  }
}
