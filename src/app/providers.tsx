'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { TransactionSigningProvider } from '@/contexts/TransactionSigningContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import FallbackUI from '@/components/FallbackUI';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<FallbackUI message="A critical error occurred" />}
    >
      <AuthProvider>
        <NetworkProvider>
          <TransactionProvider>
            <TransactionSigningProvider>{children}</TransactionSigningProvider>
          </TransactionProvider>
        </NetworkProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
