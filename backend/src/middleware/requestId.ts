import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Attach a unique request ID to every incoming request.
 * Prefers the X-Request-ID header if the client sends one, otherwise
 * generates a fresh UUID v4. The ID is echoed back in the response header
 * so clients can correlate logs.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers['x-request-id'] as string | undefined) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
