import { useEffect } from 'react';
import { useAccount, useWaitForTransaction } from 'wagmi';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTransactionHistory } from '@/contexts/TransactionContext';

type TransactionTrackerProps = {
  hash: `0x${string}` | undefined;
  method: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export function TransactionTracker({
  hash,
  method,
  onSuccess,
  onError,
}: TransactionTrackerProps) {
  const { isConnected } = useAccount();
  const { trackTransactionCompleted, trackError } = useAnalytics();
  const { addTransaction, updateTransactionStatus } = useTransactionHistory();

  const { isSuccess, error, data } = useWaitForTransaction({
    hash,
    confirmations: 1,
    enabled: !!hash,
  });

  // Add transaction to history when hash is provided
  useEffect(() => {
    if (hash && method) {
      addTransaction({
        hash,
        method,
        status: 'pending',
        from: data?.from,
        to: data?.to,
        value: data?.value?.toString(),
        gasPrice: data?.gasPrice?.toString(),
        gasUsed: data?.gasUsed?.toString(),
        blockNumber: data?.blockNumber,
        confirmations: data?.confirmations,
      });
    }
  }, [hash, method, addTransaction, data]);

  // Track transaction success
  useEffect(() => {
    if (isConnected && hash && isSuccess) {
      updateTransactionStatus(hash, 'confirmed', {
        gasUsed: data?.gasUsed?.toString(),
        blockNumber: data?.blockNumber,
        confirmations: data?.confirmations,
      });
      trackTransactionCompleted(hash, method);
      if (onSuccess) onSuccess();
    }
  }, [isSuccess, hash, method, isConnected, trackTransactionCompleted, onSuccess, updateTransactionStatus, data]);

  // Track transaction errors
  useEffect(() => {
    if (error) {
      updateTransactionStatus(hash, 'failed');
      trackError(error, { method, hash });
      if (onError) onError(error);
    }
  }, [error, method, hash, trackError, onError, updateTransactionStatus]);

  return null; // This is a utility component that doesn't render anything
}

export default TransactionTracker;
