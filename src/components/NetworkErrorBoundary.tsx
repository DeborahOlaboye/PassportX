import React, { Component, ErrorInfo, ReactNode } from 'react';
import { NetworkType } from '@/types/network';

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  network?: NetworkType;
  retryCount: number;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, network?: NetworkType) => void;
  maxRetries?: number;
}

export class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): NetworkErrorBoundaryState {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Try to determine which network was active when the error occurred
    let network: NetworkType | undefined;
    try {
      const networkPreference = localStorage.getItem('network-preference');
      if (networkPreference) {
        const parsed = JSON.parse(networkPreference);
        network = parsed.network as NetworkType;
      }
    } catch {
      // Ignore parsing errors
    }

    console.error('Network Error Boundary caught an error:', error, errorInfo);

    if (onError) {
      onError(error, errorInfo, network);
    }

    // Log error details for debugging
    this.logErrorDetails(error, errorInfo, network);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private logErrorDetails(error: Error, errorInfo: ErrorInfo, network?: NetworkType) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      network,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In a real application, you might want to send this to an error reporting service
    console.error('Network Error Details:', errorDetails);

    // Store in localStorage for debugging (limited to last 10 errors)
    try {
      const existingErrors = JSON.parse(localStorage.getItem('network-errors') || '[]');
      existingErrors.push(errorDetails);
      if (existingErrors.length > 10) {
        existingErrors.shift(); // Remove oldest error
      }
      localStorage.setItem('network-errors', JSON.stringify(existingErrors));
    } catch {
      // Ignore localStorage errors
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000;

      const timeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          retryCount: retryCount + 1,
        });
      }, delay);

      this.retryTimeouts.push(timeout);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">
                Network Error
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Something went wrong with the network connection or configuration.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                  <p className="text-sm text-red-800 font-medium">Error Details:</p>
                  <p className="text-sm text-red-700 mt-1">{error.message}</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Retry attempts: {retryCount} / {maxRetries}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                disabled={retryCount >= maxRetries}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry'}
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for using network error boundary in functional components
export const useNetworkErrorHandler = () => {
  const handleError = React.useCallback((error: Error, network?: NetworkType) => {
    console.error('Network error handled:', error, 'Network:', network);

    // You can add additional error handling logic here
    // For example, sending to error reporting service, updating analytics, etc.
  }, []);

  return { handleError };
};