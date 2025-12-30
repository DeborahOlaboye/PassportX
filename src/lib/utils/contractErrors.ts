/**
 * Contract Error Handling Utilities
 *
 * Helper functions for handling smart contract errors in the frontend
 */

import { getErrorMessage, getErrorCategory, type ErrorCode } from '../constants/errorCodes'

export interface ContractError {
  code: number
  message: string
  category: string
  raw?: unknown
}

/**
 * Parse a contract error from various sources
 * @param error - The error object from contract call
 * @returns Parsed contract error
 */
export function parseContractError(error: unknown): ContractError {
  // Handle Stacks.js error format
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: number }).code
    return {
      code,
      message: getErrorMessage(code),
      category: getErrorCategory(code),
      raw: error
    }
  }

  // Handle numeric error code
  if (typeof error === 'number') {
    return {
      code: error,
      message: getErrorMessage(error),
      category: getErrorCategory(error),
      raw: error
    }
  }

  // Handle string error code (e.g., "u100", "(err u100)")
  if (typeof error === 'string') {
    const match = error.match(/u?(\d+)/)
    if (match) {
      const code = parseInt(match[1], 10)
      return {
        code,
        message: getErrorMessage(code),
        category: getErrorCategory(code),
        raw: error
      }
    }
  }

  // Unknown error format
  return {
    code: 0,
    message: 'An unknown error occurred',
    category: 'UNKNOWN',
    raw: error
  }
}

/**
 * Check if an error is retryable
 * @param error - The contract error
 * @returns true if error is retryable
 */
export function isRetryableError(error: ContractError): boolean {
  // Network errors and temporary failures are retryable
  const retryableCodes = [108] // ERR-OPERATION-FAILED
  return retryableCodes.includes(error.code)
}

/**
 * Check if an error requires user action
 * @param error - The contract error
 * @returns true if user action is required
 */
export function requiresUserAction(error: ContractError): boolean {
  const categories = ['PERMISSION', 'VALIDATION', 'STATE']
  return categories.includes(error.category)
}

/**
 * Get user-friendly error message with actionable advice
 * @param error - The contract error
 * @returns Error message with advice
 */
export function getErrorAdvice(error: ContractError): string {
  const baseMessage = error.message

  switch (error.code) {
    case 100: // ERR-OWNER-ONLY
      return `${baseMessage}. Please contact the contract owner.`
    case 104: // ERR-UNAUTHORIZED
      return `${baseMessage}. Please check your permissions or connect with an authorized account.`
    case 300: // ERR-COMMUNITY-NOT-FOUND
      return `${baseMessage}. The community may have been removed or doesn't exist yet.`
    case 600: // ERR-TEMPLATE-NOT-FOUND
      return `${baseMessage}. Please select a valid badge template.`
    case 700: // ERR-BATCH-TOO-LARGE
      return `${baseMessage}. Please reduce the number of items and try again.`
    case 701: // ERR-BATCH-EMPTY
      return `${baseMessage}. Please add at least one item.`
    case 702: // ERR-BATCH-MISMATCHED-LENGTHS
      return `${baseMessage}. Please ensure all arrays have the same length.`
    default:
      return baseMessage
  }
}

/**
 * Log contract error with context
 * @param error - The contract error
 * @param context - Additional context about where/when the error occurred
 */
export function logContractError(error: ContractError, context?: Record<string, unknown>): void {
  console.error('[Contract Error]', {
    code: error.code,
    message: error.message,
    category: error.category,
    context,
    raw: error.raw
  })
}

/**
 * Create a user-friendly error notification
 * @param error - The contract error
 * @param includeCode - Whether to include error code
 * @returns Notification object
 */
export function createErrorNotification(
  error: ContractError,
  includeCode: boolean = false
): {
  title: string
  message: string
  type: 'error'
  duration?: number
} {
  const message = getErrorAdvice(error)
  const title = includeCode ? `Error ${error.code}` : 'Transaction Failed'

  return {
    title,
    message,
    type: 'error',
    duration: 5000
  }
}
