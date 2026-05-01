import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { parsePositiveInt } from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysRaw = searchParams.get('days');
    const limitRaw = searchParams.get('limit');

    let days = 7;
    if (daysRaw !== null) {
      const parsed = parsePositiveInt(daysRaw, 1, 365);
      if (parsed === null) {
        return createErrorResponse(
          'Invalid days parameter: must be an integer between 1 and 365',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
      days = parsed;
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

    const response = await fetch(
      `${BACKEND_URL}/api/badges/trending?days=${days}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 },
      }
    );

    const data = await parseBackendJson(response);

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return createErrorResponse('Failed to fetch trending badges', error);
  }
}
