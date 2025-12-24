'use client';

import React, { ReactNode } from 'react';
import { useWalletConnect } from '@/contexts/WalletConnectContext';
import { AlertCircle, X } from 'lucide-react';

interface WalletErrorBoundaryProps {
  children: ReactNode;
}

export default function WalletErrorBoundary({ children }: WalletErrorBoundaryProps) {
  const { error, clearError } = useWalletConnect();

  if (!error) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="fixed top-4 right-4 max-w-md bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right">
        <div className="flex items-start p-4">
          <AlertCircle className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 ml-3 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            aria-label="Close error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {children}
    </>
  );
}
