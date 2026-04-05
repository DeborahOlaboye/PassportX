import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import User from '../models/User';
import logger from '../utils/logger';
import { requireJwtSecret } from '../utils/jwtSecret';

const isValidJWTPayload = (decoded: unknown): decoded is JWTPayload => {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    typeof (decoded as Record<string, unknown>).userId === 'string' &&
    typeof (decoded as Record<string, unknown>).stacksAddress === 'string' &&
    typeof (decoded as Record<string, unknown>).iat === 'number' &&
    typeof (decoded as Record<string, unknown>).exp === 'number'
  );
};

const extractTokenFromHeader = (
  authHeader: string | undefined
): string | undefined => {
  return authHeader && authHeader.split(' ')[1];
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractTokenFromHeader(req.headers['authorization']);

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(
    token,
    requireJwtSecret(),
    (err: jwt.VerifyErrors | null, decoded: unknown) => {
      if (err) {
        logger.warn('JWT verification failed', { error: err.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      if (!isValidJWTPayload(decoded)) {
        logger.error('Invalid JWT payload structure detected');
        return res.status(403).json({ error: 'Invalid token payload' });
      }

      req.user = {
        stacksAddress: decoded.stacksAddress,
        userId: decoded.userId,
      };
      next();
    }
  );
};

/**
 * Middleware that ensures the authenticated user has isAdmin === true.
 * Must be used after authenticateToken (relies on req.user being set).
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await User.findById(req.user.userId).select('isAdmin').lean();
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractTokenFromHeader(req.headers['authorization']);

  if (token) {
    jwt.verify(
      token,
      requireJwtSecret(),
      (err: jwt.VerifyErrors | null, decoded: unknown) => {
        if (!err && isValidJWTPayload(decoded)) {
          req.user = {
            stacksAddress: decoded.stacksAddress,
            userId: decoded.userId,
          };
        }
      }
    );
  }
  next();
};
