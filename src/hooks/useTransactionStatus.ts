import { useState, useEffect } from 'react';
import { useTransactionHistory } from '@/contexts/TransactionContext';
import { Transaction } from '@/types/transaction';

export interface TransactionStatusResult {
  transaction: Transaction | undefined;
  isLoading: boolean;
  error: Error | null;
  isNotFound: boolean;
}

export function useTransactionStatus(hash: string): TransactionStatusResult {
  const { transactions, isLoading: contextLoading, error: contextError } = useTransactionHistory();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!contextLoading) {
      setInitialLoading(false);
    }
  }, [contextLoading]);

  const transaction = transactions.find((tx) => tx.hash === hash);
  const isLoading = initialLoading || contextLoading;
  const isNotFound = !isLoading && !transaction && !contextError;

  return {
    transaction,
    isLoading,
    error: contextError,
    isNotFound,
  };
}
