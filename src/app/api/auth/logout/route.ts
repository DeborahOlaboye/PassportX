import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    // Forward cookies to backend
    const cookie = request.headers.get('cookie');

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
      },
    });

    const data = await response.json();

    // Forward set-cookie header from backend
    const backendResponse = NextResponse.json(data, { status: response.status });
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      backendResponse.headers.set('set-cookie', setCookieHeader);
    }

    return backendResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to logout' },
      { status: 500 }
    );
  }
}
