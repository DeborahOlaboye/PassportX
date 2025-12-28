/**
 * Chainhook Configuration Index
 *
 * Main configuration file that combines server and node configurations
 * Related to issue #31
 */

import { ChainhookConfig } from '../../types/chainhook';
import {
  defaultServerConfig,
  getServerConfig,
  validateServerConfig,
} from './server.config';
import {
  defaultNodeConfig,
  getNodeConfig,
  validateNodeConfig,
} from './node.config';

/**
 * Get complete Chainhook configuration based on environment
 */
export function getChainhookConfig(
  environment: 'development' | 'staging' | 'production' = 'development',
  network: 'development' | 'testnet' | 'mainnet' = 'development'
): ChainhookConfig {
  const serverConfig = getServerConfig(
    environment === 'development' ? 'development' : 'production'
  );
  const nodeConfig = getNodeConfig(network);

  return {
    server: serverConfig,
    node: nodeConfig,
    debug: environment === 'development',
    environment,
  };
}

/**
 * Validate complete Chainhook configuration
 */
export function validateChainhookConfig(config: ChainhookConfig): boolean {
  validateServerConfig(config.server);
  validateNodeConfig(config.node);
  return true;
}

/**
 * Default Chainhook configuration (uses environment variables)
 */
export const chainhookConfig: ChainhookConfig = {
  server: defaultServerConfig,
  node: defaultNodeConfig,
  debug: process.env.NODE_ENV === 'development',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
};

// Export all configurations
export * from './server.config';
export * from './node.config';
export { chainhookConfig as default };
