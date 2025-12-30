/**
 * Constants Index
 * Central export point for all application constants
 */

// Export error codes and utilities
export {
  ERROR_CODES,
  getErrorMessage,
  getErrorCode,
  getErrorCategory,
  isPermissionError,
  isValidationError,
  formatError
} from './errorCodes'

export type { ErrorCode, ErrorCategory } from './errorCodes'
