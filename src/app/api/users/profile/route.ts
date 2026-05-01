import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import {
  isValidStacksAddressParam,
  isValidCustomUrl,
  validateProfileUpdateBody,
} from '@/lib/api-validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const customUrl = searchParams.get('customUrl');

    if (!address && !customUrl) {
      return createErrorResponse('Address or customUrl required', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (address && !isValidStacksAddressParam(address)) {
      return createErrorResponse('Invalid Stacks address format', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (customUrl && !isValidCustomUrl(customUrl)) {
      return createErrorResponse(
        'Invalid customUrl format: must be 3–30 lowercase letters, digits, or hyphens',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    let url: string;
    if (customUrl) {
      url = `${BACKEND_URL}/api/users/profile/u/${customUrl}`;
    } else {
      url = `${BACKEND_URL}/api/users/profile/${address}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await parseBackendJson(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to fetch user profile', error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization');

    if (!token) {
      return createErrorResponse('Unauthorized', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Request body must be valid JSON', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const bodyErrors = validateProfileUpdateBody(body);
    if (bodyErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: bodyErrors },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    const data = await parseBackendJson(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to update user profile', error);
  }
}
