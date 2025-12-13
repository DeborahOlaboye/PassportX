import { Document } from 'mongoose'

export interface IUser extends Document {
  stacksAddress: string
  email?: string
  name?: string
  bio?: string
  avatar?: string
  isPublic: boolean
  joinDate: Date
  lastActive: Date
}

export interface ICommunity extends Document {
  name: string
  description: string
  admin: string // Stacks address
  theme: {
    primaryColor: string
    logo?: string
  }
  memberCount: number
  badgeTemplates: string[] // Badge template IDs
  isActive: boolean
  createdAt: Date
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