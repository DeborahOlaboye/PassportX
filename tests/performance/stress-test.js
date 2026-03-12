import http from 'k6/http';
import { check, sleep } from 'k6';
import { stages, performanceThresholds } from './config.js';

export const options = {
  stages: stages.stress,
  thresholds: {
    ...performanceThresholds,
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const endpoints = [
    `/api/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`,
    `/api/badges/1`,
    `/api/communities`,
  ];

  endpoints.forEach((endpoint) => {
    const response = http.get(`${BASE_URL}${endpoint}`);
    check(response, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
