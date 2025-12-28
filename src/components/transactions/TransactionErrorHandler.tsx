'use client';

import { useState, useEffect } from 'react';

export interface TransactionError {
  id: string;
  type: 'validation' | 'signing' | 'broadcasting' | 'network' | 'unknown';
  message: string;
  details?: any;
  timestamp: number;
  retryable: boolean;
  transactionId?: string;
}

interface ErrorHandlerProps {
  error: TransactionError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function TransactionErrorHandler({ error, onRetry, onDismiss }: ErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = (type: TransactionError['type']) => {
    switch (type) {
      case 'validation':
        return '⚠️';
      case 'signing':
        return '🔐';
      case 'broadcasting':
        return '📡';
      case 'network':
        return '🌐';
      default:
        return '❌';
    }
  };

  const getErrorTitle = (type: TransactionError['type']) => {
    switch (type) {
      case 'validation':
        return 'Validation Error';
      case 'signing':
        return 'Signing Error';
      case 'broadcasting':
        return 'Broadcast Error';
      case 'network':
        return 'Network Error';
      default:
        return 'Transaction Error';
    }
  };

  const getErrorSuggestion = (type: TransactionError['type']) => {
    switch (type) {
      case 'validation':
        return 'Please check your input values and try again.';
      case 'signing':
        return 'Please check your wallet connection and try signing again.';
      case 'broadcasting':
        return 'The transaction may have been submitted. Please check your transaction history.';
      case 'network':
        return 'Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">{getErrorIcon(error.type)}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorTitle(error.type)}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
            <p className="mt-1">{getErrorSuggestion(error.type)}</p>
            {error.details && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
          <div className="mt-4 flex space-x-2">
            {error.retryable && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class TransactionErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Transaction error boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Something went wrong
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>An unexpected error occurred while processing your transaction.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={this.resetError}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function useTransactionErrorHandler() {
  const [errors, setErrors] = useState<TransactionError[]>([]);

  const addError = (error: Omit<TransactionError, 'id' | 'timestamp'>) => {
    const newError: TransactionError = {
      ...error,
      id: `error-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setErrors(prev => [newError, ...prev]);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors,
  };
}