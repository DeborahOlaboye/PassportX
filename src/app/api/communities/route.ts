import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { sendSuccess } from '@/lib/api-responses';
import { BACKEND_URL } from '@/lib/config';
import { parseBackendJson } from '@/lib/backend-proxy';
import {
  isValidStacksAddressParam,
  validateCommunityOptionalFields,
  sanitizeQueryParam,
} from '@/lib/api-validation';

interface CommunityCreationRequest {
  txId: string;
  name: string;
  description: string;
  about?: string;
  website?: string;
  stxPayment: number;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    allowBadgeIssuance: boolean;
    allowCustomBadges: boolean;
  };
  tags?: string[];
  owner: string;
  createdAt: string;
  network: 'testnet' | 'mainnet';
}

export async function POST(request: NextRequest) {
  try {
    let body: CommunityCreationRequest;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('Request body must be valid JSON', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (!body.txId || !body.name || !body.description || !body.owner) {
      return createErrorResponse('Missing required fields', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (body.name.length > 100 || body.description.length > 2000) {
      return createErrorResponse('Field length exceeds maximum', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    if (!isValidStacksAddressParam(body.owner)) {
      return createErrorResponse('owner must be a valid Stacks address', null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const optionalErrors = validateCommunityOptionalFields(
      body as unknown as Record<string, unknown>
    );
    if (optionalErrors.length > 0) {
      return createErrorResponse(optionalErrors[0], null, {
        status: 400,
        logLevel: 'warn',
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_API_KEY || ''}`,
      },
      body: JSON.stringify({
        txId: body.txId,
        name: body.name,
        description: body.description,
        about: body.about,
        website: body.website,
        owner: body.owner,
        stxPayment: body.stxPayment,
        theme: body.theme,
        settings: body.settings,
        tags: body.tags,
        createdAt: body.createdAt,
        network: body.network,
      }),
    });

    if (!response.ok) {
      const error = await parseBackendJson(response);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await parseBackendJson(response);

    return sendSuccess(
      {
        communityId: data.community?._id,
        transactionId: body.txId,
        data,
      },
      201,
      'Community created successfully'
    );
  } catch (error) {
    return createErrorResponse('Failed to create community', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin');
    const search = searchParams.get('search');
    const tags = searchParams.getAll('tags');
    const rawLimit = parseInt(searchParams.get('limit') || '10', 10);
    const rawOffset = parseInt(searchParams.get('offset') || '0', 10);
    const limit =
      Number.isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 100);
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    const queryParams = new URLSearchParams();
    if (admin) queryParams.append('admin', admin);
    if (search) queryParams.append('search', sanitizeQueryParam(search));
    tags.forEach((tag) => queryParams.append('tags', tag));
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const response = await fetch(
      `${BACKEND_URL}/api/communities?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_KEY || ''}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await parseBackendJson(response);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await parseBackendJson(response);

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse('Failed to fetch communities', error);
  }
}
