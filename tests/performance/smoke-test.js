import http from 'k6/http';
import { check, sleep } from 'k6';
import { stages, performanceThresholds } from './config.js';

export const options = {
  stages: stages.smoke,
  thresholds: performanceThresholds,
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const response = http.get(
    `${BASE_URL}/api/passport/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
