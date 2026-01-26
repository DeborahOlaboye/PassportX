/**
 * API endpoint validation helpers
 * Validates query parameters and request data to prevent injection attacks
 */

import {
  validateUserIdParameter,
  validateCustomUrlParameter,
  isSafeFromInjection,
  isValidStacksAddress,
  isValidCustomUrl,
  sanitizeInput
} from './validation'

export interface ValidationError {
  status: number
  message: string
}

/**
 * Validates query parameter from URL
 * @param value - Query parameter value
 * @param validatorFn - Validation function to use
 * @returns { isValid: boolean, sanitized?: string, error?: string }
 */
export const validateQueryParam = (
  value: unknown,
  validatorFn: (val: unknown) => { isValid: boolean; sanitized?: string; error?: string }
) => {
  if (value === undefined || value === null) {
    return {
      isValid: false,
      error: 'Query parameter is required'
    }
  }

  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: 'Query parameter must be a string'
    }
  }

  const result = validatorFn(value)
  return result
}

/**
 * Safe wrapper for API route handlers
 * Validates required query parameters before processing
 * @param searchParams - Query parameters from request
 * @param requiredParams - Map of required parameter names to validators
 * @returns Object with validated parameters or throws ValidationError
 */
export const validateApiQueryParams = (
  searchParams: Record<string, string | string[] | undefined>,
  requiredParams: Record<string, (val: unknown) => { isValid: boolean; sanitized?: string; error?: string }>
): Record<string, string> => {
  const validated: Record<string, string> = {}

  for (const [paramName, validator] of Object.entries(requiredParams)) {
    const paramValue = searchParams[paramName]

    if (!paramValue) {
      throw {
        status: 400,
        message: `Missing required parameter: ${paramName}`
      }
    }

    // Handle array values (e.g., ?param=value1&param=value2)
    const singleValue = Array.isArray(paramValue) ? paramValue[0] : paramValue

    const result = validateQueryParam(singleValue, validator)

    if (!result.isValid) {
      throw {
        status: 400,
        message: result.error || `Invalid parameter: ${paramName}`
      }
    }

    validated[paramName] = result.sanitized || ''
  }

  return validated
}

/**
 * Validates custom URL from API request
 * @param customUrl - The custom URL to validate
 * @returns Validation result
 */
export const validateCustomUrlApiParam = (customUrl: unknown) => {
  return validateQueryParam(customUrl, validateCustomUrlParameter)
}

/**
 * Validates userId from API request
 * @param userId - The userId to validate
 * @returns Validation result
 */
export const validateUserIdApiParam = (userId: unknown) => {
  return validateQueryParam(userId, validateUserIdParameter)
}

/**
 * Validates Stacks address from API request
 * @param address - The Stacks address to validate
 * @returns Validation result
 */
export const validateStacksAddressApiParam = (address: unknown) => {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Stacks address is required and must be a string'
    }
  }

  const trimmed = address.trim()

  if (!isValidStacksAddress(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid Stacks address format'
    }
  }

  if (!isSafeFromInjection(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid characters detected in address'
    }
  }

  return {
    isValid: true,
    sanitized: trimmed
  }
}

/**
 * Creates API error response
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Response object
 */
export const createApiErrorResponse = (message: string, status: number = 400) => {
  return {
    status,
    body: {
      error: message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Validates JSON request body
 * @param body - Request body object
 * @param schema - Validation schema with parameter validators
 * @returns Validated object or throws error
 */
export const validateRequestBody = (
  body: unknown,
  schema: Record<string, (val: unknown) => { isValid: boolean; sanitized?: string; error?: string }>
): Record<string, string> => {
  if (!body || typeof body !== 'object') {
    throw createApiErrorResponse('Request body must be a JSON object', 400)
  }

  const validated: Record<string, string> = {}
  const bodyObj = body as Record<string, unknown>

  for (const [fieldName, validator] of Object.entries(schema)) {
    if (!(fieldName in bodyObj)) {
      throw createApiErrorResponse(`Missing required field: ${fieldName}`, 400)
    }

    const result = validator(bodyObj[fieldName])

    if (!result.isValid) {
      throw createApiErrorResponse(result.error || `Invalid field: ${fieldName}`, 400)
    }

    validated[fieldName] = result.sanitized || ''
  }

  return validated
}

/**
 * Combines multiple field validators for complex objects
 * @param data - Object to validate
 * @param validators - Map of field names to validator functions
 * @returns Validated data
 */
export const validateMultipleFields = (
  data: unknown,
  validators: Record<string, (val: unknown) => { isValid: boolean; sanitized?: string; error?: string }>
): Record<string, string> => {
  if (!data || typeof data !== 'object') {
    throw createApiErrorResponse('Data must be an object', 400)
  }

  return validateRequestBody(data, validators)
}
