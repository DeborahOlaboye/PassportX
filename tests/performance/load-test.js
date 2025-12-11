import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test passport view endpoint
  let response = http.get(`${BASE_URL}/api/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`);
  check(response, {
    'passport endpoint status is 200': (r) => r.status === 200,
    'passport response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test badge lookup endpoint
  response = http.get(`${BASE_URL}/api/badges/1`);
  check(response, {
    'badge endpoint status is 200': (r) => r.status === 200,
    'badge response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);

  // Test community listing endpoint
  response = http.get(`${BASE_URL}/api/communities`);
  check(response, {
    'communities endpoint status is 200': (r) => r.status === 200,
    'communities response time < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(1);
}