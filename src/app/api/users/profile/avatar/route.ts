import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization');

    if (!token) {
      return createErrorResponse('Unauthorized', null, {
        status: 401,
        logLevel: 'warn',
      });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return createErrorResponse('Request body must be multipart/form-data', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const file = formData.get('avatar');

    if (!file || !(file instanceof File)) {
      return createErrorResponse(
        'avatar field is required and must be a file',
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return createErrorResponse(
        `Unsupported file type: must be one of ${ALLOWED_MIME_TYPES.join(', ')}`,
        null,
        { status: 400, logLevel: 'warn' }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return createErrorResponse(
        `File too large: maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        null,
        { status: 400, logLevel: 'warn' }
      );
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
