import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ErrorOptions {
  status?: number;
  context?: Record<string, unknown>;
  logLevel?: 'info' | 'warn' | 'error';
}

export function createErrorResponse(
  message: string,
  error?: unknown,
  options: ErrorOptions = {}
): NextResponse {
  const { status = 500, context = {}, logLevel = 'error' } = options;

  const logContext = {
    ...context,
    status,
  };

  if (error) {
    logger[logLevel](message, {
      ...logContext,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    });
  } else {
    logger[logLevel](message, logContext);
  }

  return NextResponse.json({ error: message }, { status });
}
