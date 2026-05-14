import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { parsePositiveInt } from '@/lib/api-validation';

const ALLOWED_NOTIFICATION_TYPES = [
  'badge_minted',
  'badge_revoked',
  'community_joined',
  'community_invite',
  'system',
  'announcement',
] as const;

/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return createErrorResponse('Authorization required', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');
    const type = searchParams.get('type');

    if (pageRaw !== null) {
      const page = parsePositiveInt(pageRaw, 1, 10000);
      if (page === null) {
        return createErrorResponse(
          'Invalid page parameter: must be a positive integer between 1 and 10000',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
    }

    if (limitRaw !== null) {
      const limit = parsePositiveInt(limitRaw, 1, 100);
      if (limit === null) {
        return createErrorResponse(
          'Invalid limit parameter: must be an integer between 1 and 100',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
    }

    if (type !== null) {
      const allowedTypes: readonly string[] = ALLOWED_NOTIFICATION_TYPES;
      if (!allowedTypes.includes(type)) {
        return createErrorResponse(
          `Invalid type parameter: must be one of ${ALLOWED_NOTIFICATION_TYPES.join(', ')}`,
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
    }

    const queryString = searchParams.toString();

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

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to fetch notifications', error);
  }
}
