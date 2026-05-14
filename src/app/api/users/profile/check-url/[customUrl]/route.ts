import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';

export async function GET(
  request: NextRequest,
  { params }: { params: { customUrl: string } }
) {
  try {
    const { customUrl } = params;

    const response = await fetch(
      `${BACKEND_URL}/api/users/profile/check-url/${customUrl}`,
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
    return createErrorResponse('Failed to check URL availability', error);
  }
}
