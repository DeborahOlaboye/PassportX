import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import {
  isValidStacksAddressParam,
  validateProfileUpdateBody,
} from '@/lib/api-validation';

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

    const cookie = request.headers.get('cookie');

    const response = await fetch(
      `${BACKEND_URL}/api/users/profile/${address}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(cookie && { Cookie: cookie }),
        },
      }
    );

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to fetch user', error);
  }
}

export async function PUT(
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

    const body = await request.json();
    const bodyErrors = validateProfileUpdateBody(body);
    if (bodyErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: bodyErrors },
        { status: 400 }
      );
    }

    const cookie = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie && { Cookie: cookie }),
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendJson(response);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to update user', error);
  }
}
