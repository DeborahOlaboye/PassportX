/**
 * PassportX Smart Contract Error Codes
 *
 * This file maps Clarity contract error codes to user-friendly messages.
 * These codes match the error codes defined in contracts/error-codes.clar
 *
 * @see docs/ERROR_CODES.md for complete error code reference
 */

export const ERROR_CODES = {
  // General Errors (100-199)
  100: {
    code: 'ERR-OWNER-ONLY',
    message: 'Only the contract owner can perform this action',
    category: 'PERMISSION'
  },
  101: {
    code: 'ERR-NOT-TOKEN-OWNER',
    message: 'You do not own this token',
    category: 'PERMISSION'
  },
  102: {
    code: 'ERR-NOT-FOUND',
    message: 'Resource not found',
    category: 'GENERAL'
  },
  103: {
    code: 'ERR-TRANSFER-DISABLED',
    message: 'Transfers are disabled for achievement badges',
    category: 'OPERATION'
  },
  104: {
    code: 'ERR-UNAUTHORIZED',
    message: 'You are not authorized to perform this action',
    category: 'PERMISSION'
  },
  105: {
    code: 'ERR-INVALID-INPUT',
    message: 'Invalid input provided',
    category: 'VALIDATION'
  },
  106: {
    code: 'ERR-ALREADY-EXISTS',
    message: 'Resource already exists',
    category: 'GENERAL'
  },
  107: {
    code: 'ERR-INACTIVE',
    message: 'Resource is inactive',
    category: 'STATE'
  },
  108: {
    code: 'ERR-OPERATION-FAILED',
    message: 'Operation failed to complete',
    category: 'OPERATION'
  },
  109: {
    code: 'ERR-INVALID-STATE',
    message: 'Invalid state for this operation',
    category: 'STATE'
  },

  // NFT/Badge Errors (200-299)
  200: {
    code: 'ERR-INVALID-BADGE',
    message: 'Invalid badge ID',
    category: 'BADGE'
  },
  201: {
    code: 'ERR-BADGE-MINTING-FAILED',
    message: 'Failed to mint badge',
    category: 'BADGE'
  },
  202: {
    code: 'ERR-BADGE-ALREADY-ISSUED',
    message: 'Badge has already been issued to this recipient',
    category: 'BADGE'
  },
  203: {
    code: 'ERR-BADGE-REVOKED',
    message: 'This badge has been revoked',
    category: 'BADGE'
  },
  204: {
    code: 'ERR-INVALID-RECIPIENT',
    message: 'Invalid recipient address',
    category: 'VALIDATION'
  },
  205: {
    code: 'ERR-INVALID-LEVEL',
    message: 'Badge level must be between 1 and 5',
    category: 'VALIDATION'
  },
  206: {
    code: 'ERR-INVALID-CATEGORY',
    message: 'Invalid badge category',
    category: 'VALIDATION'
  },

  // Community Errors (300-399)
  300: {
    code: 'ERR-COMMUNITY-NOT-FOUND',
    message: 'Community not found',
    category: 'COMMUNITY'
  },
  301: {
    code: 'ERR-NOT-COMMUNITY-OWNER',
    message: 'You are not the owner of this community',
    category: 'PERMISSION'
  },
  302: {
    code: 'ERR-NOT-COMMUNITY-MEMBER',
    message: 'You are not a member of this community',
    category: 'PERMISSION'
  },
  303: {
    code: 'ERR-COMMUNITY-INACTIVE',
    message: 'Community is inactive',
    category: 'STATE'
  },
  304: {
    code: 'ERR-COMMUNITY-ALREADY-EXISTS',
    message: 'Community already exists',
    category: 'COMMUNITY'
  },
  305: {
    code: 'ERR-INVALID-COMMUNITY-NAME',
    message: 'Invalid community name',
    category: 'VALIDATION'
  },
  306: {
    code: 'ERR-MEMBER-ALREADY-EXISTS',
    message: 'User is already a member',
    category: 'COMMUNITY'
  },
  307: {
    code: 'ERR-MEMBER-LIMIT-REACHED',
    message: 'Community member limit reached',
    category: 'LIMIT'
  },

  // Access Control Errors (400-499)
  400: {
    code: 'ERR-INSUFFICIENT-PERMISSIONS',
    message: 'Insufficient permissions for this action',
    category: 'PERMISSION'
  },
  401: {
    code: 'ERR-INVALID-ROLE',
    message: 'Invalid role specified',
    category: 'VALIDATION'
  },
  402: {
    code: 'ERR-ROLE-ASSIGNMENT-FAILED',
    message: 'Failed to assign role',
    category: 'OPERATION'
  },
  403: {
    code: 'ERR-ACCOUNT-SUSPENDED',
    message: 'Your account has been suspended',
    category: 'PERMISSION'
  },
  404: {
    code: 'ERR-PERMISSION-DENIED',
    message: 'Permission denied',
    category: 'PERMISSION'
  },
  405: {
    code: 'ERR-NOT-PLATFORM-ADMIN',
    message: 'Platform administrator access required',
    category: 'PERMISSION'
  },

  // Metadata Errors (500-599)
  500: {
    code: 'ERR-METADATA-NOT-FOUND',
    message: 'Badge metadata not found',
    category: 'METADATA'
  },
  501: {
    code: 'ERR-INVALID-METADATA',
    message: 'Invalid metadata provided',
    category: 'VALIDATION'
  },
  502: {
    code: 'ERR-METADATA-UPDATE-FAILED',
    message: 'Failed to update metadata',
    category: 'OPERATION'
  },
  503: {
    code: 'ERR-METADATA-LOCKED',
    message: 'Metadata is locked and cannot be modified',
    category: 'STATE'
  },

  // Template Errors (600-699)
  600: {
    code: 'ERR-TEMPLATE-NOT-FOUND',
    message: 'Badge template not found',
    category: 'TEMPLATE'
  },
  601: {
    code: 'ERR-INVALID-TEMPLATE',
    message: 'Invalid template data',
    category: 'VALIDATION'
  },
  602: {
    code: 'ERR-TEMPLATE-INACTIVE',
    message: 'Template is inactive',
    category: 'STATE'
  },
  603: {
    code: 'ERR-TEMPLATE-ALREADY-EXISTS',
    message: 'Template already exists',
    category: 'TEMPLATE'
  },
  604: {
    code: 'ERR-INVALID-TEMPLATE-NAME',
    message: 'Invalid template name',
    category: 'VALIDATION'
  },
  605: {
    code: 'ERR-INVALID-TEMPLATE-DESCRIPTION',
    message: 'Invalid template description',
    category: 'VALIDATION'
  },

  // Batch Operation Errors (700-799)
  700: {
    code: 'ERR-BATCH-TOO-LARGE',
    message: 'Batch size exceeds maximum limit (50)',
    category: 'BATCH'
  },
  701: {
    code: 'ERR-BATCH-EMPTY',
    message: 'Batch cannot be empty',
    category: 'VALIDATION'
  },
  702: {
    code: 'ERR-BATCH-MISMATCHED-LENGTHS',
    message: 'Batch arrays have mismatched lengths',
    category: 'VALIDATION'
  },
  703: {
    code: 'ERR-BATCH-OPERATION-FAILED',
    message: 'Batch operation failed',
    category: 'OPERATION'
  },
  704: {
    code: 'ERR-BATCH-PARTIAL-SUCCESS',
    message: 'Some batch operations failed',
    category: 'OPERATION'
  },
  705: {
    code: 'ERR-INVALID-BATCH-INDEX',
    message: 'Invalid batch index',
    category: 'VALIDATION'
  }
} as const

