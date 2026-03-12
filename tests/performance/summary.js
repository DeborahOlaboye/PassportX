#!/usr/bin/env node

const fs = require('fs');

const RESULTS_FILE = process.argv[2];

if (!RESULTS_FILE) {
  console.error('Usage: node summary.js <results-file>');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
const metrics = results.metrics;

console.log('\n📊 Performance Test Summary\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (metrics.http_req_duration) {
  console.log('\n⏱️  Response Times:');
  console.log(
    `   Average: ${metrics.http_req_duration.avg?.toFixed(2) || 'N/A'} ms`
  );
  console.log(
    `   P95:     ${metrics.http_req_duration['p(95)']?.toFixed(2) || 'N/A'} ms`
  );
  console.log(
    `   P99:     ${metrics.http_req_duration['p(99)']?.toFixed(2) || 'N/A'} ms`
  );
}

if (metrics.http_reqs) {
  console.log('\n📈 Request Statistics:');
  console.log(`   Total:   ${metrics.http_reqs.count || 'N/A'}`);
  console.log(
    `   Rate:    ${metrics.http_reqs.rate?.toFixed(2) || 'N/A'} req/s`
  );
}

if (metrics.http_req_failed) {
  const errorRate = (metrics.http_req_failed.rate || 0) * 100;
  const status = errorRate > 10 ? '❌' : '✅';
  console.log('\n🎯 Error Rate:');
  console.log(`   ${status} ${errorRate.toFixed(2)}%`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
