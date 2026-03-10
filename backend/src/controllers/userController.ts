import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import { getErrorMessage, getErrorStatusCode } from '../errors';
import logger from '../utils/logger';

// Helper function to handle errors with type-safe error narrowing
const handleError = (res: Response, error: unknown, message: string) => {
  logger.error(message, error);
  const status = getErrorStatusCode(error);
  res.status(status).json({
    success: false,
    message: getErrorMessage(error),
  });
};

// Get user by Stacks address
export const getUserByAddress = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ stacksAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Private profiles return only the address and the isPublic flag
    if (!user.isPublic) {
      return res.json({
        success: true,
        data: {
          stacksAddress: user.stacksAddress,
          isPublic: false,
        },
      });
    }

    const showEmail = user.settings?.showEmail ?? false;
    const showCommunities = user.settings?.showCommunities ?? true;

    res.json({
      success: true,
      data: {
        stacksAddress: user.stacksAddress,
        profile: {
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          ...(showEmail && { email: user.email }),
        },
        isPublic: user.isPublic,
        joinDate: user.joinDate,
        passportId: user.passportId,
        ...(showCommunities && {
          communities: user.communities,
          adminCommunities: user.adminCommunities,
        }),
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching user:');
  }
};

// Create or update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.params;
    const { name, bio, avatar, email } = req.body;

    // Validate name length
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: 'Name must be a non-empty string' });
      }
      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Name must not exceed 100 characters',
        });
      }
    }

    // Validate bio length
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res
          .status(400)
          .json({ success: false, message: 'Bio must be a string' });
      }
      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio must not exceed 500 characters',
        });
      }
    }

    // Validate email format
    if (email !== undefined) {
      if (typeof email !== 'string') {
        return res
          .status(400)
          .json({ success: false, message: 'Email must be a string' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid email address format' });
      }
    }

    // Validate avatar URL
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return res
          .status(400)
          .json({ success: false, message: 'Avatar must be a string URL' });
      }
      try {
        const parsed = new URL(avatar);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Avatar must be a valid URL (http or https)',
          });
      }
    }

    // Verify user is updating their own profile
    if (req.user?.stacksAddress !== address) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this profile',
      });
    }

    let user = await User.findOne({ stacksAddress: address });

    if (!user) {
      // Create new user
      user = new User({
        stacksAddress: address,
        name,
        bio,
        avatar,
        email,
        isPublic: true,
        joinDate: new Date(),
        lastActive: new Date(),
      });
    } else {
      // Update existing user
      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;
      if (email !== undefined) user.email = email;
      user.lastActive = new Date();
    }

    await user.save();

    res.json({
      success: true,
      data: {
        stacksAddress: user.stacksAddress,
        profile: {
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
        },
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error updating profile:');
  }
};

// Update user privacy settings
export const updateUserSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.params;
    const { isPublic, showEmail, showBadges, showCommunities } = req.body;

    // Verify user is updating their own settings
    if (req.user?.stacksAddress !== address) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update these settings',
      });
    }

    const user = await User.findOne({ stacksAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update settings
    if (isPublic !== undefined) user.isPublic = isPublic;

    // Store additional privacy settings
    user.settings = {
      showEmail: showEmail ?? user.settings?.showEmail ?? false,
      showBadges: showBadges ?? user.settings?.showBadges ?? true,
      showCommunities:
        showCommunities ?? user.settings?.showCommunities ?? true,
    };

    user.lastActive = new Date();

    await user.save();

    res.json({
      success: true,
      data: {
        isPublic: user.isPublic,
        settings: user.settings,
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error updating settings:');
  }
};

// Initialize user passport
export const initializePassport = async (req: AuthRequest, res: Response) => {
  try {
    const { stacksAddress } = req.body;

    // Verify user is initializing their own passport
    if (req.user?.stacksAddress !== stacksAddress) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to initialize this passport',
      });
    }

    let user = await User.findOne({ stacksAddress });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        stacksAddress,
        isPublic: true,
        joinDate: new Date(),
        lastActive: new Date(),
      });
    }

    // Generate passport ID (in real implementation, this would mint an NFT)
    const passportId = `passport_${stacksAddress}_${Date.now()}`;
    user.passportId = passportId;
    user.lastActive = new Date();

    await user.save();

    res.json({
      success: true,
      data: {
        passportId,
        stacksAddress: user.stacksAddress,
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error initializing passport:');
  }
};

// Get user's badges
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const MAX_BADGE_LIMIT = 100;
    const rawLimit = parseInt(limit as string, 10);
    const rawOffset = parseInt(offset as string, 10);
    const safeLimit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, MAX_BADGE_LIMIT);
    const safeOffset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

    // This would integrate with the badge service
    // For now, return empty array
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: false,
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching user badges:');
  }
};

// Get user's communities
export const getUserCommunities = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const user = await User.findOne({ stacksAddress: address })
      .populate('communities')
      .populate('adminCommunities');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isPublic || !(user.settings?.showCommunities ?? true)) {
      return res.status(403).json({
        success: false,
        message: 'This user has made their communities private',
      });
    }

    res.json({
      success: true,
      data: {
        communities: user.communities || [],
        adminCommunities: user.adminCommunities || [],
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error fetching user communities:');
  }
};
