import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'
import Community from '../models/Community'
import User from '../models/User'

export const getPublicPassports = async (limit = 10, skip = 0) => {
  const users = await User.find({ isPublic: true })
    .sort({ lastActive: -1 })
    .limit(limit)
    .skip(skip)

  const passports = await Promise.all(
    users.map(async (user) => {
      const badges = await Badge.find({ owner: user.stacksAddress })
        .populate('templateId')
        .populate('community')
        .sort({ issuedAt: -1 })
        .limit(1)

      const totalBadges = await Badge.countDocuments({ owner: user.stacksAddress })
      const communities = await Badge.distinct('community', { owner: user.stacksAddress })

      return {
        userId: user.stacksAddress,
        name: user.name || 'Anonymous User',
        badgeCount: totalBadges,
        communities: communities.length,
        recentBadge: badges[0] ? (badges[0].templateId as any).name : null,
        avatar: user.avatar,
        joinDate: user.joinDate
      }
    })
  )

  return passports.filter(passport => passport.badgeCount > 0)
}

export const searchPassports = async (query: string, limit = 10) => {
  const users = await User.find({
    isPublic: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } }
    ]
  }).limit(limit)

  return Promise.all(
    users.map(async (user) => {
      const badgeCount = await Badge.countDocuments({ owner: user.stacksAddress })
      const communities = await Badge.distinct('community', { owner: user.stacksAddress })

      return {
        userId: user.stacksAddress,
        name: user.name || 'Anonymous User',
        badgeCount,
        communities: communities.length,
        avatar: user.avatar
      }
    })
  )
}

export const getPassportAnalytics = async (stacksAddress: string) => {
  const badges = await Badge.find({ owner: stacksAddress })
    .populate('templateId')
    .populate('community')

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

  const communityStats = badges.reduce((acc, badge) => {
    const communityName = (badge.community as any).name
    acc[communityName] = (acc[communityName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalBadges: badges.length,
    categoryBreakdown: categoryStats,
    levelBreakdown: levelStats,
    communityBreakdown: communityStats,
    recentActivity: badges
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .slice(0, 5)
      .map(badge => ({
        badgeName: (badge.templateId as any).name,
        community: (badge.community as any).name,
        issuedAt: badge.issuedAt
      }))
  }
}