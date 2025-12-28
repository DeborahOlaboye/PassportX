import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

export interface SessionData {
  stacksAddress: string;
  userId: string;
}

export interface SessionOptions {
  expiresIn?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_OPTIONS: SessionOptions = {
  expiresIn: '7d',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

/**
 * Generate a JWT token for user session
 */
export function generateSessionToken(
  data: SessionData,
  options: SessionOptions = {}
): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const secret = process.env.JWT_SECRET || 'default-secret-key';

  return jwt.sign(
    {
      stacksAddress: data.stacksAddress,
      userId: data.userId
    },
    secret,
    { expiresIn: mergedOptions.expiresIn }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    const decoded = jwt.verify(token, secret) as SessionData;
    return {
      stacksAddress: decoded.stacksAddress,
      userId: decoded.userId
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(
  res: Response,
  token: string,
  options: SessionOptions = {}
): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const maxAge = mergedOptions.expiresIn
    ? parseExpiresIn(mergedOptions.expiresIn)
    : 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  res.cookie('session_token', token, {
    httpOnly: mergedOptions.httpOnly,
    secure: mergedOptions.secure,
    sameSite: mergedOptions.sameSite,
    maxAge
  });
}

/**
 * Clear session cookie from response
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}

/**
 * Get session token from request
 */
export function getSessionToken(req: Request): string | null {
  // Try to get from cookie first
  const cookieToken = req.cookies?.session_token;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Parse expiresIn string to milliseconds
 */
function parseExpiresIn(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  }
}

/**
 * Refresh session token if needed (within 1 day of expiry)
 */
export function refreshSessionIfNeeded(
  req: Request,
  res: Response
): SessionData | null {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }

  const sessionData = verifySessionToken(token);
  if (!sessionData) {
    return null;
  }

  // Decode without verification to check expiry
  try {
    const decoded = jwt.decode(token) as any;
    const exp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Refresh if less than 1 day until expiry
    if (timeUntilExpiry < oneDayInMs) {
      const newToken = generateSessionToken(sessionData);
      setSessionCookie(res, newToken);
    }
  } catch (error) {
    // If decoding fails, just return the session data without refreshing
  }

  return sessionData;
}
