import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  getErrorMessage,
  getErrorStatusCode,
} from '../errors';
import logger from '../utils/logger';

export { AppError };

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = getErrorStatusCode(err);
  const message = getErrorMessage(err);

  logger.error('Request error', { statusCode, message, err });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' &&
      err instanceof Error && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode = 500): AppError => {
  return new AppError(message, statusCode);
};
