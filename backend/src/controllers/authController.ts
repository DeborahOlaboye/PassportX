import { Request, Response } from 'express';
import User from '../models/User';
import {
  generateSessionToken,
  setSessionCookie,
  clearSessionCookie,
  verifySessionToken,
  getSessionToken
} from '../utils/sessionManager';

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string) => {
  console.error(message, error);
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error'
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

    // TODO: Verify signature when Stacks signature verification is implemented
    // For now, we trust the client-side authentication

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
          hasPassport: !!(user as any).passportId,
          communities: user.communities,
          adminCommunities: user.adminCommunities
        }
      }
    });
  } catch (error) {
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
          hasPassport: !!(user as any).passportId,
          communities: user.communities,
          adminCommunities: user.adminCommunities
        }
      }
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    handleError(res, error, 'Error refreshing session:');
  }
};
