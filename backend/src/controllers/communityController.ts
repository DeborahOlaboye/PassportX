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
