// API utility functions for PassportX

export interface Badge {
  id: number
  name: string
  description: string
  community: string
  level: number
  category: string
  timestamp: number
  icon?: string
  owner?: string
}

export interface Community {
  id: string
  name: string
  description: string
  memberCount: number
  badgeCount: number
  theme: {
    primaryColor: string
    logo?: string
  }
  admin: string
}

export interface User {
  address: string
  name?: string
  bio?: string
  joinDate: string
  badges: Badge[]
}

// Mock API functions - replace with actual blockchain calls
export const api = {
  // User functions
  async getUserBadges(address: string): Promise<Badge[]> {
    // In real implementation, query blockchain for user's badges
    return []
  },

  async getUserProfile(address: string): Promise<User | null> {
    // In real implementation, fetch user profile from blockchain/IPFS
    return null
  },

  // Badge functions
  async createBadgeTemplate(badgeData: Omit<Badge, 'id' | 'timestamp'>): Promise<Badge> {
    // In real implementation, call smart contract to create badge template
    const newBadge: Badge = {
      ...badgeData,
      id: Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
    }
    return newBadge
  },

  async issueBadge(badgeId: number, recipientAddress: string): Promise<boolean> {
    // In real implementation, call smart contract to mint badge NFT
    return true
  },

  // Community functions
  async getCommunities(adminAddress?: string): Promise<Community[]> {
    // In real implementation, query blockchain for communities
    return []
  },

  async createCommunity(communityData: Omit<Community, 'memberCount' | 'badgeCount'>): Promise<Community> {
    // In real implementation, call smart contract to create community
    const newCommunity: Community = {
      ...communityData,
      memberCount: 0,
      badgeCount: 0,
    }
    return newCommunity
  },

  // Utility functions
  async validateAddress(address: string): Promise<boolean> {
    // Validate Stacks address format
    return address.startsWith('ST') || address.startsWith('SP')
  },
}

// Error handling
export class APIError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'APIError'
  }
}

// Response wrapper
export interface APIResponse<T> {
  data?: T
  error?: string
  success: boolean
}