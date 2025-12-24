'use client';

import React, { ReactNode } from 'react';
import { WalletConnectProvider } from '@/contexts/WalletConnectContext';
import { WalletConnectConfigProvider } from '@/contexts/WalletConnectConfigContext';
import WalletErrorBoundary from './WalletErrorBoundary';
import ProviderInitializer from './ProviderInitializer';

interface EnhancedWalletProviderProps {
  children: ReactNode;
  debug?: boolean;
  autoInitialize?: boolean;
  onInitialized?: () => void;
  onInitError?: (error: string) => void;
}

export default function EnhancedWalletProvider({
  children,
  debug = false,
  autoInitialize = true,
  onInitialized,
  onInitError,
}: EnhancedWalletProviderProps) {
  if (debug && typeof window !== 'undefined') {
    console.log('[EnhancedWalletProvider] Initializing with debug mode');
  }

  return (
    <WalletConnectConfigProvider>
      <WalletConnectProvider>
        <WalletErrorBoundary>
          {autoInitialize ? (
            <ProviderInitializer
              onReady={onInitialized}
              onError={onInitError}
              fallback={
                <div className="flex items-center justify-center p-4">
                  <p className="text-gray-600">Initializing...</p>
                </div>
              }
            >
              {children}
            </ProviderInitializer>
          ) : (
            children
          )}
        </WalletErrorBoundary>
      </WalletConnectProvider>
    </WalletConnectConfigProvider>
  );
}
