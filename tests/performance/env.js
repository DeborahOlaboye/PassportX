// Performance test environment configuration
export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  
  endpoints: {
    passport: '/api/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    badge: '/api/badges/1',
    communities: '/api/communities',
  },
  
  thinkTime: {
    min: 1,
    max: 3,
  },
  
  timeout: '30s',
};
