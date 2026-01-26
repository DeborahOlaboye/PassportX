/**
 * Validation utilities for route parameters and user inputs
 * Prevents injection attacks and invalid data from reaching the database
 */

/**
 * Validates if a string is a valid Stacks address format
 * Stacks addresses start with SM or SP followed by 39 alphanumeric characters
 * @param addr - The address to validate
 * @returns true if valid Stacks address format
 */
export const isValidStacksAddress = (addr: string): boolean => {
  if (!addr || typeof addr !== 'string') {
    return false
  }
  // Match Stacks address format: S[PM][A-Z0-9]{39}
  const stacksAddressPattern = /^S[PM][A-Z0-9]{39}$/i
  return stacksAddressPattern.test(addr)
}

/**
 * Validates if a string is a valid custom URL slug
 * Allows alphanumeric characters, hyphens, and underscores
 * @param url - The custom URL to validate
 * @returns true if valid custom URL format
 */
export const isValidCustomUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false
  }
  
  // Allow alphanumeric, hyphens, underscores
  // Must be 3-50 characters long
  const customUrlPattern = /^[a-zA-Z0-9_-]{3,50}$/
  return customUrlPattern.test(url)
}

/**
 * Validates if a string is a valid user ID format
 * User IDs should be alphanumeric only, 6-50 characters
 * @param userId - The user ID to validate
 * @returns true if valid user ID format
 */
export const isValidUserId = (userId: string): boolean => {
  if (!userId || typeof userId !== 'string') {
    return false
  }
  
  // Allow alphanumeric characters, underscores
  // Must be 6-50 characters long
  const userIdPattern = /^[a-zA-Z0-9_]{6,50}$/
  return userIdPattern.test(userId)
}

/**
 * Sanitizes a string by removing dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return ''
  }
  
  // Remove any characters that could be used in injection attacks
  return input
    .trim()
    .replace(/[<>'"{}[\]()]/g, '') // Remove HTML/script tags and special chars
    .substring(0, 100) // Limit length
}

/**
 * Validates route parameters for userId routes
 * @param userId - The userId parameter from route
 * @returns validation result object
 */
export const validateUserIdParameter = (userId: unknown): {
  isValid: boolean
  error?: string
  sanitized?: string
} => {
  if (!userId || typeof userId !== 'string') {
    return {
      isValid: false,
      error: 'User ID is required and must be a string'
    }
  }

  const trimmedUserId = userId.trim()
  
  if (!isValidUserId(trimmedUserId) && !isValidStacksAddress(trimmedUserId)) {
    return {
      isValid: false,
      error: 'Invalid user ID format'
    }
  }

  return {
    isValid: true,
    sanitized: trimmedUserId
  }
}

/**
 * Validates route parameters for customUrl routes
 * @param customUrl - The customUrl parameter from route
 * @returns validation result object
 */
export const validateCustomUrlParameter = (customUrl: unknown): {
  isValid: boolean
  error?: string
  sanitized?: string
} => {
  if (!customUrl || typeof customUrl !== 'string') {
    return {
      isValid: false,
      error: 'Custom URL is required and must be a string'
    }
  }

  const trimmedUrl = customUrl.trim().toLowerCase()
  
  if (!isValidCustomUrl(trimmedUrl)) {
    return {
      isValid: false,
      error: 'Invalid custom URL format'
    }
  }

  return {
    isValid: true,
    sanitized: trimmedUrl
  }
}

/**
 * Validates that input doesn't contain SQL/NoSQL injection patterns
 * @param input - The input to validate
 * @returns true if input is safe
 */
export const isSafeFromInjection = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return true
  }

  // Check for common injection patterns
  const injectionPatterns = [
    /(\$where|\$ne|\$gt|\$regex|\$or)/i, // MongoDB operators
    /(union|select|insert|update|delete|drop|create)/i, // SQL keywords
    /(<script|javascript:|onerror|onload)/i, // XSS patterns
    /(\{\{|\}\}|{%|%})/i, // Template injection
  ]

  return !injectionPatterns.some(pattern => pattern.test(input))
}
