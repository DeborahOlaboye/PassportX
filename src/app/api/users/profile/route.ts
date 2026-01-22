import { NextRequest, NextResponse } from 'next/server'
import { sendError, ERROR_CODES } from '@/lib/api-responses'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const customUrl = searchParams.get('customUrl')

    if (!address && !customUrl) {
      return sendError('Address or customUrl required', ERROR_CODES.INVALID_INPUT, 400)
    }

    let url: string
    if (customUrl) {
      url = `${BACKEND_URL}/api/users/profile/u/${customUrl}`
    } else {
      url = `${BACKEND_URL}/api/users/profile/${address}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return sendError(
      'Failed to fetch user profile',
      ERROR_CODES.SERVER_ERROR,
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const token = request.headers.get('Authorization')

    if (!token) {
      return sendError('Unauthorized', ERROR_CODES.UNAUTHORIZED, 401)
    }

    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return sendError(
      'Failed to update user profile',
      ERROR_CODES.SERVER_ERROR,
      500,
      error instanceof Error ? error.message : undefined
    )
  }
}
