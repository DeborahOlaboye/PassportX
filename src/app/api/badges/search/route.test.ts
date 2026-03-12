import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { server } from '../../../../tests/mocks/server';
import { http, HttpResponse } from 'msw';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('Badges Search API Route', () => {
  describe('GET', () => {
    it('should search badges with query params successfully', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/badges/search`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('q')).toBe('test');
          return HttpResponse.json([{ id: 1, name: 'Test Badge' }]);
        })
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/badges/search?q=test')
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Test Badge');
    });

    it('should handle backend errors on GET', async () => {
      server.use(
        http.get(`${BACKEND_URL}/api/badges/search`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/badges/search')
      );
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should search badges with body successfully', async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/badges/search`, async ({ request }) => {
          const body = (await request.json()) as any;
          expect(body.filters.category).toBe('gaming');
          return HttpResponse.json([{ id: 2, name: 'Gaming Badge' }]);
        })
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/badges/search'),
        {
          method: 'POST',
          body: JSON.stringify({ filters: { category: 'gaming' } }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].name).toBe('Gaming Badge');
    });

    it('should handle backend errors on POST', async () => {
      server.use(
        http.post(`${BACKEND_URL}/api/badges/search`, () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      const request = new NextRequest(
        new URL('http://localhost:3000/api/badges/search'),
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
