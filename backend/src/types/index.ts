import { Document } from 'mongoose'
import { Request } from 'express'

export interface IUserSocialLinks {
  twitter?: string
  github?: string
  linkedin?: string
  discord?: string
  website?: string
}

export interface IUserThemePreferences {
  mode: 'light' | 'dark' | 'system'
  accentColor?: string
}

export interface INotificationPreferences {
  badgeReceived: boolean
  communityUpdates: boolean
  systemAnnouncements: boolean
  badgeIssued: boolean
  communityInvite: boolean
  badgeVerified: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export interface IUser extends Document {
  stacksAddress: string
  email?: string
  name?: string
  bio?: string
  avatar?: string
  customUrl?: string
  socialLinks?: IUserSocialLinks
  themePreferences?: IUserThemePreferences
  notificationPreferences?: INotificationPreferences
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

export interface ICommunityMetadata {
  blockchainId?: string
  contractAddress?: string
  createdAtBlockHeight?: number
  createdAtTransactionHash?: string
  createdAtTimestamp?: Date
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
  metadata?: ICommunityMetadata
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

export type NotificationType = 'badge_received' | 'community_update' | 'community_created' | 'system_announcement' | 'badge_issued' | 'community_invite' | 'badge_verified'

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  data: {
    eventType: string
    transactionHash: string
    blockHeight: number
    timestamp: number
    [key: string]: any
  }
}

export interface INotification extends Document {
  userId: string // User's Stacks address
  type: NotificationType
  title: string
  message: string
  data?: {
    badgeId?: string
    communityId?: string
    templateId?: string
    issuer?: string
    url?: string
    [key: string]: any
  }
  read: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface INotificationQuery {
  userId: string
  type?: NotificationType | NotificationType[]
  read?: boolean
  page?: number
  limit?: number
  sortBy?: 'newest' | 'oldest'
}

export interface INotificationResult {
  notifications: INotification[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface IChainhookEventLog extends Document {
  eventId: string
  eventType: string
  status: 'received' | 'processing' | 'completed' | 'failed'
  payload: any
  processingTime?: number
  errorMessage?: string
  handler?: string
  receivedAt: Date
  processedAt?: Date
  transactionHash?: string
  blockHeight?: number
}

export interface IEventMetrics extends Document {
  timestamp: Date
  eventsReceived: number
  eventsProcessed: number
  eventsFailed: number
  averageProcessingTime: number
  minProcessingTime: number
  maxProcessingTime: number
  connectionStatus: 'connected' | 'disconnected'
  lastConnectionCheck: Date
}

export interface IHealthStatus extends Document {
  nodeUrl: string
  isConnected: boolean
  lastCheckTime: Date
  uptime: number
  failedAttempts: number
  successfulAttempts: number
  averageResponseTime: number
}

export interface IAlert extends Document {
  type: 'performance' | 'connection' | 'failed_event' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  resolved: boolean
  createdAt: Date
  resolvedAt?: Date
}