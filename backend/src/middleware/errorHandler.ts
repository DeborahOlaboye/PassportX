import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  isAppError,
  getErrorMessage,
  getErrorStatusCode,
} from '../errors';

export { AppError };

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = getErrorStatusCode(err);
  const message = getErrorMessage(err);

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' &&
      err instanceof Error && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode = 500): AppError => {
  return new AppError(message, statusCode);
};
