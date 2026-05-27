import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ token: 'mock-token', userId: 'mock-user-1' });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 'mock-user-1',
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    });
  }),

  http.get('/api/notifications', () => {
    return HttpResponse.json({ notifications: [], total: 0 });
  }),

  http.get('/api/badges', () => {
    return HttpResponse.json({ badges: [], total: 0 });
  }),

  http.get('/api/communities', () => {
    return HttpResponse.json({ communities: [], total: 0 });
  }),
];
