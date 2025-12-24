import { useEffect } from 'react';
import { useAccount, useWaitForTransaction } from 'wagmi';
import { useAnalytics } from '@/hooks/useAnalytics';

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

  const { isSuccess, error } = useWaitForTransaction({
    hash,
    confirmations: 1,
    enabled: !!hash,
  });

  // Track transaction success
  useEffect(() => {
    if (isConnected && hash && isSuccess) {
      trackTransactionCompleted(hash, method);
      if (onSuccess) onSuccess();
    }
  }, [isSuccess, hash, method, isConnected, trackTransactionCompleted, onSuccess]);

  // Track transaction errors
  useEffect(() => {
    if (error) {
      trackError(error, { method, hash });
      if (onError) onError(error);
    }
  }, [error, method, hash, trackError, onError]);

  return null; // This is a utility component that doesn't render anything
}

export default TransactionTracker;
