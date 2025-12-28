'use client';

import { useState } from 'react';
import { useTransactionSigning } from '@/contexts/TransactionSigningContext';
import { TransactionRequest } from '@/types/transaction-signing';

interface CommunityContractCallProps {
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function CommunityContractCall({ onSuccess, onError }: CommunityContractCallProps) {
  const { signTransaction, broadcastTransaction, estimateGas, isSigning } = useTransactionSigning();
  const [functionName, setFunctionName] = useState('join-community');
  const [communityId, setCommunityId] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleEstimateGas = async () => {
    setIsEstimating(true);
    try {
      const request = buildTransactionRequest();
      const estimate = await estimateGas(request);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  const buildTransactionRequest = (): TransactionRequest => {
    const baseRequest: TransactionRequest = {
      type: 'contract-call',
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'community-manager',
      functionName,
    };

    switch (functionName) {
      case 'join-community':
        return {
          ...baseRequest,
          functionArgs: [communityId, userAddress],
        };
      case 'leave-community':
        return {
          ...baseRequest,
          functionArgs: [communityId, userAddress],
        };
      case 'create-community':
        return {
          ...baseRequest,
          functionArgs: [communityId],
        };
      case 'update-community':
        return {
          ...baseRequest,
          functionArgs: [communityId],
        };
      default:
        return baseRequest;
    }
  };

  const handleContractCall = async () => {
    try {
      const request = buildTransactionRequest();
      const signedTx = await signTransaction(request);
      await broadcastTransaction(signedTx);

      if (onSuccess && signedTx.hash) {
        onSuccess(signedTx.hash);
      }

      // Reset form
      setCommunityId('');
      setUserAddress('');
      setGasEstimate(null);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Community Contract Call</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Function
          </label>
          <select
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="join-community">Join Community</option>
            <option value="leave-community">Leave Community</option>
            <option value="create-community">Create Community</option>
            <option value="update-community">Update Community</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Community ID
          </label>
          <input
            type="text"
            value={communityId}
            onChange={(e) => setCommunityId(e.target.value)}
            placeholder="Community ID"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        {(functionName === 'join-community' || functionName === 'leave-community') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Address
            </label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="User address"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={handleEstimateGas}
            disabled={isEstimating}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {isEstimating ? 'Estimating...' : 'Estimate Gas'}
          </button>

          <button
            onClick={handleContractCall}
            disabled={!communityId || ((functionName === 'join-community' || functionName === 'leave-community') && !userAddress) || isSigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSigning ? 'Signing...' : 'Execute Call'}
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