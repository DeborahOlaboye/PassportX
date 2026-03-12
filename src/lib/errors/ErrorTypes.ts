/**
 * Comprehensive error type definitions for PassportX
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BLOCKCHAIN = 'BLOCKCHAIN',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  USER_INPUT = 'USER_INPUT',
  SYSTEM = 'SYSTEM',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

export interface PassportXError extends Error {
  readonly id: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly code: string;
  readonly context: ErrorContext;
  readonly isRetryable: boolean;
  readonly userMessage: string;
  readonly originalError?: Error;
  readonly stackTrace?: string;
}

export class BasePassportXError extends Error implements PassportXError {
  readonly id: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly code: string;
  readonly context: ErrorContext;
  readonly isRetryable: boolean;
  readonly userMessage: string;
  readonly originalError?: Error;
  readonly stackTrace?: string;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    code: string,
    context: Partial<ErrorContext> = {},
    isRetryable: boolean = false,
    userMessage?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.id = this.generateErrorId();
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.context = {
      timestamp: Date.now(),
      ...context
    };
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.originalError = originalError;
    this.stackTrace = this.stack;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BasePassportXError.prototype);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.VALIDATION:
        return 'Invalid input provided. Please check your data and try again.';
      case ErrorCategory.BLOCKCHAIN:
        return 'Blockchain operation failed. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      context: this.context,
      isRetryable: this.isRetryable,
      userMessage: this.userMessage,
      stackTrace: this.stackTrace,
      originalError: this.originalError?.message
    };
  }
}

// Specific error classes
export class NetworkError extends BasePassportXError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      code,
      context,
      true,
      undefined,
      originalError
    );
  }
}

export class ValidationError extends BasePassportXError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      code,
      context,
      false,
      undefined,
      originalError
    );
  }
}

export class AuthenticationError extends BasePassportXError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      code,
      context,
      false,
      undefined,
      originalError
    );
  }
}

export class BlockchainError extends BasePassportXError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.BLOCKCHAIN,
      ErrorSeverity.HIGH,
      code,
      context,
      true,
      undefined,
      originalError
    );
  }
}

export class SystemError extends BasePassportXError {
  constructor(
    message: string,
    code: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      code,
      context,
      false,
      undefined,
      originalError
    );
  }
}