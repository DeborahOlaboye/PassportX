/**
 * Chainhook Utility Functions
 *
 * Helper functions for Chainhook configuration and operations
 * Related to issue #31
 */

import { ChainhookConfig } from '../../types/chainhook';
import { CHAINHOOK_ERROR_CODES } from './constants';

/**
 * Check if Chainhook is enabled via environment variable
 */
export function isChainhookEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHAINHOOK_ENABLED === 'true';
}

/**
 * Check if Chainhook debug mode is enabled
 */
export function isChainhookDebugEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_CHAINHOOK_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development'
  );
}

/**
 * Get the current network from environment
 */
export function getCurrentNetwork(): 'development' | 'testnet' | 'mainnet' {
  const network = process.env.STACKS_NETWORK || process.env.NEXT_PUBLIC_STACKS_NETWORK;

  switch (network) {
    case 'mainnet':
      return 'mainnet';
    case 'testnet':
      return 'testnet';
    case 'devnet':
    case 'development':
    default:
      return 'development';
  }
}

/**
 * Create a Chainhook error with consistent format
 */
export function createChainhookError(
  code: keyof typeof CHAINHOOK_ERROR_CODES,
  message: string,
  originalError?: Error
): Error {
  const error = new Error(`[${CHAINHOOK_ERROR_CODES[code]}] ${message}`);
  if (originalError) {
    error.stack = originalError.stack;
  }
  return error;
}

/**
 * Format contract address for Chainhook predicates
 */
export function formatContractAddress(
  deployer: string,
  contractName: string
): string {
  return `${deployer}.${contractName}`;
}

/**
 * Parse contract address into deployer and contract name
 */
export function parseContractAddress(contractAddress: string): {
  deployer: string;
  contractName: string;
} {
  const [deployer, contractName] = contractAddress.split('.');
  if (!deployer || !contractName) {
    throw createChainhookError(
      'INVALID_CONFIG',
      `Invalid contract address format: ${contractAddress}`
    );
  }
  return { deployer, contractName };
}

/**
 * Log Chainhook message (only if debug is enabled)
 */
export function logChainhook(message: string, data?: unknown): void {
  if (isChainhookDebugEnabled()) {
    console.log(`[Chainhook] ${message}`, data || '');
  }
}

/**
 * Log Chainhook error
 */
export function logChainhookError(message: string, error?: Error): void {
  console.error(`[Chainhook Error] ${message}`, error || '');
}

/**
 * Generate a unique predicate UUID
 */
export function generatePredicateUUID(name: string): string {
  return `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate environment variables for Chainhook
 */
export function validateChainhookEnvironment(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if Chainhook is enabled
  if (!isChainhookEnabled()) {
    return { valid: true, errors: [] }; // Skip validation if disabled
  }

  // Validate node URL
  if (!process.env.CHAINHOOK_NODE_URL) {
    errors.push('CHAINHOOK_NODE_URL is required');
  }

  // Validate server configuration
  if (!process.env.CHAINHOOK_SERVER_HOST) {
    errors.push('CHAINHOOK_SERVER_HOST is required');
  }

  if (!process.env.CHAINHOOK_SERVER_PORT) {
    errors.push('CHAINHOOK_SERVER_PORT is required');
  } else {
    const port = parseInt(process.env.CHAINHOOK_SERVER_PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('CHAINHOOK_SERVER_PORT must be a valid port number (1-65535)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(config: ChainhookConfig): string {
  return JSON.stringify(
    {
      environment: config.environment,
      debug: config.debug,
      server: {
        host: config.server.hostname,
        port: config.server.port,
        https: config.server.https,
      },
      node: {
        baseUrl: config.node.baseUrl,
        hasApiKey: !!config.node.apiKey,
        timeout: config.node.timeout,
      },
    },
    null,
    2
  );
}
