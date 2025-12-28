import { useTransactionHistory } from '@/contexts/TransactionContext';

export function useTransactionStatus(hash: string) {
  const { transactions } = useTransactionHistory();
  return transactions.find(tx => tx.hash === hash);
}