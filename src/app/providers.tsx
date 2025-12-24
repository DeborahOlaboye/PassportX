'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { TransactionProvider } from '@/contexts/TransactionContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TransactionProvider>
        {children}
      </TransactionProvider>
    </AuthProvider>
  );
}
