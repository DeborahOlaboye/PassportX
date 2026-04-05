import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') || '7';
    const limit = searchParams.get('limit') || '10';

    const response = await fetch(
      `${BACKEND_URL}/api/badges/trending?days=${days}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
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
