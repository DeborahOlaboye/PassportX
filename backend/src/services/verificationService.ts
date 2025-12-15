import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'
import Community from '../models/Community'
import { IBadgeVerification } from '../types'

export class VerificationService {
  /**
   * Verify badge authenticity and ownership
   */
  async verifyBadge(badgeId: string, claimedOwner?: string): Promise<IBadgeVerification | null> {
    try {
      const badge = await Badge.findById(badgeId)
        .populate('templateId')
        .populate('community')
        .lean()

      if (!badge) {
        return null
      }

      const template = badge.templateId as any
      const community = badge.community as any

      // Check ownership if claimed owner is provided
      const ownershipVerified = claimedOwner
        ? badge.owner.toLowerCase() === claimedOwner.toLowerCase()
        : true

      const verification: IBadgeVerification = {
        badgeId: badge._id.toString(),
        verified: ownershipVerified && !!badge.tokenId && !!badge.transactionId,
        active: badge.metadata?.timestamp ? true : false,
        owner: badge.owner,
        issuer: badge.issuer,
        level: badge.metadata.level,
        category: badge.metadata.category,
        timestamp: badge.metadata.timestamp,
        templateName: template?.name,
        templateDescription: template?.description,
        communityName: community?.name,
        verifiedAt: new Date()
      }

      return verification
    } catch (error) {
      console.error('Error verifying badge:', error)
      return null
    }
  }

  /**
   * Verify multiple badges in batch
   */
  async verifyBadgeBatch(badgeIds: string[]): Promise<IBadgeVerification[]> {
    const verifications = await Promise.all(
      badgeIds.map(id => this.verifyBadge(id))
    )

    return verifications.filter((v): v is IBadgeVerification => v !== null)
  }

  /**
   * Get verification status for all user badges
   */
  async verifyUserBadges(ownerAddress: string): Promise<IBadgeVerification[]> {
    try {
      const badges = await Badge.find({ owner: ownerAddress })
        .populate('templateId')
        .populate('community')
        .lean()

      const verifications = await Promise.all(
        badges.map(badge => this.verifyBadge(badge._id.toString(), ownerAddress))
      )

      return verifications.filter((v): v is IBadgeVerification => v !== null)
    } catch (error) {
      console.error('Error verifying user badges:', error)
      return []
    }
  }

  /**
   * Check if badge is on blockchain
   */
  async checkBlockchainVerification(badgeId: string): Promise<boolean> {
    try {
      const badge = await Badge.findById(badgeId).lean()

      if (!badge) {
        return false
      }

      // Badge is verified on blockchain if it has both tokenId and transactionId
      return !!(badge.tokenId && badge.transactionId)
    } catch (error) {
      console.error('Error checking blockchain verification:', error)
      return false
    }
  }

  /**
   * Validate badge has not been revoked
   */
  async checkBadgeNotRevoked(badgeId: string): Promise<boolean> {
    try {
      const badge = await Badge.findById(badgeId).lean()

      if (!badge) {
        return false
      }

      // Check if badge metadata indicates it's still active
      return badge.metadata?.timestamp > 0
    } catch (error) {
      console.error('Error checking badge revocation:', error)
      return false
    }
  }

  /**
   * Get public verification info (for sharing)
   */
  async getPublicVerificationInfo(badgeId: string) {
    try {
      const verification = await this.verifyBadge(badgeId)

      if (!verification) {
        return null
      }

      // Return only public information
      return {
        badgeId: verification.badgeId,
        verified: verification.verified,
        active: verification.active,
        templateName: verification.templateName,
        communityName: verification.communityName,
        level: verification.level,
        category: verification.category,
        issuedAt: new Date(verification.timestamp * 1000),
        verifiedAt: verification.verifiedAt
      }
    } catch (error) {
      console.error('Error getting public verification info:', error)
      return null
    }
  }
}

export default new VerificationService()
