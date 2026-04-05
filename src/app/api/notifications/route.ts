import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';


/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return createErrorResponse('Authorization required', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/notifications?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to fetch notifications', error);
  }
}
