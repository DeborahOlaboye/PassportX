/**
 * Centralized error handler for PassportX
 */

import { logger } from '../logger';
import { 
  PassportXError, 
  BasePassportXError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorContext 
} from './ErrorTypes';

export interface ErrorReporter {
  report(error: PassportXError): Promise<void>;
}

export interface ErrorMetrics {
  increment(metric: string, tags?: Record<string, string>): void;
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
}

class ConsoleErrorReporter implements ErrorReporter {
  async report(error: PassportXError): Promise<void> {
    console.error('Error reported:', error.toJSON());
  }
}

class NoOpMetrics implements ErrorMetrics {
  increment(): void {}
  timing(): void {}
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private reporters: ErrorReporter[] = [];
  private metrics: ErrorMetrics = new NoOpMetrics();
  private errorCounts = new Map<string, number>();
  private lastErrorTimes = new Map<string, number>();

  private constructor() {
    // Add default console reporter in development
    if (process.env.NODE_ENV === 'development') {
      this.reporters.push(new ConsoleErrorReporter());
    }
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  setMetrics(metrics: ErrorMetrics): void {
    this.metrics = metrics;
  }

  async handleError(
    error: Error | PassportXError,
    context: Partial<ErrorContext> = {}
  ): Promise<PassportXError> {
    let passportXError: PassportXError;

    // Convert regular Error to PassportXError if needed
    if (error instanceof BasePassportXError) {
      passportXError = error;
    } else {
      passportXError = this.convertToPassportXError(error, context);
    }

    // Enhance context
    const enhancedError = this.enhanceErrorContext(passportXError, context);

    // Log the error
    this.logError(enhancedError);

    // Update metrics
    this.updateMetrics(enhancedError);

    // Report to external services
    await this.reportError(enhancedError);

    // Track error frequency
    this.trackErrorFrequency(enhancedError);

    return enhancedError;
  }

  private convertToPassportXError(
    error: Error,
    context: Partial<ErrorContext>
  ): PassportXError {
    // Try to categorize the error based on its properties
    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.MEDIUM;
    let isRetryable = false;

    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      category = ErrorCategory.SYSTEM;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      category = ErrorCategory.NETWORK;
      severity = ErrorSeverity.MEDIUM;
      isRetryable = true;
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    return new BasePassportXError(
      error.message,
      category,
      severity,
      'UNKNOWN_ERROR',
      context,
      isRetryable,
      undefined,
      error
    );
  }

  private enhanceErrorContext(
    error: PassportXError,
    additionalContext: Partial<ErrorContext>
  ): PassportXError {
    const enhancedContext: ErrorContext = {
      ...error.context,
      ...additionalContext,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Create a new error with enhanced context
    return new BasePassportXError(
      error.message,
      error.category,
      error.severity,
      error.code,
      enhancedContext,
      error.isRetryable,
      error.userMessage,
      error.originalError
    );
  }

  private logError(error: PassportXError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.category}] ${error.message}`;
    const logContext = {
      errorId: error.id,
      code: error.code,
      severity: error.severity,
      context: error.context,
      isRetryable: error.isRetryable,
      stackTrace: error.stackTrace
    };

    switch (logLevel) {
      case 'error':
        logger.error(logMessage, logContext);
        break;
      case 'warn':
        logger.warn(logMessage, logContext);
        break;
      default:
        logger.info(logMessage, logContext);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'info' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'info';
    }
  }

  private updateMetrics(error: PassportXError): void {
    const tags = {
      category: error.category,
      severity: error.severity,
      code: error.code,
      retryable: error.isRetryable.toString()
    };

    this.metrics.increment('error.count', tags);
    this.metrics.increment(`error.category.${error.category.toLowerCase()}`, tags);
    this.metrics.increment(`error.severity.${error.severity.toLowerCase()}`, tags);
  }

  private async reportError(error: PassportXError): Promise<void> {
    // Only report high severity errors or critical errors
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      const reportPromises = this.reporters.map(reporter => 
        reporter.report(error).catch(reportError => {
          console.error('Failed to report error:', reportError);
        })
      );
      
      await Promise.allSettled(reportPromises);
    }
  }

  private trackErrorFrequency(error: PassportXError): void {
    const errorKey = `${error.category}:${error.code}`;
    const now = Date.now();
    
    // Update error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    
    // Update last error time
    this.lastErrorTimes.set(errorKey, now);
    
    // Check for error spikes (more than 10 errors of same type in 5 minutes)
    if (currentCount > 10) {
      const firstErrorTime = this.lastErrorTimes.get(errorKey) || now;
      if (now - firstErrorTime < 5 * 60 * 1000) {
        logger.warn('Error spike detected', {
          errorKey,
          count: currentCount,
          timeWindow: now - firstErrorTime
        });
      }
    }
  }

  getErrorStats(): Record<string, unknown> {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      lastErrorTimes: Object.fromEntries(this.lastErrorTimes)
    };
  }

  clearErrorStats(): void {
    this.errorCounts.clear();
    this.lastErrorTimes.clear();
  }
}

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Global error event listeners
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { component: 'global', action: 'unhandledrejection' }
    );
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(
      event.error || new Error(event.message),
      { 
        component: 'global', 
        action: 'uncaughterror',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    );
  });
}