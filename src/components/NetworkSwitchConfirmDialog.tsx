import React, { useState } from 'react';
import { NetworkType } from '@/types/network';

interface NetworkSwitchConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetNetwork: NetworkType;
  currentNetwork: NetworkType;
}

export const NetworkSwitchConfirmDialog: React.FC<NetworkSwitchConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetNetwork,
  currentNetwork,
}) => {
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSwitching(true);
    try {
      await onConfirm();
    } finally {
      setIsSwitching(false);
      onClose();
    }
  };

  const getNetworkDisplayName = (network: NetworkType) => {
    return network === 'mainnet' ? 'Stacks Mainnet' : 'Stacks Testnet';
  };

  const getNetworkColor = (network: NetworkType) => {
    return network === 'mainnet' ? 'text-red-600' : 'text-blue-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">
            Switch Network
          </h3>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">
            You are about to switch from{' '}
            <span className={`font-semibold ${getNetworkColor(currentNetwork)}`}>
              {getNetworkDisplayName(currentNetwork)}
            </span>{' '}
            to{' '}
            <span className={`font-semibold ${getNetworkColor(targetNetwork)}`}>
              {getNetworkDisplayName(targetNetwork)}
            </span>
            .
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>All transaction history will be cleared</li>
                    <li>Application cache will be reset</li>
                    <li>You may need to reconnect your wallet</li>
                    <li>Contract addresses will update automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSwitching}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSwitching}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSwitching ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Switching...
              </div>
            ) : (
              `Switch to ${getNetworkDisplayName(targetNetwork)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};