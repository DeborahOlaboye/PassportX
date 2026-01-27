import { Router, Request, Response, NextFunction } from 'express'
import { generateAuthMessage, authenticateUser, logoutUser } from '../services/authService'
import { createError } from '../middleware/errorHandler'
import { verifySessionToken, getSessionToken } from '../utils/sessionManager'
import User from '../models/User'

const router = Router()

/**
 * @swagger
 * /api/v1/auth/message:
 *   post:
 *     summary: Generate authentication message
 *     description: Generates a message for user authentication using Stacks address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 description: The Stacks address of the user
 *             required:
 *               - stacksAddress
 *     responses:
 *       200:
 *         description: Authentication message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - Stacks address is required
 */
router.post('/message', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stacksAddress } = req.body

    if (!stacksAddress) {
      throw createError('Stacks address is required', 400)
    }

    const message = generateAuthMessage(stacksAddress)
    res.json({ message })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user with signature
 *     description: Authenticates a user using Stacks address, message, and signature
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 description: The Stacks address of the user
 *               message:
 *                 type: string
 *                 description: The authentication message
 *               signature:
 *                 type: string
 *                 description: The signature of the message
 *             required:
 *               - stacksAddress
 *               - message
 *               - signature
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Missing required fields
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stacksAddress, message, signature } = req.body

    if (!stacksAddress || !message || !signature) {
      throw createError('Missing required fields', 400)
    }

    const result = await authenticateUser(stacksAddress, message, signature, res)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the current user by clearing the session
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/logout', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    logoutUser(res)
    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /api/v1/auth/verify:
 *   get:
 *     summary: Verify current session
 *     description: Verifies the current user session and returns user information
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No session token found or invalid/expired session
 */
router.get('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getSessionToken(req)

    if (!token) {
      throw createError('No session token found', 401)
    }

    const sessionData = verifySessionToken(token)

    if (!sessionData) {
      throw createError('Invalid or expired session', 401)
    }

    const user = await User.findOne({ stacksAddress: sessionData.stacksAddress })

    if (!user) {
      throw createError('User not found', 404)
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
        adminCommunities: user.adminCommunities
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router