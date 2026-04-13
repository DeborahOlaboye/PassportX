/**
 * Badge mint specific error types.
 */
export enum MintErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  BADGE_NOT_FOUND = 'BADGE_NOT_FOUND',
  RECIPIENT_MISMATCH = 'RECIPIENT_MISMATCH',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Error response for badge mint operations.
 */
export interface MintErrorResponse {
  code: MintErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Create a standardized error response.
 */
export function createMintError(
  code: MintErrorCode,
  message: string,
  details?: Record<string, unknown>
): MintErrorResponse {
  const statusCodeMap: Record<MintErrorCode, number> = {
    [MintErrorCode.INVALID_INPUT]: 400,
    [MintErrorCode.UNAUTHORIZED]: 401,
    [MintErrorCode.INSUFFICIENT_BALANCE]: 402,
    [MintErrorCode.BADGE_NOT_FOUND]: 404,
    [MintErrorCode.RECIPIENT_MISMATCH]: 403,
    [MintErrorCode.RATE_LIMITED]: 429,
    [MintErrorCode.INTERNAL_ERROR]: 500,
  };

  return {
    code,
    message,
    statusCode: statusCodeMap[code],
    details,
  };
}

/**
 * Check if an error is a known mint error.
 */
export function isMintError(error: unknown): error is MintErrorResponse {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'statusCode' in error &&
    Object.values(MintErrorCode).includes(
      (error as Record<string, unknown>).code as MintErrorCode
    )
  );
}

/**
 * Convert an unknown error to a mint error response.
 */
export function normalizeMintError(error: unknown): MintErrorResponse {
  if (isMintError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createMintError(MintErrorCode.INTERNAL_ERROR, error.message);
  }

  return createMintError(
    MintErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred'
  );
}
