#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, 'baseline.json');
const RESULTS_FILE = process.argv[2];

if (!RESULTS_FILE) {
  console.error('Usage: node compare-baseline.js <results-file>');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

const metrics = results.metrics;
const degradationTolerance = baseline.thresholds.degradationTolerance;

let hasRegression = false;
const regressions = [];

function checkMetric(name, current, baselineValue) {
  const degradation = (current - baselineValue) / baselineValue;
  if (degradation > degradationTolerance) {
    hasRegression = true;
    regressions.push({
      metric: name,
      baseline: baselineValue,
      current: current,
      degradation: (degradation * 100).toFixed(2) + '%'
    });
  }
}

if (metrics.http_req_duration) {
  const p95 = metrics.http_req_duration['p(95)'];
  const p99 = metrics.http_req_duration['p(99)'];
  
  Object.keys(baseline.baselines).forEach(endpoint => {
    checkMetric(`${endpoint}-p95`, p95, baseline.baselines[endpoint].p95);
    checkMetric(`${endpoint}-p99`, p99, baseline.baselines[endpoint].p99);
  });
}

if (hasRegression) {
  console.error('❌ Performance regression detected:');
  console.table(regressions);
  process.exit(1);
} else {
  console.log('✅ Performance within acceptable thresholds');
  process.exit(0);
}
