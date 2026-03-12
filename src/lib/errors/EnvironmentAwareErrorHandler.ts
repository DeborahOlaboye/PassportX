/**
 * Development vs production error handling differences
 */

import { logger } from '../logger';
import { PassportXError, ErrorSeverity, ErrorCategory } from './ErrorTypes';
import { errorHandler } from './ErrorHandler';

export interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production' | 'test';
  showStackTraces: boolean;
  showErrorIds: boolean;
  enableVerboseLogging: boolean;
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableMemoryTracking: boolean;
  enableDebugMode: boolean;
  errorDisplayLevel: 'minimal' | 'detailed' | 'full';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  sensitiveDataMasking: boolean;
  errorRetention: number; // days
}

export interface ErrorDisplayOptions {
  showTechnicalDetails: boolean;
  showStackTrace: boolean;
  showErrorId: boolean;
  showContext: boolean;
  showSuggestions: boolean;
  maskSensitiveData: boolean;
}

export class EnvironmentAwareErrorHandler {
  private config: EnvironmentConfig;
  private sensitiveFields = new Set([
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'ssn',
    'social',
    'credit',
    'card',
    'account',
    'pin',
  ]);

  constructor(environment?: string) {
    this.config = this.getEnvironmentConfig(environment);
    this.setupEnvironmentSpecificHandling();
  }

  private getEnvironmentConfig(env?: string): EnvironmentConfig {
    const environment = (env ||
      process.env.NODE_ENV ||
      'development') as EnvironmentConfig['environment'];

    const configs: Record<EnvironmentConfig['environment'], EnvironmentConfig> =
      {
        development: {
          environment: 'development',
          showStackTraces: true,
          showErrorIds: true,
          enableVerboseLogging: true,
          enableErrorReporting: false,
          enablePerformanceMonitoring: true,
          enableMemoryTracking: true,
          enableDebugMode: true,
          errorDisplayLevel: 'full',
          logLevel: 'debug',
          sensitiveDataMasking: false,
          errorRetention: 7,
        },
        staging: {
          environment: 'staging',
          showStackTraces: true,
          showErrorIds: true,
          enableVerboseLogging: true,
          enableErrorReporting: true,
          enablePerformanceMonitoring: true,
          enableMemoryTracking: true,
          enableDebugMode: false,
          errorDisplayLevel: 'detailed',
          logLevel: 'info',
          sensitiveDataMasking: true,
          errorRetention: 14,
        },
        production: {
          environment: 'production',
          showStackTraces: false,
          showErrorIds: false,
          enableVerboseLogging: false,
          enableErrorReporting: true,
          enablePerformanceMonitoring: true,
          enableMemoryTracking: false,
          enableDebugMode: false,
          errorDisplayLevel: 'minimal',
          logLevel: 'warn',
          sensitiveDataMasking: true,
          errorRetention: 30,
        },
        test: {
          environment: 'test',
          showStackTraces: true,
          showErrorIds: true,
          enableVerboseLogging: false,
          enableErrorReporting: false,
          enablePerformanceMonitoring: false,
          enableMemoryTracking: false,
          enableDebugMode: true,
          errorDisplayLevel: 'full',
          logLevel: 'error',
          sensitiveDataMasking: false,
          errorRetention: 1,
        },
      };

    return configs[environment];
  }

  private setupEnvironmentSpecificHandling(): void {
    // Configure logger based on environment
    if (this.config.enableVerboseLogging) {
      logger.debug('Environment-aware error handler initialized', {
        environment: this.config.environment,
        config: this.config,
      });
    }

    // Set up global error handlers based on environment
    if (typeof window !== 'undefined') {
      this.setupClientSideHandlers();
    } else {
      this.setupServerSideHandlers();
    }
  }

