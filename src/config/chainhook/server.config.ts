/**
 * Server Configuration for Chainhook Event Observer
 *
 * Configuration for the local server that receives Chainhook events
 * Related to issue #31
 */

import { ServerOptions } from '../../types/chainhook';

/**
 * Default server configuration
 * Override these values using environment variables
 */
export const defaultServerConfig: ServerOptions = {
  hostname: process.env.CHAINHOOK_SERVER_HOST || 'localhost',
  port: parseInt(process.env.CHAINHOOK_SERVER_PORT || '3010', 10),
  externalUrl: process.env.CHAINHOOK_SERVER_EXTERNAL_URL,
  https: process.env.CHAINHOOK_SERVER_HTTPS === 'true',
  sslCertPath: process.env.CHAINHOOK_SERVER_SSL_CERT_PATH,
  sslKeyPath: process.env.CHAINHOOK_SERVER_SSL_KEY_PATH,
};

/**
 * Development server configuration
 */
export const developmentServerConfig: ServerOptions = {
  hostname: 'localhost',
  port: 3010,
  externalUrl: 'http://localhost:3010',
  https: false,
};

/**
 * Production server configuration
 */
export const productionServerConfig: ServerOptions = {
  hostname: '0.0.0.0',
  port: parseInt(process.env.CHAINHOOK_SERVER_PORT || '3010', 10),
  externalUrl: process.env.CHAINHOOK_SERVER_EXTERNAL_URL || '',
  https: true,
  sslCertPath: process.env.CHAINHOOK_SERVER_SSL_CERT_PATH,
  sslKeyPath: process.env.CHAINHOOK_SERVER_SSL_KEY_PATH,
};

/**
 * Get server configuration based on environment
 */
export function getServerConfig(
  environment: 'development' | 'production' = 'development'
): ServerOptions {
  if (environment === 'production') {
    return productionServerConfig;
  }
  return developmentServerConfig;
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: ServerOptions): boolean {
  if (!config.hostname) {
    throw new Error('Server hostname is required');
  }

  if (!config.port || config.port < 1 || config.port > 65535) {
    throw new Error('Valid server port (1-65535) is required');
  }

  if (config.https) {
    if (!config.sslCertPath || !config.sslKeyPath) {
      throw new Error('SSL certificate and key paths are required when HTTPS is enabled');
    }
  }

  return true;
}
