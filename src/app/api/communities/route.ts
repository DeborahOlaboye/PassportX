import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-response';
import { sendSuccess } from '@/lib/api-responses';

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
    const body: CommunityCreationRequest = await request.json();

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

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';

    const response = await fetch(`${backendUrl}/api/communities`, {
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
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();

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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001';

    const queryParams = new URLSearchParams();
    if (admin) queryParams.append('admin', admin);
    if (search) queryParams.append('search', search);
    tags.forEach((tag) => queryParams.append('tags', tag));
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const response = await fetch(
      `${backendUrl}/api/communities?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BACKEND_API_KEY || ''}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse('Failed to fetch communities', error);
  }
}
