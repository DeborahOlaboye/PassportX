'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Copy, Check } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';
import { initiateMobileWalletConnection, waitForMobileWalletResponse, MobileWalletResponse } from '@/utils/mobileWalletResponseHandler';
import { openMobileWallet } from '@/utils/stacksWalletConnect';
import { trackMobileWalletConnectionAttempt, trackMobileWalletConnectionSuccess, trackMobileWalletConnectionFailure } from '@/utils/mobileWalletAnalytics';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

interface MobileWalletSelectorProps {
  onClose: () => void;
}

const MOBILE_WALLETS = [
  {
    id: 'xverse' as const,
    name: 'Xverse',
    icon: '🔷',
    description: 'Popular Stacks wallet with mobile app',
    mobileUrl: 'https://xverse.app',
    deepLink: 'xverse://',
  },
  {
    id: 'hiro' as const,
    name: 'Hiro Wallet',
    icon: '🔶',
    description: 'Official Stacks wallet by Hiro',
    mobileUrl: 'https://wallet.hiro.so',
    deepLink: 'hiro://',
  },
  {
    id: 'leather' as const,
    name: 'Leather',
    icon: '🟫',
    description: 'Bitcoin-native wallet with Stacks support',
    mobileUrl: 'https://leather.io',
    deepLink: 'leather://',
  },
];

export default function MobileWalletSelector({ onClose }: MobileWalletSelectorProps) {
  const { connectWallet, isConnecting } = useWalletConnect();
  const [isMobile, setIsMobile] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
  }, []);

  const handleWalletSelect = async (walletId: string) => {
    setConnectingWallet(walletId);
    setConnectionStatus('connecting');
    setErrorMessage('');

    const sessionId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Track connection attempt
      trackMobileWalletConnectionAttempt(walletId as 'xverse' | 'hiro' | 'leather', sessionId);

      const wallet = MOBILE_WALLETS.find(w => w.id === walletId);
      if (!wallet) throw new Error('Wallet not found');

      if (isMobile) {
        // Generate WalletConnect URI
        const config = {
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'passportx_walletconnect_project',
          relayUrl: 'wss://relay.walletconnect.org',
          metadata: {
            name: 'PassportX',
            description: 'Decentralized Achievement Passport',
            url: window.location.origin,
            icons: [`${window.location.origin}/icon.png`],
          },
          requiredNamespaces: {
            stacks: {
              methods: ['stacks_signMessage', 'stacks_signTransaction', 'stacks_getAccounts'],
              chains: ['stacks:1'],
              events: ['accountsChanged'],
            },
          },
        };

        const sessionTopic = `stacks_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const uri = `wc:${sessionTopic}@2?relay-protocol=irn&symKey=${generateSymKey()}&projectId=${config.projectId}`;

        // Initiate connection
        const requestId = initiateMobileWalletConnection(uri, wallet.id);

        // Open mobile wallet
        openMobileWallet(wallet.id, uri);

        // Wait for response
        const response = await waitForMobileWalletResponse(requestId, 60000); // 60 second timeout

        if (response.success && response.data) {
          // Track success
          trackMobileWalletConnectionSuccess(walletId as 'xverse' | 'hiro' | 'leather', sessionId);

          // Connect to the app
          const connectedWallet = {
            address: response.data.address || '0x' + '0'.repeat(40),
            name: wallet.name,
            chainId: 1, // Stacks mainnet
            sessionTopic,
          };

          await connectWallet(connectedWallet);
          setConnectionStatus('success');
          setTimeout(() => onClose(), 1500);
        } else {
          throw new Error(response.error || 'Connection failed');
        }
      } else {
        // Desktop: show QR code
        setShowQR(true);
      }
    } catch (error) {
      // Track failure
      trackMobileWalletConnectionFailure(
        walletId as 'xverse' | 'hiro' | 'leather',
        sessionId,
        error instanceof Error ? error.message : 'Unknown error'
      );

      console.error('Wallet connection failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setConnectingWallet(null);
    }
  };

  const generateSymKey = (): string => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleCopyUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URI:', error);
    }
  };

  if (showQR) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <QRCodeDisplay
              onBack={() => setShowQR(false)}
              onClose={onClose}
              preferredWallet={connectingWallet as 'xverse' | 'hiro' | 'leather' | undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Connect Mobile Wallet</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Device Type Indicator */}
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
            {isMobile ? (
              <>
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Mobile device detected</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Desktop device</span>
              </>
            )}
          </div>

          {/* Wallet Options */}
          <div className="space-y-3">
            {MOBILE_WALLETS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                disabled={isConnecting || connectingWallet !== null}
                className="w-full p-4 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{wallet.name}</p>
                    <p className="text-sm text-gray-500">{wallet.description}</p>
                  </div>
                  {connectingWallet === wallet.id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Connection Status */}
          {connectionStatus !== 'idle' && (
            <div className={`p-3 rounded-lg ${
              connectionStatus === 'success'
                ? 'bg-green-50 border border-green-200'
                : connectionStatus === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connecting' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                )}
                <span className={`text-sm font-medium ${
                  connectionStatus === 'success'
                    ? 'text-green-800'
                    : connectionStatus === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}>
                  {connectionStatus === 'connecting' && 'Connecting...'}
                  {connectionStatus === 'success' && 'Connected successfully!'}
                  {connectionStatus === 'error' && `Connection failed: ${errorMessage}`}
                </span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {isMobile ? (
                <>
                  <li>• Tap a wallet to open the app</li>
                  <li>• Approve the connection in your wallet</li>
                  <li>• Return to PassportX when done</li>
                </>
              ) : (
                <>
                  <li>• Click a wallet to show QR code</li>
                  <li>• Scan with your mobile wallet</li>
                  <li>• Approve the connection</li>
                </>
              )}
            </ul>
          </div>

          {/* Alternative Options */}
          <div className="pt-4 border-t space-y-2">
            <button
              onClick={() => setShowQR(true)}
              className="w-full px-4 py-2 text-sm text-center text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              Show QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}