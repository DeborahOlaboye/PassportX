import { Request, Response } from 'express';
import logger from './logger';

/**
 * Send a structured 500 error response and log the underlying error.
 * Includes the request ID (from requestId middleware) so errors can be
 * correlated across logs and client responses.
 */
export function sendRouteError(
  req: Request,
  res: Response,
  message: string,
  error: unknown
): void {
  const requestId = req.requestId ?? 'unknown';
  logger.error(message, {
    requestId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  res.status(500).json({
    success: false,
    error: message,
    requestId,
  });
}
