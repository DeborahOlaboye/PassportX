'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { TransactionSigningProvider } from '@/contexts/TransactionSigningContext';
import { NetworkProvider } from '@/contexts/NetworkContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NetworkProvider>
        <TransactionProvider>
          <TransactionSigningProvider>
            {children}
          </TransactionSigningProvider>
        </TransactionProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}