  private setupClientSideHandlers(): void {
    // Enhanced error handling for development
    if (this.config.enableDebugMode) {
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleGlobalError(
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason)),
          { type: 'unhandled_promise_rejection' }
        );
      });
    }

    // Production-specific optimizations
    if (this.config.environment === 'production') {
      // Minimize console output in production
      if (!this.config.enableVerboseLogging) {
        console.debug = () => {};
        console.info = () => {};
      }
    }
  }

  private setupServerSideHandlers(): void {
    // Server-side specific error handling
    process.on('uncaughtException', (error) => {
      this.handleGlobalError(error, { type: 'uncaught_exception' });

      // In production, gracefully shutdown
      if (this.config.environment === 'production') {
        logger.error(
          'Uncaught exception in production, shutting down gracefully'
        );
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      this.handleGlobalError(error, { type: 'unhandled_rejection' });
    });
  }

  private async handleGlobalError(
    error: Error,
    context: Record<string, unknown>
  ): Promise<void> {
    await errorHandler.handleError(error, {
      component: 'EnvironmentAwareErrorHandler',
      action: 'global_error',
      additionalData: context,
    });
  }

  formatErrorForDisplay(error: PassportXError): {
    message: string;
    details?: Record<string, unknown>;
    suggestions?: string[];
    errorId?: string;
    stackTrace?: string;
  } {
    const displayOptions = this.getErrorDisplayOptions(error);

    let message = error.userMessage;

    // Enhance message based on environment
    if (
      this.config.environment === 'development' &&
      error.message !== error.userMessage
    ) {
      message += ` (Technical: ${error.message})`;
    }

    const result: ReturnType<typeof this.formatErrorForDisplay> = { message };

    // Add error ID if configured
    if (displayOptions.showErrorId) {
      result.errorId = error.id;
    }

    // Add technical details if configured
    if (displayOptions.showTechnicalDetails) {
      result.details = {
        category: error.category,
        severity: error.severity,
        code: error.code,
        isRetryable: error.isRetryable,
      };

      if (displayOptions.showContext) {
        result.details.context = this.config.sensitiveDataMasking
          ? this.maskSensitiveData(error.context)
          : error.context;
      }
    }

    // Add stack trace if configured
    if (displayOptions.showStackTrace && error.stackTrace) {
      result.stackTrace = error.stackTrace;
    }

    // Add suggestions if configured
    if (displayOptions.showSuggestions) {
      result.suggestions = this.generateSuggestions(error);
    }

    return result;
  }

  private getErrorDisplayOptions(error: PassportXError): ErrorDisplayOptions {
    const baseOptions: ErrorDisplayOptions = {
      showTechnicalDetails: false,
      showStackTrace: false,
      showErrorId: false,
      showContext: false,
      showSuggestions: false,
      maskSensitiveData: this.config.sensitiveDataMasking,
    };

    switch (this.config.errorDisplayLevel) {
      case 'full':
        return {
          ...baseOptions,
          showTechnicalDetails: true,
          showStackTrace: this.config.showStackTraces,
          showErrorId: this.config.showErrorIds,
          showContext: true,
          showSuggestions: true,
        };

      case 'detailed':
        return {
          ...baseOptions,
          showTechnicalDetails: true,
          showErrorId: this.config.showErrorIds,
          showSuggestions: true,
          showStackTrace:
            error.severity === ErrorSeverity.CRITICAL &&
            this.config.showStackTraces,
        };

      case 'minimal':
        return {
          ...baseOptions,
          showSuggestions: error.severity === ErrorSeverity.CRITICAL,
          showErrorId:
            error.severity === ErrorSeverity.CRITICAL &&
            this.config.showErrorIds,
        };

      default:
        return baseOptions;
    }
  }

  private maskSensitiveData(data: unknown): unknown {
    if (!this.config.sensitiveDataMasking) {
      return data;
    }

    if (typeof data === 'string') {
      return this.maskSensitiveString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskSensitiveData(item));
    }

    if (data && typeof data === 'object') {
      const masked: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = Array.from(this.sensitiveFields).some((field) =>
          lowerKey.includes(field)
        );

        if (isSensitive) {
          masked[key] = this.maskValue(value);
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }

      return masked;
    }

    return data;
  }

  private maskSensitiveString(str: string): string {
    // Mask potential sensitive patterns
    return str
      .replace(
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        '****-****-****-****'
      ) // Credit cards
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****') // SSN
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***') // Email
      .replace(/\b(?:Bearer\s+)?[A-Za-z0-9+/]{20,}={0,2}\b/g, '[MASKED_TOKEN]'); // Tokens
  }

  private maskValue(value: unknown): string {
    if (typeof value === 'string') {
      if (value.length <= 4) return '***';
      return (
        value.substring(0, 2) +
        '*'.repeat(value.length - 4) +
        value.substring(value.length - 2)
      );
    }
    return '[MASKED]';
  }

  private generateSuggestions(error: PassportXError): string[] {
    const suggestions: string[] = [];

    // Category-specific suggestions
    switch (error.category) {
      case ErrorCategory.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        if (error.isRetryable) {
          suggestions.push('The operation will be retried automatically');
        }
        break;

      case ErrorCategory.AUTHENTICATION:
        suggestions.push('Please log in again');
        suggestions.push('Clear your browser cache and cookies');
        break;

      case ErrorCategory.VALIDATION:
        suggestions.push('Please check your input and try again');
        suggestions.push('Make sure all required fields are filled');
        break;

      case ErrorCategory.BLOCKCHAIN:
        suggestions.push('Check your wallet connection');
        suggestions.push('Ensure you have sufficient STX for transaction fees');
        if (this.config.environment === 'development') {
          suggestions.push('Check the blockchain network status');
        }
        break;

      default:
        suggestions.push('Please try again later');
        if (this.config.environment !== 'production') {
          suggestions.push('Check the browser console for more details');
        }
    }

    // Environment-specific suggestions
    if (this.config.environment === 'development') {
      suggestions.push(
        'Check the development console for detailed error information'
      );
      if (error.stackTrace) {
        suggestions.push('Review the stack trace for debugging information');
      }
    } else if (this.config.environment === 'production') {
      suggestions.push('If the problem persists, please contact support');
    }

    return suggestions;
  }

  shouldReportError(error: PassportXError): boolean {
    if (!this.config.enableErrorReporting) {
      return false;
    }

    // Always report critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      return true;
    }

    // Report high severity errors in production and staging
    if (
      error.severity === ErrorSeverity.HIGH &&
      (this.config.environment === 'production' ||
        this.config.environment === 'staging')
    ) {
      return true;
    }

    // Don't report low severity errors in production
    if (
      error.severity === ErrorSeverity.LOW &&
      this.config.environment === 'production'
    ) {
      return false;
    }

    return true;
  }

  getLogLevel(error: PassportXError): 'debug' | 'info' | 'warn' | 'error' {
    // Override log level based on environment and error severity
    if (this.config.environment === 'production') {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          return 'error';
        case ErrorSeverity.MEDIUM:
          return 'warn';
        default:
          return 'info';
      }
    }

    if (this.config.environment === 'development') {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          return 'error';
        case ErrorSeverity.MEDIUM:
          return 'warn';
        case ErrorSeverity.LOW:
          return 'info';
        default:
          return 'debug';
      }
    }

    // Default mapping
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'info';
    }
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<EnvironmentConfig>): void {
    this.config = { ...this.config, ...updates };

    if (this.config.enableVerboseLogging) {
      logger.info('Environment config updated', { updates });
    }
  }

  isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
    return Boolean(this.config[feature]);
  }

  // Utility methods for conditional behavior based on environment

  ifDevelopment<T>(callback: () => T): T | undefined {
    return this.config.environment === 'development' ? callback() : undefined;
  }

  ifProduction<T>(callback: () => T): T | undefined {
    return this.config.environment === 'production' ? callback() : undefined;
  }

  ifNotProduction<T>(callback: () => T): T | undefined {
    return this.config.environment !== 'production' ? callback() : undefined;
  }

  createEnvironmentSpecificError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    code: string,
    context?: Record<string, unknown>
  ): PassportXError {
    // Adjust error details based on environment
    let adjustedMessage = message;
    let adjustedSeverity = severity;

    if (this.config.environment === 'production') {
      // Make errors less verbose in production
      if (message.length > 100) {
        adjustedMessage = message.substring(0, 97) + '...';
      }

      // Downgrade some error severities in production to reduce noise
      if (
        severity === ErrorSeverity.MEDIUM &&
        category === ErrorCategory.VALIDATION
      ) {
        adjustedSeverity = ErrorSeverity.LOW;
      }
    }

    return {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'PassportXError',
      message: adjustedMessage,
      category,
      severity: adjustedSeverity,
      code,
      context: {
        timestamp: Date.now(),
        ...context,
      },
      isRetryable:
        category === ErrorCategory.NETWORK ||
        category === ErrorCategory.BLOCKCHAIN,
      userMessage: this.generateUserMessage(category, adjustedSeverity),
      stackTrace: this.config.showStackTraces ? new Error().stack : undefined,
    } as PassportXError;
  }

  private generateUserMessage(
    category: ErrorCategory,
    severity: ErrorSeverity
  ): string {
    const isProduction = this.config.environment === 'production';

    if (isProduction && severity === ErrorSeverity.LOW) {
      return 'Please try again.';
    }

    switch (category) {
      case ErrorCategory.NETWORK:
        return isProduction
          ? 'Connection issue. Please check your internet and try again.'
          : 'Network error occurred. Check your connection and retry.';

      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';

      case ErrorCategory.BLOCKCHAIN:
        return isProduction
          ? 'Transaction failed. Please try again.'
          : 'Blockchain operation failed. Check your wallet and try again.';

      default:
        return isProduction
          ? 'Something went wrong. Please try again.'
          : 'An error occurred. Please try again or check the console for details.';
    }
  }
}

// Global environment-aware error handler
export const environmentErrorHandler = new EnvironmentAwareErrorHandler();

// Utility functions
export const isDevelopment = (): boolean =>
  environmentErrorHandler.getConfig().environment === 'development';

export const isProduction = (): boolean =>
  environmentErrorHandler.getConfig().environment === 'production';

export const isStaging = (): boolean =>
  environmentErrorHandler.getConfig().environment === 'staging';

export const shouldShowDebugInfo = (): boolean =>
  environmentErrorHandler.isFeatureEnabled('enableDebugMode');

export const shouldTrackPerformance = (): boolean =>
  environmentErrorHandler.isFeatureEnabled('enablePerformanceMonitoring');
