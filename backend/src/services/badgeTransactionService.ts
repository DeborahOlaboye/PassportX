import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'
import Community from '../models/Community'
import User from '../models/User'

export interface BadgeIssuancePayload {
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

export interface BadgeRevocationPayload {
  badgeId: string
  issuerAddress: string
  reason?: string
}

export const registerBadgeIssuance = async (
  payload: BadgeIssuancePayload
) => {
  try {
    const template = await BadgeTemplate.findById(payload.templateId).populate('community')
    if (!template || !template.isActive) {
      throw new Error('Badge template not found or inactive')
    }

    const community = template.community as any
    if (!community.admins.includes(payload.issuerAddress)) {
      throw new Error('Only community admin can issue badges')
    }

    const existingBadge = await Badge.findOne({
      templateId: payload.templateId,
      owner: payload.recipientAddress
    })

    if (existingBadge) {
      throw new Error('This recipient already has this badge')
    }

    let recipient = await User.findOne({ stacksAddress: payload.recipientAddress })
    if (!recipient) {
      recipient = await User.create({
        stacksAddress: payload.recipientAddress,
        name: payload.recipientName || 'Anonymous',
        email: payload.recipientEmail,
        joinDate: new Date(payload.createdAt)
      })
    } else if (payload.recipientEmail && !recipient.email) {
      recipient = await User.findOneAndUpdate(
        { stacksAddress: payload.recipientAddress },
        { email: payload.recipientEmail },
        { new: true }
      )
    }

    const badgeData = {
      templateId: payload.templateId,
      owner: payload.recipientAddress,
      issuer: payload.issuerAddress,
      community: community._id,
      transactionId: payload.txId,
      issuedAt: new Date(payload.createdAt),
      metadata: {
        level: (template as any).level,
        category: (template as any).category,
        timestamp: Math.floor(new Date(payload.createdAt).getTime() / 1000)
      }
    }

    const badge = new Badge(badgeData)
    await badge.save()

    await User.findOneAndUpdate(
      { stacksAddress: payload.recipientAddress },
      {
        $addToSet: { badges: badge._id },
        $push: { badgeActivity: { badgeId: badge._id, action: 'received', date: new Date() } }
      },
      { new: true }
    )

    const issuer = await User.findOne({ stacksAddress: payload.issuerAddress })
    if (issuer) {
      await User.findOneAndUpdate(
        { stacksAddress: payload.issuerAddress },
        {
          $push: { badgeActivity: { badgeId: badge._id, action: 'issued', date: new Date() } }
        },
        { new: true }
      )
    }

    await Community.findByIdAndUpdate(
      community._id,
      {
        $addToSet: { issuedBadges: badge._id },
        $inc: { badgeCount: 1 }
      },
      { new: true }
    )

    return {
      id: badge._id,
      txId: payload.txId,
      recipient: payload.recipientAddress,
      template: (template as any).name,
      status: 'issued',
      issuedAt: badge.issuedAt
    }
  } catch (error) {
    throw error
  }
}

export const revokeBadge = async (payload: BadgeRevocationPayload) => {
  try {
    const badge = await Badge.findById(payload.badgeId).populate('templateId').populate('community')

    if (!badge) {
      throw new Error('Badge not found')
    }

    const community = badge.community as any
    if (!community.admins.includes(payload.issuerAddress) && badge.issuer !== payload.issuerAddress) {
      throw new Error('Only badge issuer or community admin can revoke badges')
    }

    if (!badge.metadata) {
      badge.metadata = { level: 1, category: 'achievement', timestamp: 0 }
    }

    const revokedBadgeData = {
      ...badge.toObject(),
      metadata: {
        ...badge.metadata,
        active: false,
        revokedAt: Math.floor(Date.now() / 1000),
        revocationReason: payload.reason
      }
    }

    badge.metadata = revokedBadgeData.metadata
    await badge.save()

    await User.findOneAndUpdate(
      { stacksAddress: badge.owner },
      {
        $pull: { badges: badge._id },
        $push: { badgeActivity: { badgeId: badge._id, action: 'revoked', date: new Date(), reason: payload.reason } }
      },
      { new: true }
    )

    return {
      id: badge._id,
      recipient: badge.owner,
      status: 'revoked',
      reason: payload.reason
    }
  } catch (error) {
    throw error
  }
}

export const getBadgesIssuedByUser = async (issuerAddress: string) => {
  const badges = await Badge.find({ issuer: issuerAddress })
    .populate('templateId')
    .populate('community')
    .sort({ issuedAt: -1 })

  return badges.map(badge => ({
    id: badge._id,
    recipient: badge.owner,
    template: (badge.templateId as any).name,
    community: (badge.community as any).name,
    level: badge.metadata.level,
    category: badge.metadata.category,
    issuedAt: badge.issuedAt,
    transactionId: badge.transactionId
  }))
}

export const getBadgesReceivedByUser = async (recipientAddress: string) => {
  const badges = await Badge.find({ owner: recipientAddress })
    .populate('templateId')
    .populate('community')
    .populate('issuer', 'stacksAddress')
    .sort({ issuedAt: -1 })

  return badges.map(badge => ({
    id: badge._id,
    template: (badge.templateId as any).name,
    community: (badge.community as any).name,
    issuer: badge.issuer,
    level: badge.metadata.level,
    category: badge.metadata.category,
    issuedAt: badge.issuedAt,
    transactionId: badge.transactionId
  }))
}

export const getCommunitybadgeStatistics = async (communityId: string) => {
  const badges = await Badge.find({ community: communityId })
    .populate('templateId')
    .populate('community')

  const totalIssued = badges.length
  const uniqueRecipients = new Set(badges.map(b => b.owner)).size

  const categoryStats = badges.reduce((acc, badge) => {
    const category = badge.metadata.category
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const levelStats = badges.reduce((acc, badge) => {
    const level = badge.metadata.level
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const recentBadges = badges.slice(0, 10).map(badge => ({
    id: badge._id,
    recipient: badge.owner,
    template: (badge.templateId as any).name,
    level: badge.metadata.level,
    issuedAt: badge.issuedAt
  }))

  return {
    totalIssued,
    uniqueRecipients,
    categoryBreakdown: categoryStats,
    levelBreakdown: levelStats,
    recentBadges
  }
}

export const validateBadgeTransaction = async (
  txId: string,
  recipientAddress: string,
  templateId: number
): Promise<boolean> => {
  const existingBadge = await Badge.findOne({
    transactionId: txId,
    owner: recipientAddress,
    templateId
  })

  return !existingBadge
}

export const updateBadgeMetadata = async (
  badgeId: string,
  metadata: Record<string, unknown>
) => {
  try {
    const badge = await Badge.findByIdAndUpdate(
      badgeId,
      { $set: { metadata } },
      { new: true }
    )

    if (!badge) {
      throw new Error('Badge not found')
    }

    return badge
  } catch (error) {
    throw error
  }
}
