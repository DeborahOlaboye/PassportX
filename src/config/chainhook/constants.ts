/**
 * Chainhook Constants
 *
 * Constants and default values for Chainhook integration
 * Related to issue #31
 */

/**
 * Default Chainhook configuration values
 */
export const CHAINHOOK_DEFAULTS = {
  SERVER: {
    HOST: 'localhost',
    PORT: 3010,
    TIMEOUT: 30000,
  },
  NODE: {
    LOCAL_URL: 'http://localhost:20456',
    TESTNET_URL: 'https://api.testnet.hiro.so',
    MAINNET_URL: 'https://api.hiro.so',
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
} as const;

/**
 * Supported Chainhook networks
 */
export const CHAINHOOK_NETWORKS = {
  DEVELOPMENT: 'development',
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
} as const;

/**
 * Chainhook event types
 */
export const CHAINHOOK_EVENT_TYPES = {
  BLOCK: 'stacks-block',
  TRANSACTION: 'stacks-transaction',
  CONTRACT_CALL: 'stacks-contract-call',
  CONTRACT_DEPLOYMENT: 'stacks-contract-deployment',
  PRINT_EVENT: 'stacks-print-event',
  BITCOIN_BLOCK: 'bitcoin-block',
  BITCOIN_TRANSACTION: 'bitcoin-transaction',
} as const;

/**
 * PassportX contract addresses on mainnet
 */
export const PASSPORTX_CONTRACTS = {
  MAINNET: {
    DEPLOYER: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0',
    PASSPORT_CORE: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-core',
    PASSPORT_NFT: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.passport-nft',
    ACCESS_CONTROL: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.access-control',
    BADGE_ISSUER: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
    BADGE_READER: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-reader',
    BADGE_METADATA: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-metadata',
    COMMUNITY_MANAGER: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
  },
} as const;

/**
 * Chainhook predicate names for PassportX events
 */
export const PASSPORTX_PREDICATES = {
  BADGE_MINT: 'passportx-badge-mint',
  BADGE_REVOKE: 'passportx-badge-revoke',
  BADGE_METADATA_UPDATE: 'passportx-badge-metadata-update',
  COMMUNITY_CREATE: 'passportx-community-create',
  ACCESS_CONTROL_CHANGE: 'passportx-access-control-change',
  PASSPORT_CREATE: 'passportx-passport-create',
} as const;

/**
 * Chainhook server endpoints
 */
export const CHAINHOOK_ENDPOINTS = {
  HEALTH: '/health',
  PREDICATES: '/predicates',
  EVENTS: '/events',
} as const;

/**
 * Error codes for Chainhook operations
 */
export const CHAINHOOK_ERROR_CODES = {
  CONNECTION_FAILED: 'CHAINHOOK_CONNECTION_FAILED',
  INVALID_CONFIG: 'CHAINHOOK_INVALID_CONFIG',
  PREDICATE_ERROR: 'CHAINHOOK_PREDICATE_ERROR',
  EVENT_PROCESSING_ERROR: 'CHAINHOOK_EVENT_PROCESSING_ERROR',
  TIMEOUT: 'CHAINHOOK_TIMEOUT',
  UNAUTHORIZED: 'CHAINHOOK_UNAUTHORIZED',
} as const;
