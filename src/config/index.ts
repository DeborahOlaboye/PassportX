/**
 * Configuration Index
 *
 * Central export point for all PassportX configuration modules
 */

// Chainhook configuration exports
export * from './chainhook';
export { default as chainhookConfig } from './chainhook';

// Re-export types
export type {
  ServerOptions,
  ChainhookNodeOptions,
  ChainhookConfig,
  PredicateType,
  BasePredicate,
} from '../types/chainhook';

// Re-export constants
export {
  CHAINHOOK_DEFAULTS,
  CHAINHOOK_NETWORKS,
  CHAINHOOK_EVENT_TYPES,
  PASSPORTX_CONTRACTS,
  PASSPORTX_PREDICATES,
  CHAINHOOK_ENDPOINTS,
  CHAINHOOK_ERROR_CODES,
} from './chainhook/constants';

// Re-export utilities
export {
  isChainhookEnabled,
  isChainhookDebugEnabled,
  getCurrentNetwork,
  createChainhookError,
  formatContractAddress,
  parseContractAddress,
  logChainhook,
  logChainhookError,
  generatePredicateUUID,
  validateChainhookEnvironment,
  getConfigSummary,
} from './chainhook/utils';
