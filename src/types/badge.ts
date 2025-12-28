export interface BadgeTemplate {
  id: string
  name: string
  description: string
  category: BadgeCategory
  level: BadgeLevel
  icon?: string
  requirements?: string
  community: {
    id: string
    name: string
  }
  creator: string
  createdAt: Date
  isActive: boolean
}

export interface BadgeMetadata {
  level: BadgeLevel
  category: BadgeCategory
  timestamp: number
  active?: boolean
  revokedAt?: number
  revocationReason?: string
}

export interface Badge {
  id: string
  templateId: string
  templateName?: string
  owner: string
  ownerName?: string
  issuer: string
  issuerName?: string
  community: {
    id: string
    name: string
  }
  tokenId?: number
  transactionId?: string
  issuedAt: Date
  metadata: BadgeMetadata
  status?: 'active' | 'revoked'
}

export interface BadgeIssuanceRequest {
  txId: string
  recipientAddress: string
  templateId: number
  communityId: number
  issuerAddress: string
  recipientName?: string
  recipientEmail?: string
  network: 'testnet' | 'mainnet'
  createdAt: string
}

export interface BadgeIssuanceResponse {
  id: string
  txId: string
  recipient: string
  template: string
  status: 'issued' | 'pending'
  issuedAt: Date
}

export interface BadgeActivity {
  badgeId: string
  action: 'issued' | 'received' | 'revoked'
  date: Date
  reason?: string
}

export type BadgeCategory = 
  | 'skill'
  | 'participation'
  | 'contribution'
  | 'leadership'
  | 'learning'
  | 'achievement'
  | 'milestone'

export type BadgeLevel = 1 | 2 | 3 | 4 | 5

export interface BadgeStatistics {
  totalIssued: number
  uniqueRecipients: number
  categoryBreakdown: Record<BadgeCategory, number>
  levelBreakdown: Record<BadgeLevel, number>
  recentBadges: Array<{
    id: string
    recipient: string
    template: string
    level: BadgeLevel
    issuedAt: Date
  }>
}

export interface BadgeSearchFilters {
  category?: BadgeCategory
  level?: BadgeLevel
  community?: string
  issuer?: string
  recipient?: string
  status?: 'active' | 'revoked'
  dateFrom?: Date
  dateTo?: Date
}

export interface BadgeExportData {
  badges: Badge[]
  format: 'json' | 'csv'
  exportedAt: Date
  total: number
}
