import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = request.headers.get('Authorization')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/users/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}
