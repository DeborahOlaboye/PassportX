import { Router, Response, NextFunction } from 'express';
import User from '../models/User';
import Badge from '../models/Badge';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';
import { uploadAvatar, deleteOldAvatar } from '../middleware/upload';
import path from 'path';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  USER_WRITE_RATE_LIMIT,
  API_READ_RATE_LIMIT,
} from '../config/rateLimits';
import logger from '../utils/logger';

const router = Router();

// Rate limiters for user routes
const userWriteLimiter = createRateLimiter(USER_WRITE_RATE_LIMIT);
const readLimiter = createRateLimiter(API_READ_RATE_LIMIT);

/**
 * @swagger
 * /api/users/profile/{address}:
 *   get:
 *     summary: Get user profile by Stacks address
 *     description: Returns the user's public profile. Private profiles are only accessible to the owner.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         example: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Profile is private
 *       404:
 *         description: User not found
 */
router.get(
  '/profile/:address',
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if profile is public or user is viewing their own profile
      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      res.json({
        id: user._id,
        stacksAddress: user.stacksAddress,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        customUrl: user.customUrl,
        socialLinks: user.socialLinks,
        themePreferences: user.themePreferences,
        isPublic: user.isPublic,
        joinDate: user.joinDate,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update authenticated user's profile
 *     description: Update name, bio, avatar, privacy settings, custom URL, social links, or theme preferences.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Alice Smith" }
 *               bio: { type: string, example: "Blockchain enthusiast" }
 *               isPublic: { type: boolean, example: true }
 *               customUrl: { type: string, example: "alice-smith" }
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   twitter: { type: string }
 *                   github: { type: string }
 *                   linkedin: { type: string }
 *                   discord: { type: string }
 *                   website: { type: string }
 *     responses:
 *       200:
 *         description: Updated profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Custom URL already taken
 *       404:
 *         description: User not found
 */
router.put(
  '/profile',
  userWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const {
        name,
        bio,
        avatar,
        isPublic,
        customUrl,
        socialLinks,
        themePreferences,
      } = req.body;

      const user = await User.findOne({
        stacksAddress: req.user!.stacksAddress,
      });
      if (!user) {
        throw createError('User not found', 404);
      }

      // Update basic fields
      if (name !== undefined) user.name = name;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;
      if (isPublic !== undefined) user.isPublic = isPublic;

      // Update custom URL with validation
      if (customUrl !== undefined) {
        if (customUrl) {
          // Check if custom URL is already taken by another user
          const existingUser = await User.findOne({
            customUrl,
            stacksAddress: { $ne: user.stacksAddress },
          });
          if (existingUser) {
            throw createError('Custom URL is already taken', 400);
          }
        }
        user.customUrl = customUrl;
      }

      // Update social links
      if (socialLinks !== undefined) {
        user.socialLinks = {
          twitter: socialLinks.twitter || undefined,
          github: socialLinks.github || undefined,
          linkedin: socialLinks.linkedin || undefined,
          discord: socialLinks.discord || undefined,
          website: socialLinks.website || undefined,
        };
      }

      // Update theme preferences
      if (themePreferences !== undefined) {
        user.themePreferences = {
          mode: themePreferences.mode || 'system',
          accentColor: themePreferences.accentColor || undefined,
        };
      }

      user.lastActive = new Date();
      await user.save();

      res.json({
        id: user._id,
        stacksAddress: user.stacksAddress,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        customUrl: user.customUrl,
        socialLinks: user.socialLinks,
        themePreferences: user.themePreferences,
        isPublic: user.isPublic,
        joinDate: user.joinDate,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/profile/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     description: Upload a new profile picture. Replaces the existing avatar.
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 avatar: { type: string, example: "/uploads/avatars/avatar.jpg" }
 *       400:
 *         description: No file uploaded
 */
router.post(
  '/profile/avatar',
  userWriteLimiter,
  authenticateToken,
  uploadAvatar.single('avatar'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw createError('No file uploaded', 400);
      }

      const user = await User.findOne({
        stacksAddress: req.user!.stacksAddress,
      });
      if (!user) {
        throw createError('User not found', 404);
      }

      // Delete old avatar if it exists
      if (user.avatar) {
        deleteOldAvatar(user.avatar);
      }

      // Save new avatar path
      user.avatar = `/uploads/avatars/${req.file.filename}`;
      user.lastActive = new Date();
      await user.save();

      res.json({
        success: true,
        avatar: user.avatar,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/profile/check-url/{customUrl}:
 *   get:
 *     summary: Check if a custom URL is available
 *     description: Check whether a given custom profile URL is already taken.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: customUrl
 *         required: true
 *         schema:
 *           type: string
 *         example: alice-smith
 *     responses:
 *       200:
 *         description: Availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available: { type: boolean, example: true }
 *                 message: { type: string, example: "Custom URL is available" }
 */
router.get('/profile/check-url/:customUrl', async (req, res, next) => {
  try {
    const { customUrl } = req.params;

    // Validate format
    const urlRegex = /^[a-z0-9-]+$/;
    if (
      !urlRegex.test(customUrl) ||
      customUrl.length < 3 ||
      customUrl.length > 30
    ) {
      return res.json({
        available: false,
        message:
          'Custom URL must be 3-30 characters long and contain only lowercase letters, numbers, and hyphens',
      });
    }

    const existingUser = await User.findOne({ customUrl });

    res.json({
      available: !existingUser,
      message: existingUser
        ? 'Custom URL is already taken'
        : 'Custom URL is available',
    });
  } catch (error) {
    next(error);
  }
});

// Get user profile by custom URL
router.get(
  '/profile/u/:customUrl',
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { customUrl } = req.params;
      const user = await User.findOne({ customUrl });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if profile is public or user is viewing their own profile
      if (
        !user.isPublic &&
        (!req.user || req.user.stacksAddress !== user.stacksAddress)
      ) {
        throw createError('Profile is private', 403);
      }

      res.json({
        id: user._id,
        stacksAddress: user.stacksAddress,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        customUrl: user.customUrl,
        socialLinks: user.socialLinks,
        themePreferences: user.themePreferences,
        isPublic: user.isPublic,
        joinDate: user.joinDate,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user badges (passport)
router.get(
  '/badges/:address',
  optionalAuth,
  validatePagination,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;

      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if profile is public or user is viewing their own badges
      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      const badges = await Badge.find({ owner: address })
        .populate('templateId')
        .populate('community')
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedBadges = badges.map((badge) => ({
        id: badge._id,
        name: (badge.templateId as any).name,
        description: (badge.templateId as any).description,
        community: (badge.community as any).name,
        level: badge.metadata.level,
        category: badge.metadata.category,
        timestamp: badge.metadata.timestamp,
        icon: (badge.templateId as any).icon,
        issuedAt: badge.issuedAt,
        tokenId: badge.tokenId,
        transactionId: badge.transactionId,
      }));

      res.json(formattedBadges);
    } catch (error) {
      next(error);
    }
  }
);

// Get user statistics
router.get(
  '/stats/:address',
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      const badges = await Badge.find({ owner: address }).populate('community');
      const communities = new Set(
        badges.map((badge) => (badge.community as any)._id.toString())
      );
      const maxLevel =
        badges.length > 0
          ? Math.max(...badges.map((badge) => badge.metadata.level))
          : 0;

      res.json({
        totalBadges: badges.length,
        communities: communities.size,
        highestLevel: maxLevel,
        joinDate: user.joinDate,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user privacy settings
router.put(
  '/settings/:address',
  userWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const { isPublic, showEmail, showBadges, showCommunities } = req.body;

      // Verify user is updating their own settings
      if (req.user!.stacksAddress !== address) {
        throw createError('Unauthorized to update these settings', 403);
      }

      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Update settings
      if (isPublic !== undefined) user.isPublic = isPublic;

      // Store additional privacy settings in a settings object
      const settings = {
        showEmail: showEmail ?? false,
        showBadges: showBadges ?? true,
        showCommunities: showCommunities ?? true,
      };

      (user as any).settings = settings;
      user.lastActive = new Date();

      await user.save();

      res.json({
        success: true,
        data: {
          isPublic: user.isPublic,
          settings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Initialize user passport
router.post(
  '/passport/initialize',
  userWriteLimiter,
  authenticateToken,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const stacksAddress = req.user!.stacksAddress;

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
      (user as any).passportId = passportId;
      user.lastActive = new Date();

      await user.save();

      res.json({
        success: true,
        data: {
          passportId,
          stacksAddress: user.stacksAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's communities
router.get(
  '/communities/:address',
  optionalAuth,
  validatePagination,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;

      const user = await User.findOne({ stacksAddress: address })
        .populate({
          path: 'communities',
          options: { skip, limit },
        })
        .populate({
          path: 'adminCommunities',
          options: { skip, limit },
        });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if profile is public or user is viewing their own communities
      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      res.json({
        success: true,
        data: {
          communities: user.communities || [],
          adminCommunities: user.adminCommunities || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
