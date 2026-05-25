import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { parsePositiveInt, sanitizeQueryParam } from '@/lib/api-validation';

const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limitRaw = searchParams.get('limit');

    if (!query) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    if (query.trim().length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return createErrorResponse(
        `Query string must be at most ${MAX_QUERY_LENGTH} characters`,
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    let limit = 10;
    if (limitRaw !== null) {
      const parsed = parsePositiveInt(limitRaw, 1, 100);
      if (parsed === null) {
        return createErrorResponse(
          'Invalid limit parameter: must be an integer between 1 and 100',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
      limit = parsed;
    }

    const sanitizedQuery = sanitizeQueryParam(query);

    const response = await fetch(
      `${BACKEND_URL}/api/badges/suggestions?q=${encodeURIComponent(
        sanitizedQuery
      )}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await parseBackendJson(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to fetch search suggestions', error);
  }
}
