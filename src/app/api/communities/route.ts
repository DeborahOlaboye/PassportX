import { NextRequest, NextResponse } from 'next/server'

interface CommunityCreationRequest {
  txId: string
  name: string
  description: string
  about?: string
  website?: string
  stxPayment: number
  theme: {
    primaryColor: string
    secondaryColor: string
  }
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
    allowBadgeIssuance: boolean
    allowCustomBadges: boolean
  }
  tags?: string[]
  owner: string
  createdAt: string
  network: 'testnet' | 'mainnet'
}

export async function POST(request: NextRequest) {
  try {
    const body: CommunityCreationRequest = await request.json()

    if (!body.txId || !body.name || !body.description || !body.owner) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (body.name.length > 100 || body.description.length > 2000) {
      return NextResponse.json(
        { error: 'Field length exceeds maximum' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'

    const response = await fetch(`${backendUrl}/api/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY || ''}`
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
        network: body.network
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(
      {
        success: true,
        message: 'Community created successfully',
        communityId: data.community?._id,
        transactionId: body.txId,
        data
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Community creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admin = searchParams.get('admin')
    const search = searchParams.get('search')
    const tags = searchParams.getAll('tags')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3001'

    const queryParams = new URLSearchParams()
    if (admin) queryParams.append('admin', admin)
    if (search) queryParams.append('search', search)
    tags.forEach(tag => queryParams.append('tags', tag))
    queryParams.append('limit', limit.toString())
    queryParams.append('offset', offset.toString())

    const response = await fetch(
      `${backendUrl}/api/communities?${queryParams.toString()}`,
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
    console.error('Communities fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch communities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
