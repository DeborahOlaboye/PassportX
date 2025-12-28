import jwt from 'jsonwebtoken'
import { verifyMessageSignatureRsv } from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import User from '../models/User'
import { createError } from '../middleware/errorHandler'
import { Response } from 'express'
import { setSessionCookie, clearSessionCookie } from '../utils/sessionManager'

const network = process.env.STACKS_NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet()

export const generateAuthMessage = (stacksAddress: string): string => {
  const timestamp = Date.now()
  return `Sign this message to authenticate with PassportX\nAddress: ${stacksAddress}\nTimestamp: ${timestamp}`
}

export const verifySignature = async (
  message: string,
  signature: string,
  stacksAddress: string
): Promise<boolean> => {
  try {
    return verifyMessageSignatureRsv({
      message,
      signature,
      publicKey: stacksAddress
    })
  } catch (error) {
    return false
  }
}

export const generateToken = (stacksAddress: string, userId: string): string => {
  return jwt.sign(
    { stacksAddress, userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export const authenticateUser = async (
  stacksAddress: string,
  message: string,
  signature: string,
  res?: Response
) => {
  // Verify signature
  const isValidSignature = await verifySignature(message, signature, stacksAddress)
  if (!isValidSignature) {
    throw createError('Invalid signature', 401)
  }

  // Find or create user
  let user = await User.findOne({ stacksAddress })
  if (!user) {
    user = new User({
      stacksAddress,
      isPublic: true,
      joinDate: new Date(),
      lastActive: new Date()
    })
    await user.save()
  } else {
    user.lastActive = new Date()
    await user.save()
  }

  // Generate token
  const token = generateToken(stacksAddress, user._id.toString())

  // Set session cookie if response object provided
  if (res) {
    setSessionCookie(res, token)
  }

  return {
    token,
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
  }
}

/**
 * Logout user and clear session cookie
 */
export const logoutUser = (res: Response) => {
  clearSessionCookie(res)
}