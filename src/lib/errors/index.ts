import { ErrorHandler } from './ErrorHandler';
import { ErrorDeduplicator, errorDeduplicator } from './ErrorDeduplicator';
import { RetryManager } from './RetryManager';
import { ErrorRecovery } from './ErrorRecovery';
import { ErrorContextManager } from './ErrorContextManager';
import { ErrorMiddleware } from './ErrorMiddleware';
import {
  ErrorCategory,
  ErrorSeverity,
  PassportXError,
  BasePassportXError,
} from './ErrorTypes';
import type { ErrorContext } from './ErrorTypes';

// Error Types
export { ErrorCategory, ErrorSeverity, PassportXError, BasePassportXError };
export type { ErrorContext };

// Core Error Handling
export { ErrorHandler, ErrorDeduplicator, errorDeduplicator };
export { RetryManager };
export { ErrorRecovery };
export { ErrorContextManager };
export { ErrorMiddleware };

// Specialized Error Handling - use re-export with type keyword
export { AsyncErrorHandler, withErrorBoundary } from './AsyncErrorHandling';
export { ErrorAnalytics } from './ErrorAnalytics';
export { GracefulDegradationService } from './GracefulDegradation';
export { PerformanceMonitor } from './PerformanceMonitor';
export { MemoryLeakPrevention } from './MemoryLeakPrevention';
export { EnvironmentAwareErrorHandler } from './EnvironmentAwareErrorHandler';

// Utility functions
export const withErrorHandling = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  context?: Record<string, unknown>
): T => {
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

// Singleton instances
export const errorHandler = ErrorHandler.getInstance();
export { retryManager } from './RetryManager';
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
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      errorHandler.handleError(event.error || new Error(event.message), {
        component: 'global',
        action: 'uncaughterror',
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorHandler.handleError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { component: 'global', action: 'unhandledrejection' }
      );
    });
  }
};
