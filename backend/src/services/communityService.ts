import Community from '../models/Community'
import BadgeTemplate from '../models/BadgeTemplate'
import Badge from '../models/Badge'
import User from '../models/User'

export const updateMemberCount = async (communityId: string) => {
  try {
    const uniqueMembers = await Badge.distinct('owner', { community: communityId })
    await Community.findByIdAndUpdate(communityId, { 
      memberCount: uniqueMembers.length 
    })
  } catch (error) {
    console.error('Error updating member count:', error)
  }
}

export const getCommunityLeaderboard = async (communityId: string, limit: number = 10) => {
  const pipeline = [
    { $match: { community: communityId } },
    { $group: { 
      _id: '$owner', 
      badgeCount: { $sum: 1 },
      highestLevel: { $max: '$metadata.level' },
      latestBadge: { $max: '$issuedAt' }
    }},
    { $sort: { badgeCount: -1, highestLevel: -1, latestBadge: -1 } },
    { $limit: limit }
  ]

  const leaderboard = await Badge.aggregate(pipeline)

  return Promise.all(
    leaderboard.map(async (entry) => {
      const user = await User.findOne({ stacksAddress: entry._id })
      return {
        stacksAddress: entry._id,
        name: user?.name || 'Anonymous',
        avatar: user?.avatar,
        badgeCount: entry.badgeCount,
        highestLevel: entry.highestLevel,
        latestBadge: entry.latestBadge
      }
    })
  )
}

export const getCommunityAnalytics = async (communityId: string) => {
  const community = await Community.findById(communityId)
  if (!community) throw new Error('Community not found')

  const badges = await Badge.find({ community: communityId })
  const templates = await BadgeTemplate.find({ community: communityId, isActive: true })

  const badgesByCategory = badges.reduce((acc, badge) => {
    const category = badge.metadata.category
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const badgesByLevel = badges.reduce((acc, badge) => {
    const level = badge.metadata.level
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const monthlyIssuance = badges.reduce((acc, badge) => {
    const month = badge.issuedAt.toISOString().slice(0, 7) // YYYY-MM
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalMembers: community.memberCount,
    totalBadgeTemplates: templates.length,
    totalIssuedBadges: badges.length,
    badgesByCategory,
    badgesByLevel,
    monthlyIssuance,
    averageBadgesPerMember: community.memberCount > 0 ? badges.length / community.memberCount : 0
  }
}

export const getTrendingCommunities = async (limit: number = 10) => {
  const communities = await Community.find({ isActive: true })
    .sort({ memberCount: -1, createdAt: -1 })
    .limit(limit)

  return communities.map(community => ({
    id: community._id,
    name: community.name,
    description: community.description,
    memberCount: community.memberCount,
    badgeCount: community.badgeTemplates.length,
    theme: community.theme
  }))
}