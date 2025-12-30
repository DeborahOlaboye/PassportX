export interface ValidationError {
  field: string
  message: string
}

export interface BadgeValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Validation constants - exported for external use
export const VALIDATION_CONSTANTS = {
  MAX_RECIPIENT_NAME_LENGTH: 100,
  MIN_RECIPIENT_NAME_LENGTH: 2,
  MIN_STACKS_ADDRESS_LENGTH: 34,
  MAX_BADGE_NAME_LENGTH: 64,
  MIN_BADGE_NAME_LENGTH: 1,
  MAX_BADGE_DESCRIPTION_LENGTH: 256,
  MIN_BADGE_DESCRIPTION_LENGTH: 10,
  MIN_BADGE_LEVEL: 1,
  MAX_BADGE_LEVEL: 5
} as const

const MAX_RECIPIENT_NAME_LENGTH = VALIDATION_CONSTANTS.MAX_RECIPIENT_NAME_LENGTH
const MIN_RECIPIENT_NAME_LENGTH = VALIDATION_CONSTANTS.MIN_RECIPIENT_NAME_LENGTH
const MIN_STACKS_ADDRESS_LENGTH = VALIDATION_CONSTANTS.MIN_STACKS_ADDRESS_LENGTH

const MAX_BADGE_NAME_LENGTH = VALIDATION_CONSTANTS.MAX_BADGE_NAME_LENGTH
const MIN_BADGE_NAME_LENGTH = VALIDATION_CONSTANTS.MIN_BADGE_NAME_LENGTH
const MAX_BADGE_DESCRIPTION_LENGTH = VALIDATION_CONSTANTS.MAX_BADGE_DESCRIPTION_LENGTH
const MIN_BADGE_DESCRIPTION_LENGTH = VALIDATION_CONSTANTS.MIN_BADGE_DESCRIPTION_LENGTH

const VALID_BADGE_CATEGORIES = [
  'skill',
  'participation',
  'contribution',
  'leadership',
  'learning',
  'achievement',
  'milestone'
] as const

const MIN_BADGE_LEVEL = VALIDATION_CONSTANTS.MIN_BADGE_LEVEL
const MAX_BADGE_LEVEL = VALIDATION_CONSTANTS.MAX_BADGE_LEVEL

const BADGE_NAME_PATTERN = /^[a-zA-Z0-9\s]+$/

export const validateRecipientName = (name: string): ValidationError | null => {
  if (!name || name.trim().length === 0) {
    return { field: 'recipientName', message: 'Recipient name is required' }
  }

  const trimmedName = name.trim()

  if (trimmedName.length < MIN_RECIPIENT_NAME_LENGTH) {
    return {
      field: 'recipientName',
      message: `Name must be at least ${MIN_RECIPIENT_NAME_LENGTH} characters`
    }
  }

  if (trimmedName.length > MAX_RECIPIENT_NAME_LENGTH) {
    return {
      field: 'recipientName',
      message: `Name must not exceed ${MAX_RECIPIENT_NAME_LENGTH} characters`
    }
  }

  return null
}

export const validateStacksAddress = (address: string): ValidationError | null => {
  if (!address || address.trim().length === 0) {
    return { field: 'recipientAddress', message: 'Stacks address is required' }
  }

  const trimmedAddress = address.trim()

  if (trimmedAddress.length < MIN_STACKS_ADDRESS_LENGTH) {
    return {
      field: 'recipientAddress',
      message: 'Invalid Stacks address format'
    }
  }

  if (!trimmedAddress.match(/^[ST][P1-9A-HJ-NP-Z]{32,33}$/i)) {
    return {
      field: 'recipientAddress',
      message: 'Invalid Stacks address format. Must start with S or SP'
    }
  }

  return null
}

export const validateEmail = (email: string): ValidationError | null => {
  if (!email || email.trim().length === 0) {
    return null
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email.trim())) {
    return { field: 'recipientEmail', message: 'Invalid email format' }
  }

  return null
}

export const validateTemplateSelection = (templateId: number): ValidationError | null => {
  if (!templateId || templateId <= 0) {
    return { field: 'templateId', message: 'Please select a badge template' }
  }

  return null
}

