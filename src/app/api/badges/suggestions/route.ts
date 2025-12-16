import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') || '10'

    if (!query) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      )
    }

    const response = await fetch(
      `${BACKEND_URL}/api/badges/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch search suggestions' },
      { status: 500 }
    )
  }
}
