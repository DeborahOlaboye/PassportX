import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ErrorOptions {
  status?: number;
  context?: Record<string, unknown>;
  logLevel?: 'info' | 'warn' | 'error';
}

const LOG_METHODS: Record<Required<ErrorOptions['logLevel']>, (msg: string, ctx?: Record<string, unknown>) => void> = {
  info: (msg, ctx) => logger.info(msg, ctx),
  warn: (msg, ctx) => logger.warn(msg, ctx),
  error: (msg, ctx) => logger.error(msg, ctx as any),
};

export function createErrorResponse(
  message: string,
  error?: unknown,
  options: ErrorOptions = {}
): NextResponse {
  const { status = 500, context = {}, logLevel = 'error' } = options;

  const logContext: Record<string, unknown> = {
    ...context,
    status,
  };

  const logFn = LOG_METHODS[logLevel];

  if (error) {
    logFn(message, {
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
    logFn(message, logContext);
  }

  return NextResponse.json({ error: message }, { status });
}
