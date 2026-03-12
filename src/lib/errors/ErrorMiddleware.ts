import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from './ErrorHandler';
import { ErrorCategory, ErrorSeverity } from './ErrorTypes';

export interface ErrorMiddlewareOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  enableMetrics?: boolean;
}

export class ErrorMiddleware {
  private errorHandler: ErrorHandler;
  private options: ErrorMiddlewareOptions;

  constructor(options: ErrorMiddlewareOptions = {}) {
    this.errorHandler = ErrorHandler.getInstance();
    this.options = {
      enableLogging: true,
      enableReporting: true,
      enableMetrics: true,
      ...options
    };
  }

  async handleApiError(
    error: Error,
    request: NextRequest,
    context?: Record<string, unknown>
  ): Promise<NextResponse> {
    const errorContext = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ...context
    };

    await this.errorHandler.handleError(error, errorContext);

    // Return appropriate error response
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  createAsyncHandler(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        return await handler(request);
      } catch (error) {
        return this.handleApiError(error as Error, request);
      }
    };
  }

  logRequest(request: NextRequest): void {
    if (this.options.enableLogging) {
      console.log(`${request.method} ${request.url}`);
    }
  }

  logResponse(response: NextResponse, duration: number): void {
    if (this.options.enableLogging) {
      console.log(`Response: ${response.status} (${duration}ms)`);
    }
  }
}

export const errorMiddleware = new ErrorMiddleware();