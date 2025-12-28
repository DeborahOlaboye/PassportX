'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWalletConnect, ConnectedWallet } from '@/contexts/WalletConnectContext';
import QRCodeDisplay from './QRCodeDisplay';
import MobileWalletSelector from './MobileWalletSelector';

interface WalletSelectorProps {
  onClose: () => void;
}

const SUPPORTED_WALLETS = [
  {
    id: 'xverse',
    name: 'Xverse',
    icon: '🔷',
    description: 'Popular Stacks wallet',
  },
  {
    id: 'hiro',
    name: 'Hiro Wallet',
    icon: '🔶',
    description: 'Official Stacks wallet',
  },
  {
    id: 'leather',
    name: 'Leather',
    icon: '🟫',
    description: 'Bitcoin-native wallet',
  },
];

export default function WalletSelector({ onClose }: WalletSelectorProps) {
  const { connectWallet, isConnecting } = useWalletConnect();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent));
    };

    checkMobile();
  }, []);

  // Use mobile-optimized selector for mobile devices
  if (isMobile) {
    return <MobileWalletSelector onClose={onClose} />;
  }

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);

    const wallet = SUPPORTED_WALLETS.find((w) => w.id === walletId);
    if (!wallet) return;

    try {
      const connectedWallet: ConnectedWallet = {
        address: `0x${'0'.repeat(40)}`, // Placeholder
        name: wallet.name,
        chainId: 5050, // Stacks chainId
        sessionTopic: `session_${Date.now()}`,
      };

      await connectWallet(connectedWallet);
      onClose();
    } catch (error) {
      console.error('Wallet selection failed:', error);
      setSelectedWallet(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Select Wallet</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {showQR ? (
            <QRCodeDisplay
              onBack={() => setShowQR(false)}
              onClose={onClose}
            />
          ) : (
            <>
              <div className="space-y-3">
                {SUPPORTED_WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletSelect(wallet.id)}
                    disabled={isConnecting || selectedWallet === wallet.id}
                    className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{wallet.name}</p>
                        <p className="text-sm text-gray-500">{wallet.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => setShowQR(true)}
                  className="w-full px-4 py-2 text-sm text-center text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Connect via QR Code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
