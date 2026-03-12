import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    const response = await fetch(
      `${BACKEND_URL}/api/users/passport/initialize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookie && { Cookie: cookie }),
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to initialize passport', error);
  }
}
