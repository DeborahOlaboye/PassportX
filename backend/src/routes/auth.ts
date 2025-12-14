import { Router } from 'express'
import { generateAuthMessage, authenticateUser, logoutUser } from '../services/authService'
import { createError } from '../middleware/errorHandler'
import { verifySessionToken, getSessionToken } from '../utils/sessionManager'
import User from '../models/User'

const router = Router()

// Generate authentication message
router.post('/message', async (req, res, next) => {
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

// Authenticate with signature
router.post('/login', async (req, res, next) => {
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

// Logout user
router.post('/logout', async (req, res, next) => {
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

// Verify current session
router.get('/verify', async (req, res, next) => {
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