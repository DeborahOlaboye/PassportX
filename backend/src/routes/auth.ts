import { Router, Request, Response, NextFunction } from 'express';
import {
  generateAuthMessage,
  authenticateUser,
  logoutUser,
  verifySignature,
} from '../services/authService';
import { createError } from '../middleware/errorHandler';
import { verifySessionToken, getSessionToken } from '../utils/sessionManager';
import User from '../models/User';
import { createRateLimiter } from '../middleware/rateLimiter';
import { AUTH_RATE_LIMIT } from '../config/rateLimits';
import { requireSignatureFields } from '../middleware/signatureVerification';

const router = Router();

// Strict rate limiting for all auth endpoints (10 requests per 15 minutes)
const authLimiter = createRateLimiter(AUTH_RATE_LIMIT);

/**
 * POST /auth/message
 * Generate a nonce-bound authentication challenge message.
 * The returned message contains a server-issued nonce that expires in 5 minutes.
 * Clients must sign this exact message with their Stacks wallet.
 */
router.post(
  '/message',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stacksAddress } = req.body;

      if (!stacksAddress || typeof stacksAddress !== 'string') {
        throw createError('Stacks address is required', 400);
      }

      const message = generateAuthMessage(stacksAddress);
      res.json({
        success: true,
        message,
        expiresInSeconds: 300,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Authenticate by submitting the signed challenge message.
 * Requires stacksAddress, message (from /auth/message), and signature.
 * The nonce embedded in the message is validated server-side and consumed
 * on success to prevent replay attacks.
 */
router.post(
  '/login',
  authLimiter,
  requireSignatureFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stacksAddress, message, signature } = req.body;

      const result = await authenticateUser(
        stacksAddress,
        message,
        signature,
        res
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Clear the session cookie.
 */
router.post(
  '/logout',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      logoutUser(res);
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /auth/verify
 * Verify the current session token and return the authenticated user.
 */
router.get(
  '/verify',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getSessionToken(req);

      if (!token) {
        throw createError('No session token found', 401);
      }

      const sessionData = verifySessionToken(token);

      if (!sessionData) {
        throw createError('Invalid or expired session', 401);
      }

      const user = await User.findOne({
        stacksAddress: sessionData.stacksAddress,
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          stacksAddress: user.stacksAddress,
          name: user.name,
          bio: user.bio,
          avatar: user.avatar,
          email: user.email,
          isPublic: user.isPublic,
          joinDate: user.joinDate,
          hasPassport: !!(user as any).passportId,
          communities: user.communities,
          adminCommunities: user.adminCommunities,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/verify-signature
 * Standalone endpoint to verify a Stacks wallet signature without creating
 * a session. Useful for one-off ownership proofs (e.g. badge issuance).
 */
router.post(
  '/verify-signature',
  authLimiter,
  requireSignatureFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stacksAddress, message, signature } = req.body;

      const isValid = await verifySignature(message, signature, stacksAddress);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Signature verification failed',
          code: 'INVALID_SIGNATURE',
        });
      }

      res.json({ success: true, verified: true, stacksAddress });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
