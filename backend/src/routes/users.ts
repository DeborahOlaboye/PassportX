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
import { isValidStacksAddress } from '../utils/addressValidation';

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
  readLimiter,
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      if (!isValidStacksAddress(address)) {
        throw createError('Invalid Stacks address format', 400);
      }
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

      // Validate field lengths before touching the DB
      if (
        name !== undefined &&
        (typeof name !== 'string' || name.length > 100)
      ) {
        throw createError(
          'Name must be a string of at most 100 characters',
          400
        );
      }
      if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
        throw createError(
          'Bio must be a string of at most 500 characters',
          400
        );
      }
      if (isPublic !== undefined && typeof isPublic !== 'boolean') {
        throw createError('isPublic must be a boolean', 400);
      }

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
          const urlRegex = /^[a-z0-9-]+$/;
          if (
            typeof customUrl !== 'string' ||
            !urlRegex.test(customUrl) ||
            customUrl.length < 3 ||
            customUrl.length > 30
          ) {
            throw createError(
              'Custom URL must be 3-30 characters and contain only lowercase letters, numbers, and hyphens',
              400
            );
          }
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

      // Update social links - strip non-string values, truncate to 200 chars
      if (socialLinks !== undefined) {
        if (typeof socialLinks !== 'object' || Array.isArray(socialLinks)) {
          throw createError('socialLinks must be an object', 400);
        }
        const sanitize = (val: unknown) =>
          typeof val === 'string' ? val.slice(0, 200) || undefined : undefined;
        user.socialLinks = {
          twitter: sanitize(socialLinks.twitter),
          github: sanitize(socialLinks.github),
          linkedin: sanitize(socialLinks.linkedin),
          discord: sanitize(socialLinks.discord),
          website: sanitize(socialLinks.website),
        };
      }

      // Update theme preferences
      if (themePreferences !== undefined) {
        const VALID_MODES = new Set(['light', 'dark', 'system']);
        const mode =
          typeof themePreferences.mode === 'string' &&
          VALID_MODES.has(themePreferences.mode)
            ? themePreferences.mode
            : 'system';
        user.themePreferences = {
          mode: mode as 'light' | 'dark' | 'system',
          accentColor:
            typeof themePreferences.accentColor === 'string'
              ? themePreferences.accentColor.slice(0, 20) || undefined
              : undefined,
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
router.get(
  '/profile/check-url/:customUrl',
  readLimiter,
  async (req, res, next) => {
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
  }
);

// Get user profile by custom URL
router.get(
  '/profile/u/:customUrl',
  readLimiter,
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
  readLimiter,
  optionalAuth,
  validatePagination,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      if (!isValidStacksAddress(address)) {
        throw createError('Invalid Stacks address format', 400);
      }
      const MAX_BADGE_LIMIT = 100;
      const rawPage = parseInt(req.query.page as string, 10);
      const rawLimit = parseInt(req.query.limit as string, 10);
      const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
      const limit =
        isNaN(rawLimit) || rawLimit < 1
          ? 20
          : Math.min(rawLimit, MAX_BADGE_LIMIT);
      const skip = (page - 1) * limit;

      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if profile is public or user is viewing their own badges
      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      const [badges, total] = await Promise.all([
        Badge.find({ owner: address })
          .populate('templateId')
          .populate('community')
          .sort({ issuedAt: -1 })
          .skip(skip)
          .limit(limit),
        Badge.countDocuments({ owner: address }),
      ]);

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

      res.json({
        data: formattedBadges,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user statistics
router.get(
  '/stats/:address',
  readLimiter,
  optionalAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { address } = req.params;
      if (!isValidStacksAddress(address)) {
        throw createError('Invalid Stacks address format', 400);
      }
      const user = await User.findOne({ stacksAddress: address });

      if (!user) {
        throw createError('User not found', 404);
      }

      if (!user.isPublic && (!req.user || req.user.stacksAddress !== address)) {
        throw createError('Profile is private', 403);
      }

      const [stats] = await Badge.aggregate([
        { $match: { owner: address } },
        {
          $group: {
            _id: null,
            totalBadges: { $sum: 1 },
            highestLevel: { $max: '$metadata.level' },
            distinctCommunities: { $addToSet: '$community' },
          },
        },
        {
          $project: {
            _id: 0,
            totalBadges: 1,
            highestLevel: { $ifNull: ['$highestLevel', 0] },
            communities: { $size: '$distinctCommunities' },
          },
        },
      ]);

      res.json({
        totalBadges: stats?.totalBadges ?? 0,
        communities: stats?.communities ?? 0,
        highestLevel: stats?.highestLevel ?? 0,
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

      if (!isValidStacksAddress(address)) {
        throw createError('Invalid Stacks address format', 400);
      }

      // Verify user is updating their own settings
      if (req.user!.stacksAddress !== address) {
        throw createError('Unauthorized to update these settings', 403);
      }

      // Validate boolean fields
      if (isPublic !== undefined && typeof isPublic !== 'boolean') {
        throw createError('isPublic must be a boolean', 400);
      }
      if (showEmail !== undefined && typeof showEmail !== 'boolean') {
        throw createError('showEmail must be a boolean', 400);
      }
      if (showBadges !== undefined && typeof showBadges !== 'boolean') {
        throw createError('showBadges must be a boolean', 400);
      }
      if (
        showCommunities !== undefined &&
        typeof showCommunities !== 'boolean'
      ) {
        throw createError('showCommunities must be a boolean', 400);
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

      // Generate passport ID (in real implementation, this would mint an NFT)
      const passportId = `passport_${stacksAddress}_${Date.now()}`;

      // Atomic upsert prevents race condition where two concurrent requests
      // both see null from findOne() and each attempt to create a new User doc.
      const user = await User.findOneAndUpdate(
        { stacksAddress },
        {
          $set: { passportId, lastActive: new Date() },
          $setOnInsert: {
            stacksAddress,
            isPublic: true,
            joinDate: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      logger.info('Passport initialized', { stacksAddress, passportId });

      res.json({
        success: true,
        data: {
          passportId,
          stacksAddress: user.stacksAddress,
        },
      });
    } catch (error) {
      logger.error('Failed to initialize passport', { error });
      next(error);
    }
  }
);

// Get user's communities
router.get(
  '/communities/:address',
  readLimiter,
  optionalAuth,
  validatePagination,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      if (!isValidStacksAddress(address)) {
        throw createError('Invalid Stacks address format', 400);
      }
      const MAX_COMMUNITY_LIMIT = 100;
      const rawPage = parseInt(req.query.page as string, 10);
      const rawLimit = parseInt(req.query.limit as string, 10);
      const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
      const limit =
        isNaN(rawLimit) || rawLimit < 1
          ? 20
          : Math.min(rawLimit, MAX_COMMUNITY_LIMIT);
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
