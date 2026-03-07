import { Request, Response } from 'express';
import * as communityService from '../services/communityService';
import { ICommunity } from '../models/Community';
import { Types } from 'mongoose';
import { getErrorMessage, getErrorStatusCode } from '../errors';

// Helper function to handle errors with type-safe error narrowing
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  const status = getErrorStatusCode(error);
  res.status(status).json({
    success: false,
    message: getErrorMessage(error),
  });
};

// Create a new community
export const createCommunity = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      theme,
      settings,
      socialLinks,
      website,
      about,
      tags,
    } = req.body;
    const admin = req.user?.stacksAddress;

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Community name is required' });
    }

    if (name.trim().length > 100) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Community name must not exceed 100 characters',
        });
    }

    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Community description is required' });
    }

    if (description.trim().length > 1000) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Community description must not exceed 1000 characters',
        });
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return res
          .status(400)
          .json({ success: false, message: 'Tags must be an array of strings' });
      }
      if (tags.length > 20) {
        return res
          .status(400)
          .json({ success: false, message: 'A community may have at most 20 tags' });
      }
      const invalidTag = tags.find((t: unknown) => typeof t !== 'string' || (t as string).trim().length === 0);
      if (invalidTag !== undefined) {
        return res
          .status(400)
          .json({ success: false, message: 'Each tag must be a non-empty string' });
      }
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
      tags,
    });

    res.status(201).json({
      success: true,
      data: community,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error creating community:');
  }
};

// Get community by ID or slug
export const getCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let community;

    if (Types.ObjectId.isValid(id)) {
      community = await communityService.getCommunityById(id);
    } else {
      community = await communityService.getCommunityBySlug(id);
    }

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found',
      });
    }

    res.json({
      success: true,
      data: community,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching community:');
  }
};

// Update community
export const updateCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userAddress = req.user?.stacksAddress;

    if (!userAddress) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const updatedCommunity = await communityService.updateCommunity(
      id,
      updates,
      userAddress
    );

    if (!updatedCommunity) {
      return res.status(404).json({
        success: false,
        message: 'Community not found or update failed',
      });
    }

    res.json({
      success: true,
      data: updatedCommunity,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error updating community:');
  }
};

// Delete community (soft delete)
export const deleteCommunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userAddress = req.user?.stacksAddress;

    if (!userAddress) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await communityService.deleteCommunity(id, userAddress);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Failed to delete community',
      });
    }

    res.json({
      success: true,
      message: 'Community deleted successfully',
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error deleting community:');
  }
};

// List communities with filters
export const listCommunities = async (req: Request, res: Response) => {
  try {
    const {
      search,
      tags,
      admin,
      isPublic,
      limit = '10',
      offset = '0',
    } = req.query;

    const result = await communityService.listCommunities({
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
      admin: admin as string,
      isPublic: isPublic ? isPublic === 'true' : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error listing communities:');
  }
};

// Add member to community
export const addMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userAddress = req.user?.stacksAddress;

    if (!userAddress) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await communityService.addCommunityMember(id, userAddress);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error adding member to community:');
  }
};

// Remove member from community
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { id, userAddress } = req.params;
    const adminAddress = req.user?.stacksAddress;

    if (!adminAddress) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await communityService.removeCommunityMember(
      id,
      userAddress,
      adminAddress
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error removing member from community:');
  }
};

// Add admin to community
export const addAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminAddress } = req.body;
    const currentAdmin = req.user?.stacksAddress;

    if (!currentAdmin) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    if (!adminAddress) {
      return res
        .status(400)
        .json({ success: false, message: 'Admin address is required' });
    }

    const result = await communityService.addCommunityAdmin(
      id,
      adminAddress,
      currentAdmin
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error adding admin to community:');
  }
};

// Remove admin from community
export const removeAdmin = async (req: Request, res: Response) => {
  try {
    const { id, adminAddress } = req.params;
    const currentAdmin = req.user?.stacksAddress;

    if (!currentAdmin) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });
    }

    const result = await communityService.removeCommunityAdmin(
      id,
      adminAddress,
      currentAdmin
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error removing admin from community:');
  }
};

// Get community analytics
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const analytics = await communityService.getCommunityAnalytics(id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching community analytics:');
  }
};

// Get community leaderboard
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10' } = req.query;

    const leaderboard = await communityService.getCommunityLeaderboard(
      id,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching community leaderboard:');
  }
};

// Get community members
export const getMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const result = await communityService.getCommunityMembers(
      id,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching community members:');
  }
};
