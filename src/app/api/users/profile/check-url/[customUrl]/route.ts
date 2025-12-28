import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { customUrl: string } }
) {
  try {
    const { customUrl } = params

    const response = await fetch(
      `${BACKEND_URL}/api/users/profile/check-url/${customUrl}`,
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
    console.error('Error checking custom URL:', error)
    return NextResponse.json(
      { available: false, message: 'Failed to check URL availability' },
      { status: 500 }
    )
  }
}
