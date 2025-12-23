import Community from '../models/Community'
import User from '../models/User'
import { ICommunity } from '../types'

export interface CommunityTransactionPayload {
  txId: string
  name: string
  description: string
  about?: string
  website?: string
  owner: string
  stxPayment: number
  theme: {
    primaryColor: string
    secondaryColor: string
  }
  settings: {
    allowMemberInvites: boolean
    requireApproval: boolean
    allowBadgeIssuance: boolean
    allowCustomBadges: boolean
  }
  tags?: string[]
  network: 'testnet' | 'mainnet'
  createdAt: string
}

export interface CommunityApprovalRequest {
  communityId: string
  approverAddress: string
  approved: boolean
  reason?: string
}

export const registerCommunityFromTransaction = async (
  payload: CommunityTransactionPayload
) => {
  try {
    const slug = generateSlug(payload.name)

    const existingCommunity = await Community.findOne({ slug })
    if (existingCommunity) {
      throw new Error('A community with this name already exists')
    }

    const userExists = await User.findOne({ stacksAddress: payload.owner })
    if (!userExists) {
      await User.create({
        stacksAddress: payload.owner,
        name: payload.name,
        joinDate: new Date(payload.createdAt)
      })
    }

    const communityData: Partial<ICommunity> = {
      name: payload.name,
      slug,
      description: payload.description,
      about: payload.about,
      website: payload.website,
      admins: [payload.owner],
      theme: {
        primaryColor: payload.theme.primaryColor,
        secondaryColor: payload.theme.secondaryColor,
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: '0.5rem'
      },
      settings: {
        allowMemberInvites: payload.settings.allowMemberInvites,
        requireApproval: payload.settings.requireApproval,
        allowBadgeIssuance: payload.settings.allowBadgeIssuance,
        allowCustomBadges: payload.settings.allowCustomBadges
      },
      tags: payload.tags || [],
      memberCount: 1,
      isPublic: true,
      isActive: true,
      metadata: {
        transactionId: payload.txId,
        network: payload.network,
        stxPayment: payload.stxPayment,
        blockchainVerified: true,
        approvalStatus: 'pending'
      }
    }

    const community = new Community(communityData)
    await community.save()

    await User.findOneAndUpdate(
      { stacksAddress: payload.owner },
      { 
        $addToSet: { 
          adminCommunities: community._id,
          communities: community._id
        } 
      },
      { new: true }
    )

    return {
      success: true,
      community: community.toObject(),
      message: 'Community registered successfully from blockchain transaction'
    }
  } catch (error) {
    console.error('Error registering community from transaction:', error)
    throw error
  }
}

export const requestCommunityApproval = async (
  communityId: string,
  requesterAddress: string
) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    if (!community.admins.includes(requesterAddress)) {
      throw new Error('Only community admins can request approval')
    }

    if (community.metadata?.approvalStatus === 'approved') {
      return {
        success: true,
        message: 'Community is already approved',
        approved: true
      }
    }

    await Community.findByIdAndUpdate(
      communityId,
      {
        $set: {
          'metadata.approvalStatus': 'under_review',
          'metadata.approvalRequestedAt': new Date()
        }
      },
      { new: true }
    )

    return {
      success: true,
      message: 'Approval request submitted',
      approvalStatus: 'under_review'
    }
  } catch (error) {
    console.error('Error requesting community approval:', error)
    throw error
  }
}

export const approveCommunity = async (
  communityId: string,
  approverAddress: string
) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    if (!isApprover(approverAddress)) {
      throw new Error('Unauthorized: Only authorized approvers can approve communities')
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      {
        $set: {
          'metadata.approvalStatus': 'approved',
          'metadata.approvedAt': new Date(),
          'metadata.approvedBy': approverAddress,
          isActive: true
        }
      },
      { new: true }
    )

    return {
      success: true,
      message: 'Community approved successfully',
      community: updatedCommunity?.toObject(),
      approvalStatus: 'approved'
    }
  } catch (error) {
    console.error('Error approving community:', error)
    throw error
  }
}

