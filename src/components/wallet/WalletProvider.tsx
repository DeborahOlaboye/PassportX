'use client';

import React, { ReactNode } from 'react';
import { WalletConnectProvider } from '@/contexts/WalletConnectContext';
import WalletErrorBoundary from './WalletErrorBoundary';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WalletConnectProvider>
      <WalletErrorBoundary>{children}</WalletErrorBoundary>
    </WalletConnectProvider>
  );
}
