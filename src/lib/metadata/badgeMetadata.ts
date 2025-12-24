export interface BadgeMetadata {
  level: number
  category: string
  timestamp: number
  issuer: string
  recipient: string
  templateName?: string
  templateDescription?: string
  communityName?: string
  isActive: boolean
  ipfsHash?: string
  additionalData?: Record<string, unknown>
}

export interface SerializedBadgeMetadata {
  level: number
  category: string
  timestamp: number
  issuer: string
  recipient: string
  templateName: string
  templateDescription: string
  communityName: string
  isActive: boolean
}

export const badgeMetadataUtils = {
  create(data: {
    level: number
    category: string
    issuer: string
    recipient: string
    templateName?: string
    templateDescription?: string
    communityName?: string
    additionalData?: Record<string, unknown>
  }): BadgeMetadata {
    return {
      level: data.level,
      category: data.category,
      timestamp: Math.floor(Date.now() / 1000),
      issuer: data.issuer,
      recipient: data.recipient,
      templateName: data.templateName,
      templateDescription: data.templateDescription,
      communityName: data.communityName,
      isActive: true,
      additionalData: data.additionalData
    }
  },

  serialize(metadata: BadgeMetadata): SerializedBadgeMetadata {
    return {
      level: metadata.level,
      category: metadata.category,
      timestamp: metadata.timestamp,
      issuer: metadata.issuer,
      recipient: metadata.recipient,
      templateName: metadata.templateName || '',
      templateDescription: metadata.templateDescription || '',
      communityName: metadata.communityName || '',
      isActive: metadata.isActive
    }
  },

  deserialize(data: Record<string, unknown>): BadgeMetadata {
    return {
      level: (data.level as number) || 1,
      category: (data.category as string) || '',
      timestamp: (data.timestamp as number) || Math.floor(Date.now() / 1000),
      issuer: (data.issuer as string) || '',
      recipient: (data.recipient as string) || '',
      templateName: (data.templateName as string) || undefined,
      templateDescription: (data.templateDescription as string) || undefined,
      communityName: (data.communityName as string) || undefined,
      isActive: (data.isActive as boolean) ?? true,
      additionalData: (data.additionalData as Record<string, unknown>) || {}
    }
  },

  toJSON(metadata: BadgeMetadata): string {
    return JSON.stringify(this.serialize(metadata))
  },

  fromJSON(json: string): BadgeMetadata {
    const parsed = JSON.parse(json)
    return this.deserialize(parsed)
  },

  encodeForContract(metadata: BadgeMetadata): string {
    const serialized = this.serialize(metadata)
    return Buffer.from(JSON.stringify(serialized)).toString('base64')
  },

  decodeFromContract(encoded: string): BadgeMetadata {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    return this.deserialize(parsed)
  },

  validate(metadata: BadgeMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (metadata.level < 1 || metadata.level > 5) {
      errors.push('Badge level must be between 1 and 5')
    }

    const validCategories = ['skill', 'participation', 'contribution', 'leadership', 'learning', 'achievement', 'milestone']
    if (!validCategories.includes(metadata.category)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`)
    }

    if (!metadata.timestamp || metadata.timestamp <= 0) {
      errors.push('Timestamp must be a positive number')
    }

    if (!metadata.issuer || metadata.issuer.length === 0) {
      errors.push('Issuer address is required')
    }

    if (!metadata.recipient || metadata.recipient.length === 0) {
      errors.push('Recipient address is required')
    }

    if (metadata.issuer === metadata.recipient) {
      errors.push('Issuer and recipient cannot be the same address')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  },

  exportAsJSON(metadata: BadgeMetadata[]): string {
    const data = metadata.map(m => this.serialize(m))
    return JSON.stringify(data, null, 2)
  },

  exportAsCSV(metadata: BadgeMetadata[]): string {
    const headers = ['Level', 'Category', 'Timestamp', 'Issuer', 'Recipient', 'Template Name', 'Template Description', 'Community Name', 'Active']
    const rows = metadata.map(m => [
      m.level,
      m.category,
      m.timestamp,
      m.issuer,
      m.recipient,
      m.templateName || '',
      m.templateDescription || '',
      m.communityName || '',
      m.isActive ? 'Yes' : 'No'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return csv
  },

  importFromJSON(json: string): BadgeMetadata[] {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid JSON format. Expected array of badge metadata.')
    }
    return parsed.map(item => this.deserialize(item))
  },

  enrichMetadata(
    metadata: BadgeMetadata,
    additionalData: Record<string, unknown>
  ): BadgeMetadata {
    return {
      ...metadata,
      additionalData: {
        ...metadata.additionalData,
        ...additionalData
      }
    }
  },

  formatForDisplay(metadata: BadgeMetadata): {
    level: string
    category: string
    issuedAt: string
    issuer: string
    recipient: string
    status: string
  } {
    const date = new Date(metadata.timestamp * 1000).toLocaleDateString()
    const level = `Level ${metadata.level}`
    const category = metadata.category.charAt(0).toUpperCase() + metadata.category.slice(1)
    const status = metadata.isActive ? 'Active' : 'Revoked'

    return {
      level,
      category,
      issuedAt: date,
      issuer: metadata.issuer,
      recipient: metadata.recipient,
      status
    }
  }
}