export const rejectCommunity = async (
  communityId: string,
  approverAddress: string,
  reason: string
) => {
  try {
    const community = await Community.findById(communityId)
    if (!community) {
      throw new Error('Community not found')
    }

    if (!isApprover(approverAddress)) {
      throw new Error('Unauthorized: Only authorized approvers can reject communities')
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      {
        $set: {
          'metadata.approvalStatus': 'rejected',
          'metadata.rejectedAt': new Date(),
          'metadata.rejectionReason': reason,
          'metadata.rejectedBy': approverAddress,
          isActive: false
        }
      },
      { new: true }
    )

    return {
      success: true,
      message: 'Community rejected',
      community: updatedCommunity?.toObject(),
      approvalStatus: 'rejected',
      reason
    }
  } catch (error) {
    console.error('Error rejecting community:', error)
    throw error
  }
}

export const getCommunityApprovalStatus = async (communityId: string) => {
  try {
    const community = await Community.findById(communityId).select('metadata name admins')
    if (!community) {
      throw new Error('Community not found')
    }

    return {
      communityId: community._id,
      communityName: community.name,
      status: community.metadata?.approvalStatus || 'pending',
      requestedAt: community.metadata?.approvalRequestedAt,
      approvedAt: community.metadata?.approvedAt,
      approvedBy: community.metadata?.approvedBy,
      rejectedAt: community.metadata?.rejectedAt,
      rejectionReason: community.metadata?.rejectionReason,
      admins: community.admins
    }
  } catch (error) {
    console.error('Error fetching approval status:', error)
    throw error
  }
}

export const getPendingCommunities = async (limit: number = 20, offset: number = 0) => {
  try {
    const [communities, total] = await Promise.all([
      Community.find({ 'metadata.approvalStatus': 'pending' })
        .select('name description admins theme memberCount createdAt metadata')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Community.countDocuments({ 'metadata.approvalStatus': 'pending' })
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
    console.error('Error fetching pending communities:', error)
    throw error
  }
}

export const getUnderReviewCommunities = async (limit: number = 20, offset: number = 0) => {
  try {
    const [communities, total] = await Promise.all([
      Community.find({ 'metadata.approvalStatus': 'under_review' })
        .select('name description admins theme memberCount createdAt metadata')
        .sort({ 'metadata.approvalRequestedAt': -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Community.countDocuments({ 'metadata.approvalStatus': 'under_review' })
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
    console.error('Error fetching under review communities:', error)
    throw error
  }
}

export const validateTransactionSignature = async (
  txId: string,
  network: 'testnet' | 'mainnet'
): Promise<boolean> => {
  try {
    const baseUrl = network === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so'

    const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`)
    
    if (!response.ok) {
      console.error('Failed to fetch transaction:', response.statusText)
      return false
    }

    const data = await response.json()
    return data.tx_status === 'success'
  } catch (error) {
    console.error('Error validating transaction signature:', error)
    return false
  }
}

export const getCommunityByTransactionId = async (txId: string) => {
  try {
    return await Community.findOne({ 'metadata.transactionId': txId })
  } catch (error) {
    console.error('Error fetching community by transaction ID:', error)
    throw error
  }
}

export const updateCommunityApprovalWorkflow = async (
  communityId: string,
  updates: {
    status?: 'pending' | 'under_review' | 'approved' | 'rejected'
    approvedBy?: string
    rejectionReason?: string
  }
) => {
  try {
    const updateData: any = {}

    if (updates.status) {
      updateData['metadata.approvalStatus'] = updates.status
      
      if (updates.status === 'approved' && !updates.approvedBy) {
        throw new Error('approvedBy is required when approving')
      }
      
      if (updates.status === 'rejected' && !updates.rejectionReason) {
        throw new Error('rejectionReason is required when rejecting')
      }
    }

    if (updates.approvedBy) {
      updateData['metadata.approvedBy'] = updates.approvedBy
      updateData['metadata.approvedAt'] = new Date()
    }

    if (updates.rejectionReason) {
      updateData['metadata.rejectionReason'] = updates.rejectionReason
      updateData['metadata.rejectedAt'] = new Date()
    }

    const community = await Community.findByIdAndUpdate(
      communityId,
      { $set: updateData },
      { new: true }
    )

    if (!community) {
      throw new Error('Community not found')
    }

    return community
  } catch (error) {
    console.error('Error updating community approval workflow:', error)
    throw error
  }
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 64)
}

const isApprover = (address: string): boolean => {
  const approvers = (process.env.COMMUNITY_APPROVERS || '')
    .split(',')
    .map(a => a.trim())
    .filter(a => a.length > 0)

  return approvers.includes(address) || process.env.NODE_ENV === 'development'
}
