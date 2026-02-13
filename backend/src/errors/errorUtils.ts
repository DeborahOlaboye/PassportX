import { AppError } from './AppError';

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (isError(error) && 'statusCode' in error) {
    return (error as AppError).statusCode || 500;
  }
  return 500;
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message);
  }
  return new AppError(String(error));
}
