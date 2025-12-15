import { Document } from 'mongoose'
import { Request } from 'express'

export interface IUser extends Document {
  stacksAddress: string
  email?: string
  name?: string
  bio?: string
  avatar?: string
  isPublic: boolean
  joinDate: Date
  lastActive: Date
  communities: string[]
  adminCommunities: string[]
}

export interface ICommunityTheme {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  logo?: {
    url: string
    width?: number
    height?: number
  }
  bannerImage?: {
    url: string
    width?: number
    height?: number
  }
}

export interface ICommunitySettings {
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
}

export interface ISocialLinks {
  twitter?: string
  discord?: string
  telegram?: string
  github?: string
  linkedin?: string
}

export interface ICommunity extends Document {
  name: string
  slug: string
  description: string
  about?: string
  website?: string
  admins: string[] // Array of Stacks addresses
  theme: ICommunityTheme
  socialLinks?: ISocialLinks
  memberCount: number
  badgeTemplates: string[] // Badge template IDs
  isPublic: boolean
  isActive: boolean
  settings: ICommunitySettings
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface IBadgeTemplate extends Document {
  name: string
  description: string
  category: string
  level: number
  icon?: string
  requirements?: string
  community: string // Community ID
  creator: string // Stacks address
  isActive: boolean
  createdAt: Date
}

export interface IBadge extends Document {
  templateId: string // Badge template ID
  owner: string // Stacks address
  issuer: string // Stacks address
  community: string // Community ID
  tokenId?: number // NFT token ID on blockchain
  transactionId?: string // Stacks transaction ID
  issuedAt: Date
  metadata: {
    level: number
    category: string
    timestamp: number
  }
}

export interface AuthRequest extends Request {
  user?: {
    stacksAddress: string
    userId: string
  }
}

export interface IBadgeVerification {
  badgeId: string
  verified: boolean
  active: boolean
  owner: string
  issuer: string
  level: number
  category: string
  timestamp: number
  templateName?: string
  templateDescription?: string
  communityName?: string
  verifiedAt: Date
}

export interface IVerificationRequest {
  badgeId: string
  claimedOwner?: string
}

export interface IVerificationResponse {
  success: boolean
  verification?: IBadgeVerification
  error?: string
  message?: string
}

export interface IBadgeSearchQuery {
  search?: string
  level?: number | number[]
  category?: string | string[]
  issuer?: string
  community?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
  sortBy?: 'newest' | 'oldest' | 'level-high' | 'level-low' | 'name-asc' | 'name-desc'
}

export interface IBadgeSearchResult {
  badges: IBadge[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface IBadgeFilters {
  levels: number[]
  categories: string[]
  communities: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface IBadgeSortOption {
  value: string
  label: string
  field: string
  order: 'asc' | 'desc'
}