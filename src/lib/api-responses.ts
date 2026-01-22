import { NextResponse } from 'next/server';

/**
 * Standard API error interface
 */
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standard API error response format
 */
export interface APIErrorResponse {
  success: false;
  error: APIError;
}

/**
 * Standard API success response format
 */
export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Helper to create a standardized error response
 * 
 * @param message - Human readable error message
 * @param code - Machine readable error code (e.g., 'UNAUTHORIZED', 'INVALID_INPUT')
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details
 */
export function sendError(
  message: string,
  code: string = 'BAD_REQUEST',
  status: number = 400,
  details?: unknown
) {
  const errorResponse: APIErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Helper to create a standardized success response
 * 
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @param message - Optional success message
 */
export function sendSuccess<T>(
  data: T,
  status: number = 200,
  message?: string
) {
  const successResponse: APISuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };

  return NextResponse.json(successResponse, { status });
}

/**
 * Common error codes for use with sendError
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_INPUT: 'INVALID_INPUT',
  SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE: 'UNPROCESSABLE_ENTITY',
};
