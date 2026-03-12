/**
 * Enhanced React Error Boundary with recovery strategies
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { errorHandler } from '../../lib/errors/ErrorHandler';
import { SystemError } from '../../lib/errors/ErrorTypes';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void, errorId: string) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

interface FallbackProps {
  error: Error;
  retry: () => void;
  errorId: string;
  retryCount: number;
  maxRetries: number;
}

const DefaultFallback: React.FC<FallbackProps> = ({
  error,
  retry,
  errorId,
  retryCount,
  maxRetries,
}) => (
  <div className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center mb-4">
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-red-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-red-800">
          Something went wrong
        </h3>
      </div>
    </div>

    <div className="text-sm text-red-700 mb-4">
      <p>We encountered an unexpected error. Our team has been notified.</p>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">
            Error Details
          </summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
          <p className="text-xs mt-1 text-red-600">Error ID: {errorId}</p>
        </details>
      )}
    </div>

    <div className="flex space-x-3">
      {retryCount < maxRetries && (
        <button
          onClick={retry}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try Again ({maxRetries - retryCount} attempts left)
        </button>
      )}

      <button
        onClick={() => window.location.reload()}
        className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, level = 'component' } = this.props;

    // Handle the error through our centralized error handler
    errorHandler
      .handleError(
        new SystemError(
          `React Error Boundary caught error in ${level}`,
          'REACT_ERROR_BOUNDARY',
          {
            component: errorInfo.componentStack?.split('\n')[1]?.trim(),
            action: 'render',
            additionalData: {
              componentStack: errorInfo.componentStack,
              level,
              retryCount: this.state.retryCount,
            },
          },
          error
        )
      )
      .then((passportXError) => {
        this.setState({ errorId: passportXError.id });
      });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-recovery for transient errors
    if (
      this.isTransientError(error) &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleAutoRecovery();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('loading chunk failed') ||
      message.includes('timeout') ||
      error.name === 'ChunkLoadError'
    );
  }

  private scheduleAutoRecovery(): void {
    this.setState({ isRecovering: true });

    this.resetTimeoutId = window.setTimeout(() => {
      this.retryRender();
    }, 2000); // Auto-retry after 2 seconds
  }

  private retryRender = (): void => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }
  };

  private resetErrorBoundary = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorId, retryCount, isRecovering } = this.state;
    const { children, fallback, maxRetries = 3, isolate } = this.props;

    if (hasError && error) {
      if (isRecovering) {
        return (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Recovering...</span>
          </div>
        );
      }

      const fallbackElement = fallback ? (
        fallback(error, this.retryRender, errorId || 'unknown')
      ) : (
        <DefaultFallback
          error={error}
          retry={this.retryRender}
          errorId={errorId || 'unknown'}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );

      // If isolate is true, wrap in an error isolation container
      if (isolate) {
        return (
          <div className="error-boundary-isolation">{fallbackElement}</div>
        );
      }

      return fallbackElement;
    }

    return children;
  }
}

// Higher-order component for easy error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}

// Hook for manual error reporting within components
export function useErrorHandler() {
  const reportError = React.useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      errorHandler.handleError(error, {
        component: 'useErrorHandler',
        additionalData: context,
      });
    },
    []
  );

  return { reportError };
}