export type ErrorCode = keyof typeof ERROR_CODES
export type ErrorCategory = typeof ERROR_CODES[ErrorCode]['category']

/**
 * Get user-friendly error message for a given error code
 * @param code - The error code number
 * @returns User-friendly error message
 */
export function getErrorMessage(code: number): string {
  const error = ERROR_CODES[code as ErrorCode]
  return error ? error.message : 'An unknown error occurred'
}

/**
 * Get error code constant name
 * @param code - The error code number
 * @returns Error code constant name
 */
export function getErrorCode(code: number): string {
  const error = ERROR_CODES[code as ErrorCode]
  return error ? error.code : 'UNKNOWN_ERROR'
}

/**
 * Get error category
 * @param code - The error code number
 * @returns Error category
 */
export function getErrorCategory(code: number): ErrorCategory | 'UNKNOWN' {
  const error = ERROR_CODES[code as ErrorCode]
  return error ? error.category : 'UNKNOWN'
}

/**
 * Check if an error code is a permission error
 * @param code - The error code number
 * @returns true if permission error
 */
export function isPermissionError(code: number): boolean {
  return getErrorCategory(code) === 'PERMISSION'
}

/**
 * Check if an error code is a validation error
 * @param code - The error code number
 * @returns true if validation error
 */
export function isValidationError(code: number): boolean {
  return getErrorCategory(code) === 'VALIDATION'
}

/**
 * Format error for display
 * @param code - The error code number
 * @param includeCode - Whether to include the error code in the message
 * @returns Formatted error message
 */
export function formatError(code: number, includeCode: boolean = true): string {
  const message = getErrorMessage(code)
  const errorCode = getErrorCode(code)
  return includeCode ? `${message} (${errorCode})` : message
}
