'use client';

import { useState } from 'react';
import { useTransactionSigning } from '@/contexts/TransactionSigningContext';
import { TransactionRequest } from '@/types/transaction-signing';

interface STXTransferProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function STXTransfer({ onSuccess, onError }: STXTransferProps) {
  const { signTransaction, broadcastTransaction, estimateGas, isSigning } = useTransactionSigning();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleEstimateGas = async () => {
    if (!recipient || !amount) return;

    setIsEstimating(true);
    try {
      const request: TransactionRequest = {
        type: 'stx-transfer',
        recipient,
        amount,
        memo,
      };
      const estimate = await estimateGas(request);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount) return;

    try {
      const request: TransactionRequest = {
        type: 'stx-transfer',
        recipient,
        amount,
        memo,
      };

      const signedTx = await signTransaction(request);
      await broadcastTransaction(signedTx);

      if (onSuccess && signedTx.hash) {
        onSuccess(signedTx.hash);
      }

      // Reset form
      setRecipient('');
      setAmount('');
      setMemo('');
      setGasEstimate(null);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">STX Transfer</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="SP2QVPXEWYQFT45C84WXNHQ67GVJHQ7XQEQD35Z4K"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (STX)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            step="0.000001"
            min="0"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Memo (Optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Transaction memo"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleEstimateGas}
            disabled={!recipient || !amount || isEstimating}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {isEstimating ? 'Estimating...' : 'Estimate Gas'}
          </button>

          <button
            onClick={handleTransfer}
            disabled={!recipient || !amount || isSigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSigning ? 'Signing...' : 'Transfer STX'}
          </button>
        </div>

        {gasEstimate && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">Gas Estimate</h4>
            <div className="text-sm space-y-1">
              <div>Base Fee: {gasEstimate.breakdown.base} microSTX</div>
              <div>Priority Fee: {gasEstimate.breakdown.priority} microSTX</div>
              <div className="font-semibold">Total: {gasEstimate.total} microSTX</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}