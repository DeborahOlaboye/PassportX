import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import { isValidStacksAddressParam, parsePositiveInt } from '@/lib/api-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    if (!isValidStacksAddressParam(address)) {
      return createErrorResponse('Invalid Stacks address format', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');

    let page = 1;
    if (pageRaw !== null) {
      const parsed = parsePositiveInt(pageRaw, 1, 10000);
      if (parsed === null) {
        return createErrorResponse(
          'Invalid page parameter: must be a positive integer between 1 and 10000',
          null,
          { status: 400, logLevel: 'warn' }
        );
      }
      page = parsed;
    }

    let limit = 20;
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
      `${BACKEND_URL}/api/badges/issuer/${address}?page=${page}&limit=${limit}`,
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
    return createErrorResponse('Failed to fetch badges by issuer', error);
  }
}
