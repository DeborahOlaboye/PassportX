import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler'

export const validateStacksAddress = (address: string): boolean => {
  return /^(ST|SP)[0-9A-Z]{39}$/.test(address)
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateBadgeLevel = (level: number): boolean => {
  return Number.isInteger(level) && level >= 1 && level <= 5
}

export const validateBadgeCategory = (category: string): boolean => {
  const validCategories = [
    'skill', 'participation', 'contribution', 
    'leadership', 'learning', 'achievement', 'milestone'
  ]
  return validCategories.includes(category)
}

export const validateUserProfile = (req: Request, res: Response, next: NextFunction) => {
  const { name, bio, email } = req.body

  if (name && (typeof name !== 'string' || name.length > 100)) {
    return next(createError('Name must be a string with max 100 characters', 400))
  }

  if (bio && (typeof bio !== 'string' || bio.length > 500)) {
    return next(createError('Bio must be a string with max 500 characters', 400))
  }

  if (email && !validateEmail(email)) {
    return next(createError('Invalid email format', 400))
  }

  next()
}

export const validateBadgeTemplate = (req: Request, res: Response, next: NextFunction) => {
  const { name, description, category, level, communityId } = req.body

  if (!name || typeof name !== 'string' || name.length > 100) {
    return next(createError('Name is required and must be max 100 characters', 400))
  }

  if (!description || typeof description !== 'string' || description.length > 500) {
    return next(createError('Description is required and must be max 500 characters', 400))
  }

  if (!category || !validateBadgeCategory(category)) {
    return next(createError('Valid category is required', 400))
  }

  if (!level || !validateBadgeLevel(level)) {
    return next(createError('Level must be between 1 and 5', 400))
  }

  if (!communityId || typeof communityId !== 'string') {
    return next(createError('Community ID is required', 400))
  }

  next()
}

export const validateCommunity = (req: Request, res: Response, next: NextFunction) => {
  const { name, description } = req.body

  if (!name || typeof name !== 'string' || name.length > 100) {
    return next(createError('Name is required and must be max 100 characters', 400))
  }

  if (!description || typeof description !== 'string' || description.length > 500) {
    return next(createError('Description is required and must be max 500 characters', 400))
  }

  next()
}

export const validateBadgeIssuance = (req: Request, res: Response, next: NextFunction) => {
  const { templateId, recipientAddress } = req.body

  if (!templateId || typeof templateId !== 'string') {
    return next(createError('Template ID is required', 400))
  }

  if (!recipientAddress || !validateStacksAddress(recipientAddress)) {
    return next(createError('Valid recipient Stacks address is required', 400))
  }

  next()
}

export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return next(createError('Page must be a positive integer', 400))
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return next(createError('Limit must be between 1 and 100', 400))
  }

  next()
}