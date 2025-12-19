/**
 * Test Chainhook Configuration
 *
 * Script to validate Chainhook configuration and environment
 * Related to issue #31
 *
 * Usage: npx tsx scripts/test-chainhook-config.ts
 */

import {
  getChainhookConfig,
  validateChainhookConfig,
  validateChainhookEnvironment,
  getConfigSummary,
} from '../src/config/chainhook';

import {
  isChainhookEnabled,
  isChainhookDebugEnabled,
  getCurrentNetwork,
} from '../src/config/chainhook/utils';

/**
 * Test environment validation
 */
function testEnvironmentValidation(): boolean {
  console.log('🔍 Testing Environment Validation...\n');

  const { valid, errors } = validateChainhookEnvironment();

  if (!valid) {
    console.error('❌ Environment validation failed:');
    errors.forEach((error) => console.error(`   - ${error}`));
    console.log('\nPlease check your .env file and set required variables.\n');
    return false;
  }

  console.log('✅ Environment validation passed\n');
  return true;
}

/**
 * Test configuration loading
 */
function testConfigurationLoading(): boolean {
  console.log('🔍 Testing Configuration Loading...\n');

  try {
    const network = getCurrentNetwork();
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    console.log(`📊 Current Settings:`);
    console.log(`   - Environment: ${environment}`);
    console.log(`   - Network: ${network}`);
    console.log(`   - Chainhook Enabled: ${isChainhookEnabled()}`);
    console.log(`   - Debug Mode: ${isChainhookDebugEnabled()}\n`);

    const config = getChainhookConfig(environment, network);

    console.log('✅ Configuration loaded successfully\n');

    // Validate configuration
    validateChainhookConfig(config);
    console.log('✅ Configuration is valid\n');

    // Display configuration summary
    console.log('📋 Configuration Summary:');
    console.log(getConfigSummary(config));
    console.log();

    return true;
  } catch (error) {
    console.error('❌ Configuration loading failed:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    return false;
  }
}

/**
 * Test server configuration
 */
function testServerConfiguration(): boolean {
  console.log('🔍 Testing Server Configuration...\n');

  try {
    const config = getChainhookConfig();

    console.log('📡 Server Configuration:');
    console.log(`   - Hostname: ${config.server.hostname}`);
    console.log(`   - Port: ${config.server.port}`);
    console.log(`   - External URL: ${config.server.externalUrl || 'Not set'}`);
    console.log(`   - HTTPS: ${config.server.https ? 'Enabled' : 'Disabled'}`);

    if (config.server.https) {
      console.log(`   - SSL Cert Path: ${config.server.sslCertPath || 'Not set'}`);
      console.log(`   - SSL Key Path: ${config.server.sslKeyPath || 'Not set'}`);
    }

    console.log('\n✅ Server configuration test passed\n');
    return true;
  } catch (error) {
    console.error('❌ Server configuration test failed:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    return false;
  }
}

/**
 * Test node configuration
 */
function testNodeConfiguration(): boolean {
  console.log('🔍 Testing Node Configuration...\n');

  try {
    const config = getChainhookConfig();

    console.log('🌐 Node Configuration:');
    console.log(`   - Base URL: ${config.node.baseUrl}`);
    console.log(`   - API Key: ${config.node.apiKey ? '***set***' : 'Not set'}`);
    console.log(`   - Timeout: ${config.node.timeout}ms`);
    console.log(`   - Retry Enabled: ${config.node.retryEnabled}`);
    console.log(`   - Max Retries: ${config.node.maxRetries}`);
    console.log(`   - Retry Delay: ${config.node.retryDelay}ms`);

    console.log('\n✅ Node configuration test passed\n');
    return true;
  } catch (error) {
    console.error('❌ Node configuration test failed:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}\n`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('🧪 Chainhook Configuration Test Suite\n');
  console.log('═══════════════════════════════════════════════════════\n\n');

  const results: { name: string; passed: boolean }[] = [];

  // Run all tests
  results.push({
    name: 'Environment Validation',
    passed: testEnvironmentValidation(),
  });

  results.push({
    name: 'Configuration Loading',
    passed: testConfigurationLoading(),
  });

  results.push({
    name: 'Server Configuration',
    passed: testServerConfiguration(),
  });

  results.push({
    name: 'Node Configuration',
    passed: testNodeConfiguration(),
  });

  // Display results summary
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📊 Test Results Summary\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('🎉 All tests passed! Chainhook configuration is ready.\n');
    console.log('Next steps:');
    console.log('   1. Create ChainhookEventObserver service (Issue #32)');
    console.log('   2. Implement predicates for PassportX events (Issues #33-36)\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