export const validateCommunitySelection = (communityId: number): ValidationError | null => {
  if (!communityId || communityId <= 0) {
    return { field: 'communityId', message: 'Please select a community' }
  }

  return null
}

/**
 * Validates a badge name according to the following rules:
 * - Cannot be empty
 * - Maximum 64 characters
 * - Only alphanumeric characters and spaces allowed
 *
 * @param name - The badge name to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateBadgeName = (name: string): ValidationError | null => {
  if (!name || name.trim().length === 0) {
    return { field: 'name', message: 'Badge name is required' }
  }

  const trimmedName = name.trim()

  if (trimmedName.length > MAX_BADGE_NAME_LENGTH) {
    return {
      field: 'name',
      message: `Badge name must not exceed ${MAX_BADGE_NAME_LENGTH} characters (current: ${trimmedName.length})`
    }
  }

  if (!BADGE_NAME_PATTERN.test(trimmedName)) {
    return {
      field: 'name',
      message: 'Badge name can only contain alphanumeric characters and spaces'
    }
  }

  return null
}

/**
 * Validates a badge description according to the following rules:
 * - Cannot be empty
 * - Minimum 10 characters
 * - Maximum 256 characters
 *
 * @param description - The badge description to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateBadgeDescription = (description: string): ValidationError | null => {
  if (!description || description.trim().length === 0) {
    return { field: 'description', message: 'Badge description is required' }
  }

  const trimmedDescription = description.trim()

  if (trimmedDescription.length < MIN_BADGE_DESCRIPTION_LENGTH) {
    return {
      field: 'description',
      message: `Badge description must be at least ${MIN_BADGE_DESCRIPTION_LENGTH} characters (current: ${trimmedDescription.length})`
    }
  }

  if (trimmedDescription.length > MAX_BADGE_DESCRIPTION_LENGTH) {
    return {
      field: 'description',
      message: `Badge description must not exceed ${MAX_BADGE_DESCRIPTION_LENGTH} characters (current: ${trimmedDescription.length})`
    }
  }

  return null
}

/**
 * Validates a badge category against a list of valid categories.
 * Default valid categories: skill, participation, contribution, leadership, learning, achievement, milestone
 *
 * @param category - The badge category to validate
 * @param validCategories - Optional custom list of valid categories
 * @returns ValidationError if invalid, null if valid
 */
export const validateBadgeCategory = (
  category: string,
  validCategories?: string[]
): ValidationError | null => {
  if (!category || category.trim().length === 0) {
    return { field: 'category', message: 'Badge category is required' }
  }

  const categoriesToCheck = validCategories || Array.from(VALID_BADGE_CATEGORIES)

  if (!categoriesToCheck.includes(category.toLowerCase())) {
    return {
      field: 'category',
      message: `Invalid badge category. Must be one of: ${categoriesToCheck.join(', ')}`
    }
  }

  return null
}

/**
 * Validates a badge level according to the following rules:
 * - Must be an integer
 * - Must be between 1 and 5 (inclusive)
 *
 * @param level - The badge level to validate
 * @returns ValidationError if invalid, null if valid
 */
export const validateBadgeLevel = (level: number): ValidationError | null => {
  if (level === null || level === undefined) {
    return { field: 'level', message: 'Badge level is required' }
  }

  if (!Number.isInteger(level)) {
    return { field: 'level', message: 'Badge level must be a whole number' }
  }

  if (level < MIN_BADGE_LEVEL || level > MAX_BADGE_LEVEL) {
    return {
      field: 'level',
      message: `Badge level must be between ${MIN_BADGE_LEVEL} and ${MAX_BADGE_LEVEL} (provided: ${level})`
    }
  }

  return null
}

/**
 * Validates all badge metadata fields in one function call.
 * Performs comprehensive validation of name, description, category, and level.
 *
 * @param data - Badge metadata object containing name, description, category, level, and optional validCategories
 * @returns BadgeValidationResult with valid flag and array of errors if any
 */
