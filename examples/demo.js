/**
 * PassportX SDK Demo
 *
 * This script demonstrates the PassportX SDK capabilities.
 * Install: npm install passportx-sdk
 */

const sdk = require('passportx-sdk');

console.log('=== PassportX SDK Demo ===');
console.log('SDK loaded successfully');
console.log('Available exports:', Object.keys(sdk).join(', '));

// Demonstrate SDK initialization
if (sdk.PassportX) {
  const client = new sdk.PassportX({
    apiUrl: 'https://api.passportx.app',
    network: 'mainnet',
  });

  console.log('\nPassportX client initialized:');
  console.log('- Network: mainnet');
  console.log('- API URL: https://api.passportx.app');
  console.log('\nAvailable methods:');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(
    (m) => m !== 'constructor'
  );
  methods.forEach((method) => console.log(`  - ${method}()`));
}

// Demonstrate error class
if (sdk.PassportXError) {
  console.log('\nPassportXError class available for error handling');
  console.log('Usage: catch (error) { if (error instanceof PassportXError) { ... } }');
}

console.log('\n=== Demo Complete ===');
console.log('Install: npm install passportx-sdk');
console.log('Docs: https://github.com/DeborahOlaboye/PassportX');
