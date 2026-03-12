// Error Types and Base Classes
export * from './ErrorTypes';

// Core Error Handling
export * from './ErrorHandler';
export * from './RetryManager';
export * from './ErrorRecovery';
export * from './ErrorContextManager';
export * from './ErrorMiddleware';

// React Components
export * from '../components/errors/EnhancedErrorBoundary';
export * from '../components/errors/ErrorNotificationSystem';

// Specialized Error Handling
export * from './AsyncErrorHandling';
export * from './ErrorAnalytics';
export * from './GracefulDegradation';
export * from './PerformanceMonitor';
export * from './MemoryLeakPrevention';
export * from './EnvironmentAwareErrorHandler';

// Utility functions for common error handling patterns
export const createErrorHandler = (_options?: {
  enableLogging?: boolean;
  enableReporting?: boolean;
  enableMetrics?: boolean;
}): ErrorHandler => {
  return ErrorHandler.getInstance();
};

export const createRetryManager = (_options?: {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}): RetryManager => {
  return RetryManager.getInstance();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withErrorHandling = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>
): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: unknown[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          ErrorHandler.getInstance().handleError(error, context);
          throw error;
        });
      }
      return result;
    } catch (error) {
      ErrorHandler.getInstance().handleError(error as Error, context);
      throw error;
    }
  }) as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const withAsyncErrorHandling = <
  T extends (...args: unknown[]) => Promise<unknown>
>(
  fn: T,
  context?: Record<string, unknown>
): T => {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      await ErrorHandler.getInstance().handleError(error as Error, context);
      throw error;
    }
  }) as T;
};

// Re-export commonly used types
import { ErrorHandler } from './ErrorHandler';
import { RetryManager } from './RetryManager';
import { ErrorRecovery } from './ErrorRecovery';
import { ErrorContextManager } from './ErrorContextManager';
import { ErrorMiddleware } from './ErrorMiddleware';

// Singleton instances for easy access
export const errorHandler = ErrorHandler.getInstance();
export const retryManager = RetryManager.getInstance();
export const errorRecovery = ErrorRecovery.getInstance();
export const errorContextManager = ErrorContextManager.getInstance();
export const errorMiddleware = new ErrorMiddleware();

// Default configuration
export const defaultErrorConfig = {
  enableLogging: true,
  enableReporting: process.env.NODE_ENV === 'production',
  enableMetrics: true,
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  enableGracefulDegradation: true,
  enablePerformanceMonitoring: true,
  enableMemoryLeakPrevention: true,
};

// Initialize error handling system
export const initializeErrorHandling = (_config = defaultErrorConfig): void => {
  // Set global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      errorHandler.handleError(event.error, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorHandler.handleError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
      });
    });
  }

  if (typeof process !== 'undefined') {
    process.on('uncaughtException', (error) => {
      errorHandler.handleError(error, {
        type: 'uncaught_exception',
      });
    });

    process.on('unhandledRejection', (reason) => {
      errorHandler.handleError(new Error(String(reason)), {
        type: 'unhandled_rejection',
      });
    });
  }

  console.log('Error handling system initialized successfully');
};
