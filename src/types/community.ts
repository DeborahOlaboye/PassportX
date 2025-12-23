export interface CommunityTheme {
  primaryColor: string
  secondaryColor: string
  backgroundColor?: string
  textColor?: string
  borderRadius?: string
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

export interface CommunitySettings {
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
}

export interface SocialLinks {
  twitter?: string
  discord?: string
  telegram?: string
  github?: string
  linkedin?: string
  website?: string
}

export interface CommunityMetadata {
  transactionId?: string
  network?: 'testnet' | 'mainnet'
  stxPayment?: number
  blockchainVerified?: boolean
  approvalStatus?: 'pending' | 'under_review' | 'approved' | 'rejected'
  approvalRequestedAt?: Date
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  rejectedBy?: string
  createdAt?: Date
}

export interface Community {
  _id: string
  id?: string
  name: string
  slug: string
  description: string
  about?: string
  website?: string
  admins: string[]
  theme: CommunityTheme
  settings: CommunitySettings
  socialLinks?: SocialLinks
  memberCount: number
  badgeTemplates: string[]
  isPublic: boolean
  isActive: boolean
  tags: string[]
  metadata?: CommunityMetadata
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateCommunityInput {
  name: string
  description: string
  about?: string
  website?: string
  theme: {
    primaryColor: string
    secondaryColor: string
  }
  settings: CommunitySettings
  tags?: string[]
  stxPayment: number
  network: 'testnet' | 'mainnet'
}

export interface CommunityCreationResponse {
  success: boolean
  message: string
  community?: Community
  transactionId?: string
  communityId?: string
}

export interface CommunitiesListResponse {
  data: Community[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface CommunityApprovalStatus {
  communityId: string
  communityName: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  requestedAt?: Date
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  admins: string[]
}

export interface CommunityAnalytics {
  totalMembers: number
  totalBadgeTemplates: number
  totalIssuedBadges: number
  badgesByCategory: Record<string, number>
  badgesByLevel: Record<number, number>
  monthlyIssuance: Record<string, number>
  averageBadgesPerMember: number
}

export interface CommunityMember {
  stacksAddress: string
  name?: string
  avatar?: string
  badgeCount: number
  joinDate?: Date
}

export interface CommunityLeaderboardEntry {
  stacksAddress: string
  name: string
  avatar?: string
  badgeCount: number
  highestLevel: number
  latestBadge: Date
}

export interface PendingCommunity {
  _id: string
  name: string
  description: string
  admins: string[]
  theme: CommunityTheme
  memberCount: number
  createdAt: Date
  metadata?: CommunityMetadata
}

export interface TransactionValidationResult {
  valid: boolean
  txId: string
  status: 'success' | 'pending' | 'failed'
  network: 'testnet' | 'mainnet'
  timestamp: Date
}
