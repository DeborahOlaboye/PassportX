export interface ValidationError {
  field: string
  message: string
}

export interface BadgeValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const MAX_RECIPIENT_NAME_LENGTH = 100
const MIN_RECIPIENT_NAME_LENGTH = 2
const MIN_STACKS_ADDRESS_LENGTH = 34

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
}): BadgeValidationResult => {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Badge name is required' })
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' })
  } else if (data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' })
  }

  const validCategories = ['skill', 'participation', 'contribution', 'leadership', 'learning', 'achievement', 'milestone']
  if (!data.category || !validCategories.includes(data.category)) {
    errors.push({ field: 'category', message: 'Invalid badge category' })
  }

  if (!data.level || data.level < 1 || data.level > 5) {
    errors.push({ field: 'level', message: 'Badge level must be between 1 and 5' })
  }

  if (!data.communityId) {
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