export const validateBadgeMetadata = (data: {
  name: string
  description: string
  category: string
  level: number
  validCategories?: string[]
}): BadgeValidationResult => {
  const errors: ValidationError[] = []

  const nameError = validateBadgeName(data.name)
  if (nameError) errors.push(nameError)

  const descriptionError = validateBadgeDescription(data.description)
  if (descriptionError) errors.push(descriptionError)

  const categoryError = validateBadgeCategory(data.category, data.validCategories)
  if (categoryError) errors.push(categoryError)

  const levelError = validateBadgeLevel(data.level)
  if (levelError) errors.push(levelError)

  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateBadgeIssuanceForm = (data: {
  recipientName: string
  recipientAddress: string
  recipientEmail?: string
  templateId: number
  communityId: number
}): BadgeValidationResult => {
  const errors: ValidationError[] = []

  const nameError = validateRecipientName(data.recipientName)
  if (nameError) errors.push(nameError)

  const addressError = validateStacksAddress(data.recipientAddress)
  if (addressError) errors.push(addressError)

  if (data.recipientEmail) {
    const emailError = validateEmail(data.recipientEmail)
    if (emailError) errors.push(emailError)
  }

  const templateError = validateTemplateSelection(data.templateId)
  if (templateError) errors.push(templateError)

  const communityError = validateCommunitySelection(data.communityId)
  if (communityError) errors.push(communityError)

  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateBadgeTemplateCreation = (data: {
  name: string
  description: string
  category: string
  level: number
  communityId: string
  validCategories?: string[]
}): BadgeValidationResult => {
  const errors: ValidationError[] = []

  const nameError = validateBadgeName(data.name)
  if (nameError) errors.push(nameError)

  const descriptionError = validateBadgeDescription(data.description)
  if (descriptionError) errors.push(descriptionError)

  const categoryError = validateBadgeCategory(data.category, data.validCategories)
  if (categoryError) errors.push(categoryError)

  const levelError = validateBadgeLevel(data.level)
  if (levelError) errors.push(levelError)

  if (!data.communityId || data.communityId.trim().length === 0) {
    errors.push({ field: 'communityId', message: 'Please select a community' })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateBulkBadgeIssuance = (recipients: Array<{
  name: string
  address: string
  email?: string
}>): BadgeValidationResult => {
  const errors: ValidationError[] = []

  if (!recipients || recipients.length === 0) {
    errors.push({ field: 'recipients', message: 'At least one recipient is required' })
    return { valid: false, errors }
  }

  if (recipients.length > 1000) {
    errors.push({ field: 'recipients', message: 'Cannot issue to more than 1000 recipients at once' })
  }

  recipients.forEach((recipient, index) => {
    const nameError = validateRecipientName(recipient.name)
    if (nameError) {
      errors.push({ field: `recipients[${index}].name`, message: nameError.message })
    }

    const addressError = validateStacksAddress(recipient.address)
    if (addressError) {
      errors.push({ field: `recipients[${index}].address`, message: addressError.message })
    }

    if (recipient.email) {
      const emailError = validateEmail(recipient.email)
      if (emailError) {
        errors.push({ field: `recipients[${index}].email`, message: emailError.message })
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

export const getValidationErrorMessage = (field: string, errors: ValidationError[]): string | null => {
  const error = errors.find(e => e.field === field)
  return error ? error.message : null
}

/**
 * Returns the array of valid badge categories.
 *
 * @returns Array of valid badge category strings
 */
export const getValidBadgeCategories = (): typeof VALID_BADGE_CATEGORIES => {
  return VALID_BADGE_CATEGORIES
}

/**
 * Checks if a given category is in the list of valid badge categories.
 *
 * @param category - The category to check
 * @returns true if category is valid, false otherwise
 */
export const isCategoryValid = (category: string): boolean => {
  return VALID_BADGE_CATEGORIES.includes(category as any)
}

/**
 * Checks if a given level is within the valid range (1-5) and is an integer.
 *
 * @param level - The level to check
 * @returns true if level is valid, false otherwise
 */
export const isLevelInValidRange = (level: number): boolean => {
  return Number.isInteger(level) && level >= MIN_BADGE_LEVEL && level <= MAX_BADGE_LEVEL
}
