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
 * @swagger
 * /api/auth/message:
 *   post:
 *     summary: Generate authentication challenge message
 *     description: Generate a nonce-bound challenge message. The client must sign this exact message with their Stacks wallet. The nonce expires in 5 minutes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stacksAddress]
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 example: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9
 *     responses:
 *       200:
 *         description: Challenge message generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Sign this message to authenticate..." }
 *                 expiresInSeconds: { type: integer, example: 300 }
 *       400:
 *         description: Missing or invalid stacksAddress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate with signed challenge
 *     description: Submit the signed challenge message from /api/auth/message to create a session. The nonce is validated and consumed on success to prevent replay attacks.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stacksAddress, message, signature]
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 example: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9
 *               message:
 *                 type: string
 *                 example: "Sign this message to authenticate with PassportX..."
 *               signature:
 *                 type: string
 *                 example: "0x..."
 *     responses:
 *       200:
 *         description: Authentication successful, session cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid signature or expired nonce
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear session
 *     description: Clears the session cookie, ending the authenticated session.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Logged out successfully" }
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
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify current session
 *     description: Validates the current session token and returns the authenticated user's profile.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No session token or invalid/expired session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/auth/verify-signature:
 *   post:
 *     summary: Verify a Stacks wallet signature
 *     description: Standalone endpoint to verify a Stacks wallet signature without creating a session. Useful for one-off ownership proofs such as badge issuance.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stacksAddress, message, signature]
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 example: SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9
 *               message:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signature is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 verified: { type: boolean, example: true }
 *                 stacksAddress: { type: string }
 *       401:
 *         description: Signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
