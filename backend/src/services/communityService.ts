import { Types } from 'mongoose'
import Community, { ICommunity } from '../models/Community'
import BadgeTemplate from '../models/BadgeTemplate'
import Badge from '../models/Badge'
import User from '../models/User'
import { ICommunity as ICommunityType, ICommunitySettings, ICommunityTheme, ISocialLinks } from '../types'

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Helper to validate community admin
const isCommunityAdmin = (community: ICommunity, userAddress: string): boolean => {
  return community.admins.some(admin => admin === userAddress)
}

// Community CRUD Operations
export const createCommunity = async (data: {
  name: string
  description: string
  admin: string
  theme?: Partial<ICommunityTheme>
  settings?: Partial<ICommunitySettings>
  socialLinks?: ISocialLinks
  website?: string
  about?: string
  tags?: string[]
}) => {
  try {
    const slug = generateSlug(data.name)
    
    // Check if community with this slug already exists
    const existingCommunity = await Community.findOne({ slug })
    if (existingCommunity) {
      throw new Error('A community with this name already exists')
    }

    const communityData: Partial<ICommunityType> = {
      ...data,
      slug,
      admins: [data.admin],
      theme: {
        primaryColor: data.theme?.primaryColor || '#3b82f6',
        secondaryColor: data.theme?.secondaryColor || '#10b981',
        backgroundColor: data.theme?.backgroundColor || '#ffffff',
        textColor: data.theme?.textColor || '#1f2937',
        borderRadius: data.theme?.borderRadius || '0.5rem',
        ...data.theme
      },
      settings: {
        allowMemberInvites: data.settings?.allowMemberInvites ?? true,
        requireApproval: data.settings?.requireApproval ?? false,
        allowBadgeIssuance: data.settings?.allowBadgeIssuance ?? true,
        allowCustomBadges: data.settings?.allowCustomBadges ?? false
      },
      socialLinks: data.socialLinks || {},
      tags: data.tags || [],
      memberCount: 0,
      isPublic: true,
      isActive: true
    }

    const community = new Community(communityData)
    await community.save()
    
    // Add community to user's admin communities
    await User.findOneAndUpdate(
      { stacksAddress: data.admin },
      { $addToSet: { adminCommunities: community._id } },
      { upsert: true, new: true }
    )

    return community
  } catch (error) {
    console.error('Error creating community:', error)
    throw error
  }
}

export const updateCommunity = async (
  communityId: string,
  updates: Partial<ICommunityType>,
  userAddress: string
) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Only admins can update the community
    if (!isCommunityAdmin(community, userAddress)) {
      throw new Error('Unauthorized: Only community admins can update this community')
    }

    // Handle slug update separately if name is being updated
    if (updates.name && updates.name !== community.name) {
      updates.slug = generateSlug(updates.name)
      
      // Check if new slug is already taken
      const existingSlug = await Community.findOne({ slug: updates.slug, _id: { $ne: communityId } })
      if (existingSlug) {
        throw new Error('A community with this name already exists')
      }
    }

    // Update theme and settings without overriding entire objects
    if (updates.theme) {
      updates.theme = { ...community.theme.toObject(), ...updates.theme }
    }
    
    if (updates.settings) {
      updates.settings = { ...community.settings.toObject(), ...updates.settings }
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $set: updates },
      { new: true, runValidators: true }
    )

    return updatedCommunity
  } catch (error) {
    console.error('Error updating community:', error)
    throw error
  }
}

export const getCommunityBySlug = async (slug: string) => {
  try {
    return await Community.findOne({ slug, isActive: true })
      .populate('badgeTemplates', 'name description icon category level')
  } catch (error) {
    console.error('Error fetching community by slug:', error)
    throw error
  }
}

export const getCommunityById = async (id: string) => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid community ID')
    }
    return await Community.findById(id)
      .populate('badgeTemplates', 'name description icon category level')
  } catch (error) {
    console.error('Error fetching community by ID:', error)
    throw error
  }
}

export const listCommunities = async (filters: {
  search?: string
  tags?: string[]
  admin?: string
  isPublic?: boolean
  limit?: number
  offset?: number
}) => {
  try {
    const { search, tags, admin, isPublic, limit = 10, offset = 0 } = filters
    
    const query: any = { isActive: true }
    
    if (search) {
      query.$text = { $search: search }
    }
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags.map(tag => tag.toLowerCase()) }
    }
    
    if (admin) {
      query.admins = admin
    }
    
    if (isPublic !== undefined) {
      query.isPublic = isPublic
    }
    
    const [communities, total] = await Promise.all([
      Community.find(query)
        .sort({ memberCount: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('name description slug theme memberCount badgeTemplates isPublic tags')
        .lean(),
      Community.countDocuments(query)
    ])
    
    return {
      data: communities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + communities.length < total
      }
    }
  } catch (error) {
    console.error('Error listing communities:', error)
    throw error
  }
}

