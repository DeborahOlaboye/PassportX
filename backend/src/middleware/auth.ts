import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, JWTPayload } from '../types'

const isValidJWTPayload = (decoded: any): decoded is JWTPayload => {
  return (
    decoded &&
    typeof decoded.userId === 'string' &&
    typeof decoded.stacksAddress === 'string' &&
    typeof decoded.iat === 'number' &&
    typeof decoded.exp === 'number'
  )
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    const payload = decoded as JWTPayload
    req.user = {
      stacksAddress: payload.stacksAddress,
      userId: payload.userId
    }
    next()
  })
}

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
      if (!err) {
        const payload = decoded as JWTPayload
        req.user = {
          stacksAddress: payload.stacksAddress,
          userId: payload.userId
        }
      }
    })
  }
  next()
}