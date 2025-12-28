import { v4 as uuidv4 } from 'uuid';

export interface CommunityMetadata {
  id: string
  chainId: number
  network: 'testnet' | 'mainnet'
  name: string
  slug: string
  description: string
  about?: string
  website?: string
  theme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor?: string
    textColor?: string
  }
  owner: string
  createdAt: string
  createdAtBlock?: number
  transactionId?: string
  tags: string[]
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
    allowBadgeIssuance: boolean
    allowCustomBadges: boolean
  }
  stats: {
    memberCount: number
    badgeCount: number
    totalStaked: number
  }
  verification: {
    verified: boolean
    verifiedAt?: string
    verificationStatus: 'pending' | 'approved' | 'rejected'
  }
}

export interface CommunityMetadataInput {
  name: string
  description: string
  about?: string
  website?: string
  primaryColor: string
  secondaryColor: string
  owner: string
  tags?: string[]
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
    allowBadgeIssuance: boolean
    allowCustomBadges: boolean
  }
  network: 'testnet' | 'mainnet'
  transactionId?: string
}

export const createCommunityMetadata = (
  input: CommunityMetadataInput
): CommunityMetadata => {
  const slug = generateSlug(input.name)
  const now = new Date().toISOString()

  return {
    id: uuidv4(),
    chainId: input.network === 'mainnet' ? 1 : 5,
    network: input.network,
    name: input.name,
    slug,
    description: input.description,
    about: input.about,
    website: input.website,
    theme: {
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    },
    owner: input.owner,
    createdAt: now,
    transactionId: input.transactionId,
    tags: input.tags || [],
    settings: input.settings,
    stats: {
      memberCount: 1,
      badgeCount: 0,
      totalStaked: 0
    },
    verification: {
      verified: false,
      verificationStatus: 'pending'
    }
  }
}

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 64)
}

export const validateSlug = (slug: string): boolean => {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 64
}

export const serializeMetadata = (metadata: CommunityMetadata): string => {
  return JSON.stringify(metadata)
}

export const deserializeMetadata = (data: string): CommunityMetadata => {
  return JSON.parse(data) as CommunityMetadata
}

export const encodeMetadataForContract = (metadata: CommunityMetadata): {
  name: string
  description: string
  encoded: string
} => {
  return {
    name: metadata.name,
    description: metadata.description,
    encoded: Buffer.from(serializeMetadata(metadata)).toString('base64')
  }
}

export const decodeMetadataFromContract = (encoded: string): CommunityMetadata => {
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
  return deserializeMetadata(decoded)
}

export const validateCommunityMetadata = (
  metadata: CommunityMetadata
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!metadata.id || metadata.id.trim().length === 0) {
    errors.push('Community ID is required')
  }

  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push('Community name is required')
  } else if (metadata.name.length > 100) {
    errors.push('Community name must not exceed 100 characters')
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push('Community description is required')
  } else if (metadata.description.length > 2000) {
    errors.push('Community description must not exceed 2000 characters')
  }

  if (!validateSlug(metadata.slug)) {
    errors.push('Invalid community slug')
  }

  if (!metadata.owner || metadata.owner.trim().length === 0) {
    errors.push('Community owner is required')
  }

  if (!['testnet', 'mainnet'].includes(metadata.network)) {
    errors.push('Invalid network')
  }

  if (!metadata.theme || !metadata.theme.primaryColor || !metadata.theme.secondaryColor) {
    errors.push('Community theme colors are required')
  }

  if (!metadata.settings) {
    errors.push('Community settings are required')
  }

  if (!metadata.createdAt) {
    errors.push('Creation timestamp is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export const generateMetadataReport = (metadata: CommunityMetadata): string => {
  const report = `
Community Metadata Report
========================

ID: ${metadata.id}
Name: ${metadata.name}
Slug: ${metadata.slug}
Network: ${metadata.network}
Chain ID: ${metadata.chainId}

Description: ${metadata.description}
About: ${metadata.about || 'Not provided'}
Website: ${metadata.website || 'Not provided'}

Owner: ${metadata.owner}
Created At: ${metadata.createdAt}
Transaction ID: ${metadata.transactionId || 'Not set'}

Theme:
  Primary Color: ${metadata.theme.primaryColor}
  Secondary Color: ${metadata.theme.secondaryColor}
  Background Color: ${metadata.theme.backgroundColor}
  Text Color: ${metadata.theme.textColor}

Settings:
  Allow Member Invites: ${metadata.settings.allowMemberInvites}
  Require Approval: ${metadata.settings.requireApproval}
  Allow Badge Issuance: ${metadata.settings.allowBadgeIssuance}
  Allow Custom Badges: ${metadata.settings.allowCustomBadges}

Statistics:
  Members: ${metadata.stats.memberCount}
  Badges: ${metadata.stats.badgeCount}
  Total Staked: ${metadata.stats.totalStaked}

Verification:
  Verified: ${metadata.verification.verified}
  Status: ${metadata.verification.verificationStatus}
  Verified At: ${metadata.verification.verifiedAt || 'Not verified'}

Tags: ${metadata.tags.join(', ') || 'None'}
`;
  return report.trim()
}

export const updateMetadataStats = (
  metadata: CommunityMetadata,
  updates: Partial<CommunityMetadata['stats']>
): CommunityMetadata => {
  return {
    ...metadata,
    stats: {
      ...metadata.stats,
      ...updates
    }
  }
}

export const updateMetadataVerification = (
  metadata: CommunityMetadata,
  verified: boolean,
  status: 'pending' | 'approved' | 'rejected' = 'approved'
): CommunityMetadata => {
  return {
    ...metadata,
    verification: {
      verified,
      verificationStatus: status,
      verifiedAt: verified ? new Date().toISOString() : metadata.verification.verifiedAt
    }
  }
}

export const exportMetadataAsJSON = (metadata: CommunityMetadata): Blob => {
  const jsonString = JSON.stringify(metadata, null, 2)
  return new Blob([jsonString], { type: 'application/json' })
}

export const exportMetadataAsCSV = (communities: CommunityMetadata[]): Blob => {
  const headers = [
    'ID',
    'Name',
    'Slug',
    'Owner',
    'Network',
    'Created At',
    'Members',
    'Badges',
    'Verified',
    'Tags'
  ]

  const rows = communities.map(c => [
    c.id,
    c.name,
    c.slug,
    c.owner,
    c.network,
    c.createdAt,
    c.stats.memberCount,
    c.stats.badgeCount,
    c.verification.verified ? 'Yes' : 'No',
    c.tags.join(';')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return new Blob([csvContent], { type: 'text/csv' })
}
