import { POST } from './route'
import { NextRequest } from 'next/server'
import { server } from '../../../../tests/mocks/server'
import { http, HttpResponse } from 'msw'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

describe('Auth Login API Route', () => {
  it('should login successfully and forward set-cookie header', async () => {
    server.use(
      http.post(`${BACKEND_URL}/api/auth/login`, () => {
        return HttpResponse.json(
          { user: { id: '123' }, success: true },
          { 
            status: 200,
            headers: {
              'Set-Cookie': 'session=abc; Path=/; HttpOnly'
            }
          }
        )
      })
    )

    const request = new NextRequest(new URL('http://localhost:3000/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'password' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(response.headers.get('set-cookie')).toBe('session=abc; Path=/; HttpOnly')
  })

  it('should handle authentication failure', async () => {
    server.use(
      http.post(`${BACKEND_URL}/api/auth/login`, () => {
        return HttpResponse.json(
          { message: 'Invalid credentials' },
          { status: 401 }
        )
      })
    )

    const request = new NextRequest(new URL('http://localhost:3000/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ username: 'test', password: 'wrong' })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
