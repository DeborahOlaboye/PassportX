import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/error-response'

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
    return createErrorResponse('Failed to check URL availability', error)
  }
}
