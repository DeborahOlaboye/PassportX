import Badge from '../models/Badge'
import BadgeTemplate from '../models/BadgeTemplate'
import Community from '../models/Community'
import User from '../models/User'

export const validateBadgeIssuance = async (
  templateId: string,
  recipientAddress: string,
  issuerAddress: string
) => {
  // Check if template exists and is active
  const template = await BadgeTemplate.findById(templateId).populate('community')
  if (!template || !template.isActive) {
    throw new Error('Badge template not found or inactive')
  }

  // Check if issuer is community admin
  const community = template.community as any
  if (community.admin !== issuerAddress) {
    throw new Error('Only community admin can issue badges')
  }

  // Check if recipient already has this badge
  const existingBadge = await Badge.findOne({
    templateId,
    owner: recipientAddress
  })

  if (existingBadge) {
    throw new Error('Badge already issued to this recipient')
  }

  return { template, community }
}

export const getBadgesByCategory = async (category: string, limit: number = 20) => {
  const badges = await Badge.find({ 'metadata.category': category })
    .populate('templateId')
    .populate('community')
    .sort({ issuedAt: -1 })
    .limit(limit)

  return badges.map(badge => ({
    id: badge._id,
    name: (badge.templateId as any).name,
    description: (badge.templateId as any).description,
    community: (badge.community as any).name,
    owner: badge.owner,
    level: badge.metadata.level,
    icon: (badge.templateId as any).icon,
    issuedAt: badge.issuedAt
  }))
}

export const getBadgesByLevel = async (level: number, limit: number = 20) => {
  const badges = await Badge.find({ 'metadata.level': level })
    .populate('templateId')
    .populate('community')
    .sort({ issuedAt: -1 })
    .limit(limit)

  return badges.map(badge => ({
    id: badge._id,
    name: (badge.templateId as any).name,
    description: (badge.templateId as any).description,
    community: (badge.community as any).name,
    owner: badge.owner,
    category: badge.metadata.category,
    icon: (badge.templateId as any).icon,
    issuedAt: badge.issuedAt
  }))
}

export const getRecentBadges = async (limit: number = 20) => {
  const badges = await Badge.find()
    .populate('templateId')
    .populate('community')
    .sort({ issuedAt: -1 })
    .limit(limit)

  return Promise.all(
    badges.map(async (badge) => {
      const user = await User.findOne({ stacksAddress: badge.owner })
      
      return {
        id: badge._id,
        name: (badge.templateId as any).name,
        description: (badge.templateId as any).description,
        community: (badge.community as any).name,
        owner: badge.owner,
        ownerName: user?.name || 'Anonymous',
        level: badge.metadata.level,
        category: badge.metadata.category,
        icon: (badge.templateId as any).icon,
        issuedAt: badge.issuedAt
      }
    })
  )
}

export const getBadgeStatistics = async () => {
  const totalBadges = await Badge.countDocuments()
  const totalTemplates = await BadgeTemplate.countDocuments({ isActive: true })
  const totalCommunities = await Community.countDocuments({ isActive: true })

  const categoryStats = await Badge.aggregate([
    { $group: { _id: '$metadata.category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])

  const levelStats = await Badge.aggregate([
    { $group: { _id: '$metadata.level', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])

  const monthlyStats = await Badge.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$issuedAt' },
          month: { $month: '$issuedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ])

  return {
    totalBadges,
    totalTemplates,
    totalCommunities,
    categoryBreakdown: categoryStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {} as Record<string, number>),
    levelBreakdown: levelStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {} as Record<number, number>),
    monthlyIssuance: monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count
    }))
  }
}