import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/error-response'

interface ApprovalRequest {
  approved: boolean
  reason?: string
  approverAddress: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { communityId } = params
    const body: ApprovalRequest = await request.json()

    if (!body.approverAddress) {
      return createErrorResponse('approverAddress is required', null, { status: 400, logLevel: 'warn' })
    }

    if (!body.approved && !body.reason) {
      return createErrorResponse('reason is required when rejecting', null, { status: 400, logLevel: 'warn' })
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'

    const endpoint = body.approved ? 'approve' : 'reject'
    
    const response = await fetch(
      `${backendUrl}/api/communities/${communityId}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY || ''}`
        },
        body: JSON.stringify({
          approverAddress: body.approverAddress,
          ...(body.reason && { reason: body.reason })
        })
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(
      {
        success: true,
        message: body.approved ? 'Community approved' : 'Community rejected',
        data
      },
      { status: 200 }
    )
  } catch (error) {
    return createErrorResponse('Failed to process approval', error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string } }
) {
  try {
    const { communityId } = params
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'

    const response = await fetch(
      `${backendUrl}/api/communities/${communityId}/approval`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY || ''}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return createErrorResponse('Failed to fetch approval status', error)
  }
}
