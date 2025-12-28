/**
 * Chainhook Node Configuration
 *
 * Configuration for connecting to remote Chainhook nodes
 * Related to issue #31
 */

import { ChainhookNodeOptions } from '../../types/chainhook';

/**
 * Default Chainhook node configuration
 * Override these values using environment variables
 */
export const defaultNodeConfig: ChainhookNodeOptions = {
  baseUrl: process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456',
  apiKey: process.env.CHAINHOOK_NODE_API_KEY,
  timeout: parseInt(process.env.CHAINHOOK_NODE_TIMEOUT || '30000', 10),
  retryEnabled: process.env.CHAINHOOK_NODE_RETRY_ENABLED !== 'false',
  maxRetries: parseInt(process.env.CHAINHOOK_NODE_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.CHAINHOOK_NODE_RETRY_DELAY || '1000', 10),
};

/**
 * Development node configuration (local Chainhook node)
 */
export const developmentNodeConfig: ChainhookNodeOptions = {
  baseUrl: 'http://localhost:20456',
  timeout: 30000,
  retryEnabled: true,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Testnet node configuration (Hiro hosted testnet node)
 */
export const testnetNodeConfig: ChainhookNodeOptions = {
  baseUrl: process.env.CHAINHOOK_NODE_URL || 'https://api.testnet.hiro.so',
  apiKey: process.env.CHAINHOOK_NODE_API_KEY,
  timeout: 30000,
  retryEnabled: true,
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Mainnet node configuration (Hiro hosted mainnet node)
 */
export const mainnetNodeConfig: ChainhookNodeOptions = {
  baseUrl: process.env.CHAINHOOK_NODE_URL || 'https://api.hiro.so',
  apiKey: process.env.CHAINHOOK_NODE_API_KEY,
  timeout: 30000,
  retryEnabled: true,
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Get node configuration based on network
 */
export function getNodeConfig(
  network: 'development' | 'testnet' | 'mainnet' = 'development'
): ChainhookNodeOptions {
  switch (network) {
    case 'mainnet':
      return mainnetNodeConfig;
    case 'testnet':
      return testnetNodeConfig;
    case 'development':
    default:
      return developmentNodeConfig;
  }
}

/**
 * Validate Chainhook node configuration
 */
export function validateNodeConfig(config: ChainhookNodeOptions): boolean {
  if (!config.baseUrl) {
    throw new Error('Chainhook node base URL is required');
  }

  try {
    new URL(config.baseUrl);
  } catch {
    throw new Error('Invalid Chainhook node base URL format');
  }

  if (config.timeout && config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }

  if (config.maxRetries && config.maxRetries < 0) {
    throw new Error('Max retries must be a non-negative number');
  }

  if (config.retryDelay && config.retryDelay < 0) {
    throw new Error('Retry delay must be a non-negative number');
  }

  return true;
}
