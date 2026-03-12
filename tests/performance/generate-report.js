#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3] || 'performance-report.html';

if (!RESULTS_FILE) {
  console.error('Usage: node generate-report.js <results-file> [output-file]');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
const metrics = results.metrics;

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Performance Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <h2>HTTP Request Duration</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Average</td><td>${
      metrics.http_req_duration?.avg?.toFixed(2) || 'N/A'
    } ms</td></tr>
    <tr><td>P95</td><td>${
      metrics.http_req_duration?.['p(95)']?.toFixed(2) || 'N/A'
    } ms</td></tr>
    <tr><td>P99</td><td>${
      metrics.http_req_duration?.['p(99)']?.toFixed(2) || 'N/A'
    } ms</td></tr>
  </table>
  
  <h2>Request Statistics</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Requests</td><td>${
      metrics.http_reqs?.count || 'N/A'
    }</td></tr>
    <tr><td>Request Rate</td><td>${
      metrics.http_reqs?.rate?.toFixed(2) || 'N/A'
    } req/s</td></tr>
    <tr><td>Failed Requests</td><td class="${
      (metrics.http_req_failed?.rate || 0) > 0.1 ? 'fail' : 'pass'
    }">${((metrics.http_req_failed?.rate || 0) * 100).toFixed(2)}%</td></tr>
  </table>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, html);
console.log(`Report generated: ${OUTPUT_FILE}`);
