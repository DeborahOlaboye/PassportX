/**
 * Route parameter validation middleware and helpers
 * Provides centralized validation for dynamic route parameters
 */

import {
  validateUserIdParameter,
  validateCustomUrlParameter,
  isSafeFromInjection,
  isValidStacksAddress,
  isValidCustomUrl,
  sanitizeInput
} from './validation'

/**
 * Validates all route parameters in a route object
 * @param params - Object containing route parameters
 * @param rules - Validation rules for each parameter
 * @returns validated parameters or null if any validation fails
 */
export const validateRouteParams = (
  params: Record<string, unknown>,
  rules: Record<string, (value: unknown) => { isValid: boolean; error?: string; sanitized?: string }>
): Record<string, string> | null => {
  const validated: Record<string, string> = {}

  for (const [key, validationFn] of Object.entries(rules)) {
    if (!(key in params)) {
      console.warn(`Missing parameter: ${key}`)
      return null
    }

    const result = validationFn(params[key])
    
    if (!result.isValid) {
      console.warn(`Invalid parameter ${key}: ${result.error}`)
      return null
    }

    validated[key] = result.sanitized || ''
  }

  return validated
}

/**
 * Creates validation rules object for common patterns
 */
export const createValidationRules = () => ({
  userId: validateUserIdParameter,
  customUrl: validateCustomUrlParameter,
  stacksAddress: (value: unknown) => {
    if (!value || typeof value !== 'string') {
      return {
        isValid: false,
        error: 'Stacks address is required'
      }
    }

    const addr = value.trim()
    if (!isValidStacksAddress(addr)) {
      return {
        isValid: false,
        error: 'Invalid Stacks address format'
      }
    }

    return {
      isValid: true,
      sanitized: addr
    }
  }
})

/**
 * Safe handler for route parameter validation
 * Use this as a wrapper for page components
 * @param params - Route parameters
 * @param paramName - Name of the parameter to validate
 * @param validatorFn - Validation function to use
 * @returns {isValid: boolean, sanitized?: string, error?: string}
 */
export const validateRouteParameter = (
  params: unknown,
  paramName: string,
  validatorFn: (value: unknown) => { isValid: boolean; error?: string; sanitized?: string }
) => {
  if (!params || typeof params !== 'object' || !(paramName in params)) {
    return {
      isValid: false,
      error: `Parameter ${paramName} is required`
    }
  }

  const paramValue = (params as Record<string, unknown>)[paramName]
  const result = validatorFn(paramValue)

  if (!result.isValid) {
    return result
  }

  // Additional injection check
  if (!isSafeFromInjection(result.sanitized || '')) {
    return {
      isValid: false,
      error: 'Invalid characters detected in parameter'
    }
  }

  return result
}

/**
 * Type-safe parameter extractor with validation
 * @template T - Type of the parameter value
 * @param params - Route parameters object
 * @param paramName - Name of the parameter
 * @param validator - Validation function
 * @returns Validated parameter value or throws error
 */
export const extractValidatedParam = <T extends string>(
  params: unknown,
  paramName: string,
  validator: (value: unknown) => { isValid: boolean; sanitized?: string; error?: string }
): T => {
  if (!params || typeof params !== 'object' || !(paramName in params)) {
    throw new Error(`Parameter ${paramName} is required`)
  }

  const result = validator((params as Record<string, unknown>)[paramName])

  if (!result.isValid) {
    throw new Error(result.error || `Invalid ${paramName}`)
  }

  return (result.sanitized || '') as T
}

/**
 * Batch validates multiple parameters at once
 * @param params - Route parameters
 * @param validators - Map of parameter names to validator functions
 * @returns Object with validated parameters, or throws on first error
 */
export const validateMultipleParams = (
  params: unknown,
  validators: Record<string, (value: unknown) => { isValid: boolean; sanitized?: string; error?: string }>
): Record<string, string> => {
  const result: Record<string, string> = {}

  for (const [paramName, validator] of Object.entries(validators)) {
    const sanitized = extractValidatedParam(params, paramName, validator)
    result[paramName] = sanitized
  }

  return result
}
