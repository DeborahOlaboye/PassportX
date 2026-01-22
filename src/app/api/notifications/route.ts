import { NextRequest, NextResponse } from 'next/server'
import { sendError, ERROR_CODES } from '@/lib/api-responses'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return sendError('Authorization required', ERROR_CODES.UNAUTHORIZED, 401)
    }

    const response = await fetch(`${BACKEND_URL}/api/notifications?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return sendError(
      'Failed to fetch notifications',
      ERROR_CODES.SERVER_ERROR,
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
