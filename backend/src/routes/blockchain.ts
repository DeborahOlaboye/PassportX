import { Router } from 'express'
import { badgeService, communityService, passportService } from '../services/stacksService'
import { authenticateToken } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../types'

const router = Router()

// Get transaction status
router.get('/transaction/:txId', async (req, res, next) => {
  try {
    const { txId } = req.params
    const status = await badgeService.getTransactionStatus(txId)
    res.json(status)
  } catch (error) {
    next(error)
  }
})

// Get user badges from blockchain
router.get('/badges/:address', async (req, res, next) => {
  try {
    const { address } = req.params
    
    if (!passportService.validateAddress(address)) {
      throw createError('Invalid Stacks address', 400)
    }

    const badges = await passportService.getUserBadges(address)
    res.json(badges)
  } catch (error) {
    next(error)
  }
})

// Get account balance
router.get('/balance/:address', async (req, res, next) => {
  try {
    const { address } = req.params
    
    if (!passportService.validateAddress(address)) {
      throw createError('Invalid Stacks address', 400)
    }

    const balance = await passportService.getAccountBalance(address)
    res.json(balance)
  } catch (error) {
    next(error)
  }
})

// Get account transactions
router.get('/transactions/:address', async (req, res, next) => {
  try {
    const { address } = req.params
    const { limit = 20 } = req.query
    
    if (!passportService.validateAddress(address)) {
      throw createError('Invalid Stacks address', 400)
    }

    const transactions = await passportService.getAccountTransactions(
      address, 
      Number(limit)
    )
    res.json(transactions)
  } catch (error) {
    next(error)
  }
})

// Get contract information
router.get('/contract/:address/:name', async (req, res, next) => {
  try {
    const { address, name } = req.params
    const contractInfo = await badgeService.getContractInfo(address, name)
    res.json(contractInfo)
  } catch (error) {
    next(error)
  }
})

// Validate Stacks address
router.post('/validate-address', async (req, res, next) => {
  try {
    const { address } = req.body
    
    if (!address) {
      throw createError('Address is required', 400)
    }

    const isValid = await passportService.validateAddress(address)
    res.json({ isValid, address })
  } catch (error) {
    next(error)
  }
})

// Read contract function (public)
router.post('/read-function', async (req, res, next) => {
  try {
    const { contractAddress, contractName, functionName, functionArgs = [] } = req.body
    
    if (!contractAddress || !contractName || !functionName) {
      throw createError('Missing required contract parameters', 400)
    }

    const result = await badgeService.readContractFunction(
      contractAddress,
      contractName,
      functionName,
      functionArgs
    )
    
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router