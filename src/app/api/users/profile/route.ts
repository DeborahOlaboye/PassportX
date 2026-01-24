import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/error-response'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const customUrl = searchParams.get('customUrl')

    if (!address && !customUrl) {
      return createErrorResponse('Address or customUrl required', null, { status: 400, logLevel: 'warn' })
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
    return createErrorResponse('Failed to fetch user profile', error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const token = request.headers.get('Authorization')

    if (!token) {
      return createErrorResponse('Unauthorized', null, { status: 401, logLevel: 'warn' })
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
    return createErrorResponse('Failed to update user profile', error)
  }
}
