import { POST, GET } from './route'
import { NextRequest } from 'next/server'
import { server } from '../../../../tests/mocks/server'
import { http, HttpResponse } from 'msw'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

describe('Communities API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    const validBody = {
      txId: '0x123',
      name: 'Test Community',
      description: 'Test Description',
      owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      stxPayment: 100,
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff'
      },
      settings: {
        allowMemberInvites: true,
        requireApproval: false,
        allowBadgeIssuance: true,
        allowCustomBadges: false
      },
      network: 'testnet',
      createdAt: new Date().toISOString()
    }

    it('should create a community successfully', async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/communities`, () => {
          return HttpResponse.json({
            success: true,
            community: { _id: 'comm123' }
          }, { status: 201 })
        })
      )

      const request = new NextRequest(new URL('http://localhost:3000/api/communities'), {
        method: 'POST',
        body: JSON.stringify(validBody)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.communityId).toBe('comm123')
    })

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/communities'), {
        method: 'POST',
        body: JSON.stringify({ name: 'Incomplete' })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should return 400 if field length exceeds maximum', async () => {
      const longDescription = 'a'.repeat(2001)
      const request = new NextRequest(new URL('http://localhost:3000/api/communities'), {
        method: 'POST',
        body: JSON.stringify({ ...validBody, description: longDescription })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should forward backend errors', async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/communities`, () => {
          return HttpResponse.json({
            success: false,
            message: 'Backend error'
          }, { status: 500 })
        })
      )

      const request = new NextRequest(new URL('http://localhost:3000/api/communities'), {
        method: 'POST',
        body: JSON.stringify(validBody)
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('GET', () => {
    it('should fetch communities successfully', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/communities`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('limit')).toBe('10')
          
          return HttpResponse.json([
            { _id: 'comm1', name: 'Community 1' },
            { _id: 'comm2', name: 'Community 2' }
          ])
        })
      )

      const request = new NextRequest(new URL('http://localhost:3000/api/communities'))
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should pass query parameters to backend', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/communities`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('admin')).toBe('ST123')
          expect(url.searchParams.get('search')).toBe('test')
          expect(url.searchParams.getAll('tags')).toContain('tag1')
          
          return HttpResponse.json([])
        })
      )

      const request = new NextRequest(new URL('http://localhost:3000/api/communities?admin=ST123&search=test&tags=tag1'))
      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should return error if backend fails', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/communities`, () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
        })
      )

      const request = new NextRequest(new URL('http://localhost:3000/api/communities'))
      const response = await GET(request)
      expect(response.status).toBe(500)
    })
  })
})
