'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { TransactionSigningProvider } from '@/contexts/TransactionSigningContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TransactionProvider>
        <TransactionSigningProvider>
          {children}
        </TransactionSigningProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}
