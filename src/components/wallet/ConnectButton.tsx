'use client';

import React, { useState } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useWalletConnect } from '@/contexts/WalletConnectContext';
import WalletSelector from './WalletSelector';

export default function ConnectButton() {
  const { isConnected, isConnecting, connectedWallet, disconnectWallet } = useWalletConnect();
  const [showSelector, setShowSelector] = useState(false);

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  if (isConnected && connectedWallet) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isConnecting}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowSelector(true)}
        disabled={isConnecting}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {showSelector && <WalletSelector onClose={() => setShowSelector(false)} />}
    </>
  );
}
