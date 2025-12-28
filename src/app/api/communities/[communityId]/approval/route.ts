import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json(
        { error: 'approverAddress is required' },
        { status: 400 }
      )
    }

    if (!body.approved && !body.reason) {
      return NextResponse.json(
        { error: 'reason is required when rejecting' },
        { status: 400 }
      )
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
    console.error('Approval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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
    console.error('Approval status fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch approval status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
