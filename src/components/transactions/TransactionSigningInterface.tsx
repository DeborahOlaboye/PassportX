'use client';

import { useState } from 'react';
import { STXTransfer } from './STXTransfer';
import { BadgeContractCall } from './BadgeContractCall';
import { CommunityContractCall } from './CommunityContractCall';
import { useTransactionSigning } from '@/contexts/TransactionSigningContext';

type TransactionType = 'stx-transfer' | 'badge-call' | 'community-call';

export function TransactionSigningInterface() {
  const [activeTab, setActiveTab] = useState<TransactionType>('stx-transfer');
  const { currentRequest, isSigning, signedTransactions } = useTransactionSigning();

  const handleSuccess = (hash: string) => {
    console.log('Transaction successful:', hash);
    // Could show a success notification here
  };

  const handleError = (error: Error) => {
    console.error('Transaction failed:', error);
    // Could show an error notification here
  };

  const tabs = [
    { id: 'stx-transfer' as const, label: 'STX Transfer', component: STXTransfer },
    { id: 'badge-call' as const, label: 'Badge Contract', component: BadgeContractCall },
    { id: 'community-call' as const, label: 'Community Contract', component: CommunityContractCall },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || STXTransfer;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <ActiveComponent onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>

      {/* Current Transaction Status */}
      {currentRequest && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Current Transaction</h4>
          <div className="text-sm text-blue-800">
            <div>Type: {currentRequest.type}</div>
            {currentRequest.recipient && <div>Recipient: {currentRequest.recipient}</div>}
            {currentRequest.amount && <div>Amount: {currentRequest.amount} STX</div>}
            {currentRequest.functionName && <div>Function: {currentRequest.functionName}</div>}
            <div className="mt-2">
              Status: {isSigning ? 'Signing...' : 'Processing'}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {signedTransactions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {signedTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium">{tx.request.type}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    tx.status === 'confirmed' ? 'text-green-600' :
                    tx.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {tx.status}
                  </div>
                  {tx.hash && (
                    <div className="text-xs text-gray-500">
                      {tx.hash.slice(0, 10)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}