import { Request, Response } from 'express'
import * as communityService from '../services/communityService'
import { ICommunity } from '../models/Community'
import { Types } from 'mongoose'

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error)
  const status = error.status || 500
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error'
  })
}

// Create a new community
export const createCommunity = async (req: Request, res: Response) => {
  try {
    const { name, description, theme, settings, socialLinks, website, about, tags } = req.body
    const admin = req.user?.stacksAddress

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const community = await communityService.createCommunity({
      name,
      description,
      admin,
      theme,
      settings,
      socialLinks,
      website,
      about,
      tags
    })

    res.status(201).json({
      success: true,
      data: community
    })
  } catch (error) {
    handleError(res, error, 'Error creating community:')
  }
}

// Get community by ID or slug
export const getCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    let community

    if (Types.ObjectId.isValid(id)) {
      community = await communityService.getCommunityById(id)
    } else {
      community = await communityService.getCommunityBySlug(id)
    }

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      })
    }

    res.json({
      success: true,
      data: community
    })
  } catch (error) {
    handleError(res, error, 'Error fetching community:')
  }
}

// Update community
export const updateCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body
    const userAddress = req.user?.stacksAddress

    if (!userAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const updatedCommunity = await communityService.updateCommunity(id, updates, userAddress)
    
    if (!updatedCommunity) {
      return res.status(404).json({
        success: false,
        message: 'Community not found or update failed'
      })
    }

    res.json({
      success: true,
      data: updatedCommunity
    })
  } catch (error) {
    handleError(res, error, 'Error updating community:')
  }
}

// Delete community (soft delete)
export const deleteCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userAddress = req.user?.stacksAddress

    if (!userAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const result = await communityService.deleteCommunity(id, userAddress)
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to delete community'
      })
    }

    res.json({
      success: true,
      message: 'Community deleted successfully'
    })
  } catch (error) {
    handleError(res, error, 'Error deleting community:')
  }
}

// List communities with filters
export const listCommunities = async (req: Request, res: Response) => {
  try {
    const { search, tags, admin, isPublic, limit = '10', offset = '0' } = req.query

    const result = await communityService.listCommunities({
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
      admin: admin as string,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    })

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    handleError(res, error, 'Error listing communities:')
  }
}

// Add member to community
export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userAddress = req.user?.stacksAddress

    if (!userAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const result = await communityService.addCommunityMember(id, userAddress)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    handleError(res, error, 'Error adding member to community:')
  }
}

// Remove member from community
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, userAddress } = req.params
    const adminAddress = req.user?.stacksAddress

    if (!adminAddress) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    const result = await communityService.removeCommunityMember(id, userAddress, adminAddress)

    res.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    handleError(res, error, 'Error removing member from community:')
  }
}
