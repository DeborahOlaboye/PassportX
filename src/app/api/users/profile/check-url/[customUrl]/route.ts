import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { isValidCustomUrl } from '@/lib/api-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { customUrl: string } }
) {
  try {
    const { customUrl } = params;

    if (!isValidCustomUrl(customUrl)) {
      return createErrorResponse(
        'Invalid customUrl format: must be 3–30 lowercase letters, digits, or hyphens with no leading/trailing/consecutive hyphens',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

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
