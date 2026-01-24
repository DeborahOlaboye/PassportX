import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Forward cookies to backend
    const cookie = request.headers.get('cookie');

    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to verify session', error);
  }
}
