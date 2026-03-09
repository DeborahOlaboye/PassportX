import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JWTPayload } from '../types';
import User from '../models/User';

const isValidJWTPayload = (decoded: any): decoded is JWTPayload => {
  return (
    decoded &&
    typeof decoded.userId === 'string' &&
    typeof decoded.stacksAddress === 'string' &&
    typeof decoded.iat === 'number' &&
    typeof decoded.exp === 'number'
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
    process.env.JWT_SECRET!,
    (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      if (!isValidJWTPayload(decoded)) {
        console.error('Invalid JWT payload structure:', decoded);
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
      process.env.JWT_SECRET!,
      (err: jwt.VerifyErrors | null, decoded: any) => {
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
