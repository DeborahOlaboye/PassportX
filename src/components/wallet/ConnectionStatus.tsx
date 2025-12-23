'use client';

import React from 'react';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

export default function ConnectionStatus() {
  const { isConnected, isConnecting, connectedWallet, error } = useWalletConnect();

  if (isConnecting) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-yellow-700 font-medium">Connecting...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-700 font-medium truncate">{error}</span>
      </div>
    );
  }

  if (isConnected && connectedWallet) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-green-700 font-medium">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-sm text-gray-600 font-medium">Disconnected</span>
    </div>
  );
}
