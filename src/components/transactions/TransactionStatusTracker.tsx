'use client';

import { useEffect, useState } from 'react';
import { SignedTransaction } from '@/types/transaction-signing';
import { TransactionBroadcaster } from '@/utils/transactionBroadcast';

interface TransactionStatusTrackerProps {
  transaction: SignedTransaction;
  onStatusUpdate?: (status: SignedTransaction['status']) => void;
}

export function TransactionStatusTracker({ transaction, onStatusUpdate }: TransactionStatusTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<SignedTransaction['status']>(transaction.status);
  const [confirmations, setConfirmations] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (transaction.hash && (currentStatus === 'broadcasting' || currentStatus === 'pending')) {
      startPolling();
    }
  }, [transaction.hash, currentStatus]);

  const startPolling = async () => {
    if (isPolling) return;

    setIsPolling(true);

    try {
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        if (!transaction.hash) return;

        try {
          const status = await TransactionBroadcaster.getBroadcastStatus(transaction.hash);

          if (status !== currentStatus) {
            setCurrentStatus(status);
            onStatusUpdate?.(status);

            if (status === 'confirmed') {
              setConfirmations(prev => prev + 1);
            }
          }

          // Stop polling if transaction is confirmed or failed
          if (status === 'confirmed' || status === 'failed') {
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        } catch (error) {
          console.error('Error polling transaction status:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsPolling(false);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Failed to start polling:', error);
      setIsPolling(false);
    }
  };

  const getStatusColor = (status: SignedTransaction['status']) => {
    switch (status) {
      case 'signed':
        return 'text-blue-600 bg-blue-100';
      case 'broadcasting':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SignedTransaction['status']) => {
    switch (status) {
      case 'signed':
        return '✍️';
      case 'broadcasting':
        return '📡';
      case 'confirmed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(currentStatus)}</span>
          <span className="font-medium">{transaction.request.type}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentStatus)}`}>
          {currentStatus}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <div>ID: {transaction.id}</div>
        {transaction.hash && (
          <div>Hash: {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}</div>
        )}
        <div>Time: {new Date(transaction.timestamp).toLocaleString()}</div>

        {transaction.request.recipient && (
          <div>To: {transaction.request.recipient.slice(0, 6)}...{transaction.request.recipient.slice(-4)}</div>
        )}

        {transaction.request.amount && (
          <div>Amount: {transaction.request.amount} STX</div>
        )}

        {transaction.request.functionName && (
          <div>Function: {transaction.request.functionName}</div>
        )}

        {currentStatus === 'confirmed' && confirmations > 0 && (
          <div className="text-green-600 font-medium">
            Confirmations: {confirmations}
          </div>
        )}

        {isPolling && (
          <div className="text-blue-600">
            🔄 Monitoring status...
          </div>
        )}

        {transaction.error && (
          <div className="text-red-600 mt-2 p-2 bg-red-50 rounded">
            Error: {transaction.error}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransactionStatusListProps {
  transactions: SignedTransaction[];
}

export function TransactionStatusList({ transactions }: TransactionStatusListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transaction Status</h3>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No transactions to track</p>
      ) : (
        transactions.map((tx) => (
          <TransactionStatusTracker
            key={tx.id}
            transaction={tx}
            onStatusUpdate={(status) => {
              console.log(`Transaction ${tx.id} status updated to: ${status}`);
            }}
          />
        ))
      )}
    </div>
  );
}