export const deleteCommunity = async (communityId: string, userAddress: string) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Only admins can delete the community
    if (!isCommunityAdmin(community, userAddress)) {
      throw new Error('Unauthorized: Only community admins can delete this community')
    }

    // Soft delete by marking as inactive
    await Community.findByIdAndUpdate(communityId, { isActive: false })
    
    // TODO: Consider adding cleanup of related resources in a background job
    
    return { success: true, message: 'Community deleted successfully' }
  } catch (error) {
    console.error('Error deleting community:', error)
    throw error
  }
}

// Community Member Management
export const addCommunityMember = async (communityId: string, userAddress: string) => {
  try {
    // This is a simplified version - in a real app, you might need to check invites, approvals, etc.
    const user = await User.findOne({ stacksAddress: userAddress })
    if (!user) {
      throw new Error('User not found')
    }

    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Add community to user's communities if not already a member
    if (!user.communities.includes(communityId)) {
      user.communities.push(communityId)
      await user.save()
      
      // Increment member count
      community.memberCount += 1
      await community.save()
    }

    return { success: true, message: 'Successfully joined community' }
  } catch (error) {
    console.error('Error adding community member:', error)
    throw error
  }
}

export const removeCommunityMember = async (communityId: string, userAddress: string, adminAddress: string) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Only admins can remove members (or users can leave themselves)
    const isAdmin = isCommunityAdmin(community, adminAddress)
    const isSelfRemoval = userAddress === adminAddress
    
    if (!isAdmin && !isSelfRemoval) {
      throw new Error('Unauthorized: Only community admins can remove members')
    }

    // Can't remove the last admin
    if (isAdmin && community.admins.length === 1 && community.admins[0] === userAddress) {
      throw new Error('Cannot remove the last admin of the community')
    }

    // Remove from community admins if they are one
    if (community.admins.includes(userAddress)) {
      community.admins = community.admins.filter(admin => admin !== userAddress)
      await community.save()
    }

    // Remove from user's communities
    await User.findOneAndUpdate(
      { stacksAddress: userAddress },
      { $pull: { communities: communityId } }
    )

    // Decrement member count
    community.memberCount = Math.max(0, community.memberCount - 1)
    await community.save()

    return { success: true, message: 'Successfully removed member from community' }
  } catch (error) {
    console.error('Error removing community member:', error)
    throw error
  }
}

// Community Admin Management
export const addCommunityAdmin = async (communityId: string, adminAddress: string, currentAdmin: string) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Only existing admins can add new admins
    if (!isCommunityAdmin(community, currentAdmin)) {
      throw new Error('Unauthorized: Only community admins can add new admins')
    }

    // Check if user is already an admin
    if (community.admins.includes(adminAddress)) {
      return { success: true, message: 'User is already an admin' }
    }

    // Add to admins array
    community.admins.push(adminAddress)
    await community.save()

    // Add community to user's admin communities
    await User.findOneAndUpdate(
      { stacksAddress: adminAddress },
      { $addToSet: { adminCommunities: communityId } },
      { upsert: true, new: true }
    )

    return { success: true, message: 'Successfully added admin to community' }
  } catch (error) {
    console.error('Error adding community admin:', error)
    throw error
  }
}

export const removeCommunityAdmin = async (communityId: string, adminAddress: string, currentAdmin: string) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    // Only admins can remove admins
    if (!isCommunityAdmin(community, currentAdmin)) {
      throw new Error('Unauthorized: Only community admins can remove admins')
    }

    // Can't remove yourself as admin if you're the last one
    if (community.admins.length === 1 && community.admins[0] === adminAddress) {
      throw new Error('Cannot remove the last admin of the community')
    }

    // Remove from admins array
    community.admins = community.admins.filter(admin => admin !== adminAddress)
    await community.save()

    // Remove community from user's admin communities
    await User.findOneAndUpdate(
      { stacksAddress: adminAddress },
      { $pull: { adminCommunities: communityId } }
    )

    return { success: true, message: 'Successfully removed admin from community' }
  } catch (error) {
    console.error('Error removing community admin:', error)
    throw error
  }
}

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