/**
 * Chainhook Configuration Types
 *
 * Type definitions for Hiro Chainhooks client configuration
 * Related to issue #31
 */

/**
 * Server options for the local Chainhook event server
 */
export interface ServerOptions {
  /** Host address for the local server (default: 'localhost') */
  hostname: string;

  /** Port number for the local server (default: 3010) */
  port: number;

  /** External URL where this server can be reached (for webhooks) */
  externalUrl?: string;

  /** Enable HTTPS for the local server */
  https?: boolean;

  /** Path to SSL certificate (if HTTPS is enabled) */
  sslCertPath?: string;

  /** Path to SSL key (if HTTPS is enabled) */
  sslKeyPath?: string;
}

/**
 * Configuration options for connecting to a Chainhook node
 */
export interface ChainhookNodeOptions {
  /** Base URL of the Chainhook node */
  baseUrl: string;

  /** API key for authenticating with the Chainhook node */
  apiKey?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable retry logic for failed requests */
  retryEnabled?: boolean;

  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Delay between retry attempts in milliseconds (default: 1000) */
  retryDelay?: number;
}

/**
 * Combined Chainhook configuration
 */
export interface ChainhookConfig {
  /** Local server configuration */
  server: ServerOptions;

  /** Remote Chainhook node configuration */
  node: ChainhookNodeOptions;

  /** Enable debug logging */
  debug?: boolean;

  /** Environment (development, staging, production) */
  environment?: 'development' | 'staging' | 'production';
}

/**
 * Predicate types supported by Chainhook
 */
export type PredicateType =
  | 'stacks-block'
  | 'stacks-transaction'
  | 'stacks-contract-call'
  | 'stacks-contract-deployment'
  | 'stacks-print-event'
  | 'bitcoin-block'
  | 'bitcoin-transaction';

/**
 * Base predicate configuration
 */
export interface BasePredicate {
  /** Unique identifier for this predicate */
  uuid: string;

  /** Human-readable name */
  name: string;

  /** Predicate type */
  type: PredicateType;

  /** Network (mainnet or testnet) */
  network: 'mainnet' | 'testnet';

  /** Whether this predicate is enabled */
  enabled?: boolean;
}
