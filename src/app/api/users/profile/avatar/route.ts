import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = request.headers.get('Authorization');

    if (!token) {
      return createErrorResponse('Unauthorized', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/users/profile/avatar`, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await parseBackendJson(response);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return createErrorResponse('Failed to upload profile picture', error);
  }
}
