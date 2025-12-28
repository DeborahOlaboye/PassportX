'use client';

import React, { useEffect } from 'react';
import { useWalletConnectConfig } from '@/hooks/useWalletConnectConfig';
import { AlertCircle, Loader } from 'lucide-react';

interface ProviderInitializerProps {
  onReady?: () => void;
  onError?: (error: string) => void;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function ProviderInitializer({
  onReady,
  onError,
  fallback = null,
  children,
}: ProviderInitializerProps) {
  const { isInitialized, isInitializing, error, initializeConfig } =
    useWalletConnectConfig();

  useEffect(() => {
    if (isInitialized && !isInitializing && !error) {
      onReady?.();
    }
  }, [isInitialized, isInitializing, error, onReady]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-3">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Initializing WalletConnect...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-3 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <p className="text-sm font-medium text-red-800">Initialization Error</p>
        <p className="text-xs text-red-700 text-center">{error}</p>
        <button
          onClick={initializeConfig}
          className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isInitialized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
