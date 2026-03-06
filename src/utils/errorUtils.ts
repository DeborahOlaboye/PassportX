/**
 * Type-safe error handling utilities for the frontend.
 * Provides type guards and message extraction for unknown errors.
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.name === 'TypeError'
    );
  }
  return false;
}
