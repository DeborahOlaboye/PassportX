import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { parseBackendJson } from '@/lib/backend-proxy';
import { BACKEND_URL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendJson(response);

    // If login successful, set cookie from backend response
    const backendResponse = NextResponse.json(data, {
      status: response.status,
    });

    // Forward cookies from backend
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      backendResponse.headers.set('set-cookie', setCookieHeader);
    }

    return backendResponse;
  } catch (error) {
    return createErrorResponse('Failed to authenticate', error);
  }
}
