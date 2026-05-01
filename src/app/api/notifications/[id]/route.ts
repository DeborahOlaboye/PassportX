import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { isValidObjectId } from '@/lib/api-validation';

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse(
        'Invalid notification ID: must be a 24-character hexadecimal string',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return createErrorResponse('Authorization required', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/notifications/${id}/read`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
      }
    );

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to mark notification as read', error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return createErrorResponse(
        'Invalid notification ID: must be a 24-character hexadecimal string',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return createErrorResponse('Authorization required', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
    });

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to delete notification', error);
  }
}
