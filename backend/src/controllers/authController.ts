import { Request, Response } from 'express';
import User from '../models/User';
import {
  generateSessionToken,
  setSessionCookie,
  clearSessionCookie,
  verifySessionToken,
  getSessionToken
} from '../utils/sessionManager';
import { verifySignature } from '../services/authService';
import logger from '../utils/logger';
import { getErrorMessage, getErrorStatusCode } from '../errors';

// Helper function to handle errors with type-safe error narrowing
const handleError = (res: Response, error: unknown, message: string) => {
  console.error(message, error);
  const status = getErrorStatusCode(error);
  res.status(status).json({
    success: false,
    message: getErrorMessage(error)
  });
};

/**
 * Authenticate user with Stacks wallet
 * Creates or updates user record and returns session token
 */
export const authenticateWithWallet = async (req: Request, res: Response) => {
  try {
    const { stacksAddress, signature, message } = req.body;

    if (!stacksAddress) {
      return res.status(400).json({
        success: false,
        message: 'Stacks address is required'
      });
    }

    // Verify signature
    if (!signature || !message) {
      return res.status(400).json({
        success: false,
        message: 'Signature and message are required for authentication',
        code: 'MISSING_SIGNATURE'
      });
    }

    const isValidSignature = await verifySignature(message, signature, stacksAddress);

    if (!isValidSignature) {
      logger.warn('Invalid signature attempt', {
        stacksAddress,
        messageLength: message?.length,
        signatureLength: signature?.length
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid signature. Please sign the message with your wallet.',
        code: 'INVALID_SIGNATURE'
      });
    }

    logger.info('Signature verified successfully', { stacksAddress });

    // Find or create user
    let user = await User.findOne({ stacksAddress });

    if (!user) {
      // Create new user
      user = new User({
        stacksAddress,
        isPublic: true,
        joinDate: new Date(),
        lastActive: new Date()
      });
      await user.save();
    } else {
      // Update last active
      user.lastActive = new Date();
      await user.save();
    }

    // Generate session token
    const token = generateSessionToken({
      stacksAddress: user.stacksAddress,
      userId: user._id.toString()
    });

    // Set session cookie
    setSessionCookie(res, token);

    res.json({
      success: true,
      data: {
        token,
        user: {
          stacksAddress: user.stacksAddress,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
          isPublic: user.isPublic,
          joinDate: user.joinDate,
          hasPassport: !!user.passportId,
          communities: user.communities,
          adminCommunities: user.adminCommunities
        }
      }
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error authenticating user:');
  }
};

/**
 * Verify current session and return user data
 */
export const verifySession = async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session token found'
      });
    }

    const sessionData = verifySessionToken(token);

    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const user = await User.findOne({ stacksAddress: sessionData.stacksAddress });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          stacksAddress: user.stacksAddress,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
          isPublic: user.isPublic,
          joinDate: user.joinDate,
          hasPassport: !!user.passportId,
          communities: user.communities,
          adminCommunities: user.adminCommunities
        }
      }
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error verifying session:');
  }
};

/**
 * Logout user and clear session
 */
export const logout = async (req: Request, res: Response) => {
  try {
    clearSessionCookie(res);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error logging out:');
  }
};

/**
 * Refresh session token
 */
export const refreshSession = async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No session token found'
      });
    }

    const sessionData = verifySessionToken(token);

    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Generate new token
    const newToken = generateSessionToken(sessionData);
    setSessionCookie(res, newToken);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error: unknown) {
    handleError(res, error, 'Error refreshing session:');
  }
};
