/**
 * Badge Validation Module
 *
 * Centralized validation functions and constants for badge metadata and forms.
 *
 * @module validation
 */

// Export all validation functions
export {
  validateBadgeName,
  validateBadgeDescription,
  validateBadgeCategory,
  validateBadgeLevel,
  validateBadgeMetadata,
  validateRecipientName,
  validateStacksAddress,
  validateEmail,
  validateTemplateSelection,
  validateCommunitySelection,
  validateBadgeIssuanceForm,
  validateBadgeTemplateCreation,
  validateBulkBadgeIssuance,
  getValidationErrorMessage,
  getValidBadgeCategories,
  isCategoryValid,
  isLevelInValidRange
} from './badgeValidation'

// Export types
export type {
  ValidationError,
  BadgeValidationResult
} from './badgeValidation'

// Export constants
export {
  VALIDATION_CONSTANTS
} from './badgeValidation'
