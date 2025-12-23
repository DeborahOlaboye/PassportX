'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

export default function AccountDisplay() {
  const { connectedWallet, isConnected } = useWalletConnect();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !connectedWallet) {
    return null;
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(connectedWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const displayAddress = `${connectedWallet.address.slice(0, 6)}...${connectedWallet.address.slice(-4)}`;

  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-600 font-medium">Connected Account</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{connectedWallet.name}</p>
        <p className="text-xs text-gray-500">{displayAddress}</p>
      </div>

      <button
        onClick={handleCopyAddress}
        className="flex-shrink-0 p-2 text-gray-600 hover:bg-blue-200 hover:text-blue-700 rounded transition-colors"
        title={copied ? 'Copied!' : 'Copy address'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
