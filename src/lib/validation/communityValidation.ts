export interface ValidationError {
  field: string
  message: string
}

export interface CommunityValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const MAX_NAME_LENGTH = 100
const MIN_NAME_LENGTH = 3
const MAX_DESCRIPTION_LENGTH = 2000
const MIN_DESCRIPTION_LENGTH = 10
const MAX_ABOUT_LENGTH = 5000
const MAX_TAGS_COUNT = 20
const MAX_TAG_LENGTH = 50

export const validateCommunityName = (name: string): ValidationError | null => {
  if (!name || name.trim().length === 0) {
    return { field: 'name', message: 'Community name is required' }
  }

  const trimmedName = name.trim()

  if (trimmedName.length < MIN_NAME_LENGTH) {
    return {
      field: 'name',
      message: `Name must be at least ${MIN_NAME_LENGTH} characters`
    }
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return {
      field: 'name',
      message: `Name must not exceed ${MAX_NAME_LENGTH} characters`
    }
  }

  if (!/^[a-zA-Z0-9\s\-&'()]+$/.test(trimmedName)) {
    return {
      field: 'name',
      message: 'Name contains invalid characters'
    }
  }

  return null
}

export const validateCommunityDescription = (description: string): ValidationError | null => {
  if (!description || description.trim().length === 0) {
    return { field: 'description', message: 'Description is required' }
  }

  const trimmedDescription = description.trim()

  if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
    return {
      field: 'description',
      message: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
    }
  }

  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return {
      field: 'description',
      message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`
    }
  }

  return null
}

export const validateCommunityAbout = (about: string): ValidationError | null => {
  if (!about) {
    return null
  }

  if (about.length > MAX_ABOUT_LENGTH) {
    return {
      field: 'about',
      message: `About section must not exceed ${MAX_ABOUT_LENGTH} characters`
    }
  }

  return null
}

export const validateWebsite = (website: string): ValidationError | null => {
  if (!website) {
    return null
  }

  try {
    const url = new URL(website)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        field: 'website',
        message: 'Website must use HTTPS'
      }
    }
    return null
  } catch {
    return {
      field: 'website',
      message: 'Invalid website URL'
    }
  }
}

export const validateCommunityTags = (tagsString: string): ValidationError | null => {
  if (!tagsString) {
    return null
  }

  const tags = tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)

  if (tags.length > MAX_TAGS_COUNT) {
    return {
      field: 'tags',
      message: `Maximum ${MAX_TAGS_COUNT} tags allowed`
    }
  }

  for (const tag of tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      return {
        field: 'tags',
        message: `Each tag must not exceed ${MAX_TAG_LENGTH} characters`
      }
    }

    if (!/^[a-zA-Z0-9\-_]+$/.test(tag)) {
      return {
        field: 'tags',
        message: `Tag "${tag}" contains invalid characters. Use only letters, numbers, hyphens, and underscores`
      }
    }
  }

  return null
}

export const validateStxPayment = (amount: number): ValidationError | null => {
  if (typeof amount !== 'number' || amount < 0) {
    return {
      field: 'stxPayment',
      message: 'Payment amount must be a valid number'
    }
  }

  if (amount > 1_000_000) {
    return {
      field: 'stxPayment',
      message: 'Payment amount exceeds maximum allowed'
    }
  }

  return null
}

export const validatePrimaryColor = (color: string): ValidationError | null => {
  if (!color) {
    return { field: 'primaryColor', message: 'Primary color is required' }
  }

  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    return {
      field: 'primaryColor',
      message: 'Invalid color format'
    }
  }

  return null
}

export const validateSecondaryColor = (color: string): ValidationError | null => {
  if (!color) {
    return { field: 'secondaryColor', message: 'Secondary color is required' }
  }

  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    return {
      field: 'secondaryColor',
      message: 'Invalid color format'
    }
  }

  return null
}

export const validateCommunitySettings = (settings: {
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
}): ValidationError | null => {
  if (typeof settings.allowMemberInvites !== 'boolean') {
    return {
      field: 'settings',
      message: 'Invalid setting: allowMemberInvites must be a boolean'
    }
  }

  if (typeof settings.requireApproval !== 'boolean') {
    return {
      field: 'settings',
      message: 'Invalid setting: requireApproval must be a boolean'
    }
  }

  if (typeof settings.allowBadgeIssuance !== 'boolean') {
    return {
      field: 'settings',
      message: 'Invalid setting: allowBadgeIssuance must be a boolean'
    }
  }

  if (typeof settings.allowCustomBadges !== 'boolean') {
    return {
      field: 'settings',
      message: 'Invalid setting: allowCustomBadges must be a boolean'
    }
  }

  return null
}

export const validateFullCommunity = (data: {
  name: string
  description: string
  about?: string
  website?: string
  primaryColor: string
  secondaryColor: string
  stxPayment: number
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
  tags?: string
}): CommunityValidationResult => {
  const errors: ValidationError[] = []

  const nameError = validateCommunityName(data.name)
  if (nameError) errors.push(nameError)

  const descriptionError = validateCommunityDescription(data.description)
  if (descriptionError) errors.push(descriptionError)

  const aboutError = validateCommunityAbout(data.about || '')
  if (aboutError) errors.push(aboutError)

  const websiteError = validateWebsite(data.website || '')
  if (websiteError) errors.push(websiteError)

  const tagsError = validateCommunityTags(data.tags || '')
  if (tagsError) errors.push(tagsError)

  const paymentError = validateStxPayment(data.stxPayment)
  if (paymentError) errors.push(paymentError)

  const primaryColorError = validatePrimaryColor(data.primaryColor)
  if (primaryColorError) errors.push(primaryColorError)

  const secondaryColorError = validateSecondaryColor(data.secondaryColor)
  if (secondaryColorError) errors.push(secondaryColorError)

  const settingsError = validateCommunitySettings({
    allowMemberInvites: data.allowMemberInvites,
    requireApproval: data.requireApproval,
    allowBadgeIssuance: data.allowBadgeIssuance,
    allowCustomBadges: data.allowCustomBadges
  })
  if (settingsError) errors.push(settingsError)

  return {
    valid: errors.length === 0,
    errors
  }
}
