import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { parseBackendJson } from '@/lib/backend-proxy';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return createErrorResponse('Authorization required', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse(
      'Failed to mark all notifications as read',
      error
    );
  }
}
