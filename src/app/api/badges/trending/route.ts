import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = searchParams.get('days') || '7'
    const limit = searchParams.get('limit') || '10'

    const response = await fetch(
      `${BACKEND_URL}/api/badges/trending?days=${days}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching trending badges:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending badges' },
      { status: 500 }
    )
  }
}
