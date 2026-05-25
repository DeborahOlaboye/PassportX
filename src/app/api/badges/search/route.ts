import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { parsePositiveInt, sanitizeQueryParam } from '@/lib/api-validation';

const MAX_QUERY_LENGTH = 200;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limitRaw = searchParams.get('limit');
    const pageRaw = searchParams.get('page');

    if (query !== null && query.length > MAX_QUERY_LENGTH) {
      return createErrorResponse(
        `Query string must be at most ${MAX_QUERY_LENGTH} characters`,
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    if (limitRaw !== null) {
      const parsed = parsePositiveInt(limitRaw, 1, 100);
      if (parsed === null) {
        return createErrorResponse(
          'Invalid limit parameter: must be an integer between 1 and 100',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
    }

    if (pageRaw !== null) {
      const parsed = parsePositiveInt(pageRaw, 1, 10000);
      if (parsed === null) {
        return createErrorResponse(
          'Invalid page parameter: must be a positive integer',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
    }

    const safeParams = new URLSearchParams();
    if (query !== null) {
      safeParams.set('q', encodeURIComponent(sanitizeQueryParam(query)));
    }
    if (limitRaw !== null) safeParams.set('limit', limitRaw);
    if (pageRaw !== null) safeParams.set('page', pageRaw);

    // Forward other safe params (category, level, etc.)
    for (const [key, value] of searchParams.entries()) {
      if (!['q', 'limit', 'page'].includes(key)) {
        safeParams.set(key, value);
      }
    }

    const response = await fetch(
      `${BACKEND_URL}/api/badges/search?${safeParams.toString()}`,
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
    return createErrorResponse('Failed to search badges', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Request body must be valid JSON', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return createErrorResponse('Request body must be a JSON object', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/badges/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendJson(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to search badges', error);
  }
}
