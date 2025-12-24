/**
 * Profile validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate custom URL format
 */
export function validateCustomUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: false, error: 'Custom URL is required' }
  }

  if (url.length < 3) {
    return { isValid: false, error: 'Custom URL must be at least 3 characters long' }
  }

  if (url.length > 30) {
    return { isValid: false, error: 'Custom URL must be at most 30 characters long' }
  }

  const urlRegex = /^[a-z0-9-]+$/
  if (!urlRegex.test(url)) {
    return {
      isValid: false,
      error: 'Custom URL can only contain lowercase letters, numbers, and hyphens'
    }
  }

  if (url.startsWith('-') || url.endsWith('-')) {
    return { isValid: false, error: 'Custom URL cannot start or end with a hyphen' }
  }

  if (url.includes('--')) {
    return { isValid: false, error: 'Custom URL cannot contain consecutive hyphens' }
  }

  // Reserved words
  const reservedWords = [
    'admin', 'api', 'app', 'auth', 'blog', 'dashboard', 'docs', 'help',
    'login', 'logout', 'register', 'settings', 'support', 'user', 'users',
    'public', 'private', 'system', 'root', 'test', 'about', 'contact'
  ]

  if (reservedWords.includes(url.toLowerCase())) {
    return { isValid: false, error: 'This URL is reserved and cannot be used' }
  }

  return { isValid: true }
}

/**
 * Validate display name
 */
export function validateDisplayName(name: string): ValidationResult {
  if (!name) {
    return { isValid: true } // Name is optional
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Display name must be at most 100 characters long' }
  }

  return { isValid: true }
}

/**
 * Validate bio
 */
export function validateBio(bio: string): ValidationResult {
  if (!bio) {
    return { isValid: true } // Bio is optional
  }

  if (bio.length > 500) {
    return { isValid: false, error: 'Bio must be at most 500 characters long' }
  }

  return { isValid: true }
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: true } // URL is optional
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' }
  }
}

/**
 * Validate social username
 */
export function validateSocialUsername(username: string, platform: string): ValidationResult {
  if (!username) {
    return { isValid: true } // Username is optional
  }

  // Remove @ if present
  const cleanUsername = username.replace('@', '')

  if (cleanUsername.length < 1) {
    return { isValid: false, error: `${platform} username is required` }
  }

  if (cleanUsername.length > 50) {
    return { isValid: false, error: `${platform} username must be at most 50 characters` }
  }

  // Basic alphanumeric check with underscores and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(cleanUsername)) {
    return {
      isValid: false,
      error: `${platform} username can only contain letters, numbers, underscores, and hyphens`
    }
  }

  return { isValid: true }
}

/**
 * Validate hex color
 */
export function validateHexColor(color: string): ValidationResult {
  if (!color) {
    return { isValid: true } // Color is optional
  }

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!hexRegex.test(color)) {
    return { isValid: false, error: 'Please enter a valid hex color code (e.g., #3B82F6)' }
  }

  return { isValid: true }
}

/**
 * Validate entire profile data
 */
export interface ProfileData {
  name?: string
  bio?: string
  customUrl?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
    discord?: string
    website?: string
  }
  themePreferences?: {
    mode: 'light' | 'dark' | 'system'
    accentColor?: string
  }
}

export function validateProfileData(data: ProfileData): ValidationResult {
  // Validate display name
  const nameResult = validateDisplayName(data.name || '')
  if (!nameResult.isValid) return nameResult

  // Validate bio
  const bioResult = validateBio(data.bio || '')
  if (!bioResult.isValid) return bioResult

  // Validate custom URL
  if (data.customUrl) {
    const urlResult = validateCustomUrl(data.customUrl)
    if (!urlResult.isValid) return urlResult
  }

  // Validate social links
  if (data.socialLinks) {
    if (data.socialLinks.twitter) {
      const result = validateSocialUsername(data.socialLinks.twitter, 'Twitter')
      if (!result.isValid) return result
    }

    if (data.socialLinks.github) {
      const result = validateSocialUsername(data.socialLinks.github, 'GitHub')
      if (!result.isValid) return result
    }

    if (data.socialLinks.linkedin) {
      const result = validateSocialUsername(data.socialLinks.linkedin, 'LinkedIn')
      if (!result.isValid) return result
    }

    if (data.socialLinks.discord) {
      const result = validateSocialUsername(data.socialLinks.discord, 'Discord')
      if (!result.isValid) return result
    }

    if (data.socialLinks.website) {
      const result = validateUrl(data.socialLinks.website)
      if (!result.isValid) return result
    }
  }

  // Validate theme preferences
  if (data.themePreferences?.accentColor) {
    const colorResult = validateHexColor(data.themePreferences.accentColor)
    if (!colorResult.isValid) return colorResult
  }

  return { isValid: true }
}

/**
 * Sanitize custom URL
 */
export function sanitizeCustomUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 30)
}

/**
 * Sanitize social username
 */
export function sanitizeSocialUsername(username: string): string {
  return username
    .replace('@', '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 50)
}
