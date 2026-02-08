#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, 'baseline.json');
const RESULTS_FILE = process.argv[2];

if (!RESULTS_FILE) {
  console.error('Usage: node update-baseline.js <results-file>');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

const metrics = results.metrics;

if (metrics.http_req_duration) {
  const p95 = metrics.http_req_duration['p(95)'];
  const p99 = metrics.http_req_duration['p(99)'];
  const errorRate = metrics.http_req_failed?.rate || 0;

  Object.keys(baseline.baselines).forEach(endpoint => {
    baseline.baselines[endpoint].p95 = Math.round(p95);
    baseline.baselines[endpoint].p99 = Math.round(p99);
    baseline.baselines[endpoint].errorRate = parseFloat(errorRate.toFixed(3));
  });

  baseline.lastUpdated = new Date().toISOString();

  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log('✅ Baseline metrics updated successfully');
  console.log(`P95: ${p95.toFixed(2)}ms`);
  console.log(`P99: ${p99.toFixed(2)}ms`);
  console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
} else {
  console.error('❌ No metrics found in results file');
  process.exit(1);
}
