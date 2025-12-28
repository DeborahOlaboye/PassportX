import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error);
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error'
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
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        stacksAddress: user.stacksAddress,
        profile: {
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email
        },
        isPublic: user.isPublic,
        joinDate: user.joinDate,
        passportId: user.passportId,
        communities: user.communities,
        adminCommunities: user.adminCommunities
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching user:');
  }
};

// Create or update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { address } = req.params;
    const { name, bio, avatar, email } = req.body;

    // Verify user is updating their own profile
    if (req.user?.stacksAddress !== address) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this profile'
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
        lastActive: new Date()
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
          email: user.email
        }
      }
    });
  } catch (error) {
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
        message: 'Unauthorized to update these settings'
      });
    }

    const user = await User.findOne({ stacksAddress: address });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update settings
    if (isPublic !== undefined) user.isPublic = isPublic;

    // Store additional privacy settings in a settings object
    const settings = {
      showEmail: showEmail ?? false,
      showBadges: showBadges ?? true,
      showCommunities: showCommunities ?? true
    };

    // Add settings field to user model if needed
    (user as any).settings = settings;
    user.lastActive = new Date();

    await user.save();

    res.json({
      success: true,
      data: {
        isPublic: user.isPublic,
        settings
      }
    });
  } catch (error) {
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
        message: 'Unauthorized to initialize this passport'
      });
    }

    let user = await User.findOne({ stacksAddress });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        stacksAddress,
        isPublic: true,
        joinDate: new Date(),
        lastActive: new Date()
      });
    }

    // Generate passport ID (in real implementation, this would mint an NFT)
    const passportId = `passport_${stacksAddress}_${Date.now()}`;
    (user as any).passportId = passportId;
    user.lastActive = new Date();

    await user.save();

    res.json({
      success: true,
      data: {
        passportId,
        stacksAddress: user.stacksAddress
      }
    });
  } catch (error) {
    handleError(res, error, 'Error initializing passport:');
  }
};

// Get user's badges
export const getUserBadges = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    // This would integrate with the badge service
    // For now, return empty array
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: false
      }
    });
  } catch (error) {
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
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        communities: user.communities || [],
        adminCommunities: user.adminCommunities || []
      }
    });
  } catch (error) {
    handleError(res, error, 'Error fetching user communities:');
  }
};
