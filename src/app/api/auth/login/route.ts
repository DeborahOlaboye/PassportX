import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

    const data = await response.json();

    // If login successful, set cookie from backend response
    const backendResponse = NextResponse.json(data, { status: response.status });

    // Forward cookies from backend
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      backendResponse.headers.set('set-cookie', setCookieHeader);
    }

    return backendResponse;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}
