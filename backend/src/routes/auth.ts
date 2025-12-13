import { Router } from 'express'
import { generateAuthMessage, authenticateUser } from '../services/authService'
import { createError } from '../middleware/errorHandler'

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

    const result = await authenticateUser(stacksAddress, message, signature)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router