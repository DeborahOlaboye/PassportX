import { API_BASE_URL } from './config'

export interface BadgeVerification {
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

export interface VerificationResponse {
  success: boolean
  verification?: BadgeVerification
  error?: string
  message?: string
}

export interface PublicVerificationData {
  badgeId: string
  verified: boolean
  active: boolean
  templateName?: string
  communityName?: string
  level: number
  category: string
  issuedAt: string
  verifiedAt: string
}

/**
 * Verify a single badge
 */
export async function verifyBadge(
  badgeId: string,
  claimedOwner?: string
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/badge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ badgeId, claimedOwner })
    })

    return await response.json()
  } catch (error) {
    console.error('Error verifying badge:', error)
    return {
      success: false,
      error: 'Failed to verify badge'
    }
  }
}

/**
 * Get verification status for a badge
 */
export async function getBadgeVerificationStatus(
  badgeId: string
): Promise<VerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/badge/${badgeId}`)
    return await response.json()
  } catch (error) {
    console.error('Error getting verification status:', error)
    return {
      success: false,
      error: 'Failed to get verification status'
    }
  }
}

/**
 * Get public verification info (for sharing)
 */
export async function getPublicVerificationInfo(badgeId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/public/${badgeId}`)
    const data = await response.json()

    if (data.success) {
      return data.data as PublicVerificationData
    }

    return null
  } catch (error) {
    console.error('Error getting public verification info:', error)
    return null
  }
}

/**
 * Verify multiple badges in batch
 */
export async function verifyBadgeBatch(badgeIds: string[]) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ badgeIds })
    })

    const data = await response.json()

    if (data.success) {
      return data.verifications as BadgeVerification[]
    }

    return []
  } catch (error) {
    console.error('Error verifying badges in batch:', error)
    return []
  }
}

/**
 * Verify all badges for a user
 */
export async function verifyUserBadges(userAddress: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/user/${userAddress}`)
    const data = await response.json()

    if (data.success) {
      return data.verifications as BadgeVerification[]
    }

    return []
  } catch (error) {
    console.error('Error verifying user badges:', error)
    return []
  }
}

/**
 * Check if badge is verified on blockchain
 */
export async function checkBlockchainVerification(badgeId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify/blockchain/${badgeId}`)
    const data = await response.json()

    return data.success && data.verified
  } catch (error) {
    console.error('Error checking blockchain verification:', error)
    return false
  }
}

/**
 * Generate shareable verification URL
 */
export function getVerificationUrl(badgeId: string): string {
  return `${window.location.origin}/verify/${badgeId}`
}

/**
 * Copy verification URL to clipboard
 */
export async function copyVerificationUrl(badgeId: string): Promise<boolean> {
  try {
    const url = getVerificationUrl(badgeId)
    await navigator.clipboard.writeText(url)
    return true
  } catch (error) {
    console.error('Error copying verification URL:', error)
    return false
  }
}
