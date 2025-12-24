'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Copy, Check, Smartphone, ExternalLink, Share2 } from 'lucide-react';
import { createStacksWalletConfig, createWalletConnectUri, getMobileWalletDeepLinks, openMobileWallet } from '@/utils/stacksWalletConnect';
import { optimizeQRCodeForMobile, shareWalletConnection, vibrateDevice } from '@/utils/mobileUXOptimizer';

interface QRCodeDisplayProps {
  onBack: () => void;
  onClose: () => void;
  preferredWallet?: 'xverse' | 'hiro' | 'leather';
}

export default function QRCodeDisplay({ onBack, onClose, preferredWallet }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sessionUri, setSessionUri] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'xverse' | 'hiro' | 'leather' | null>(preferredWallet || null);
  const qrCodeRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Detect if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      setIsMobile(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent));
    };

    checkMobile();
    generateQRCode();
  }, []);

  useEffect(() => {
    // Optimize QR code for mobile when it's rendered
    if (qrCodeRef.current && qrCode) {
      optimizeQRCodeForMobile(qrCodeRef.current);
    }
  }, [qrCode]);

  const generateQRCode = async () => {
    try {
      const config = createStacksWalletConfig();
      const topic = `stacks_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionTopic(topic);

      const uri = createWalletConnectUri(topic, config);
      setSessionUri(uri);

      const qrCode = require('qrcode');
      const qrDataUrl = await qrCode.toDataURL(uri, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrCode(qrDataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      return '';
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleWalletSelect = (wallet: 'xverse' | 'hiro' | 'leather') => {
    setSelectedWallet(wallet);
    vibrateDevice(50); // Haptic feedback
    openMobileWallet(wallet, sessionUri);
  };

  const handleShare = async () => {
    try {
      await shareWalletConnection(sessionUri);
      vibrateDevice([50, 50, 50]); // Success vibration pattern
    } catch (error) {
      // Fallback: copy to clipboard
      await handleCopy();
    }
  };

  const wallets = [
    { id: 'xverse' as const, name: 'Xverse', icon: '🔷', description: 'Popular Stacks wallet' },
    { id: 'hiro' as const, name: 'Hiro Wallet', icon: '🔶', description: 'Official Stacks wallet' },
    { id: 'leather' as const, name: 'Leather', icon: '🟫', description: 'Bitcoin-native wallet' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-lg">Connect Mobile Wallet</h3>
      </div>

      {/* QR Code Section */}
      <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center space-y-4">
        {qrCode ? (
          <img
            ref={qrCodeRef}
            src={qrCode}
            alt="WalletConnect QR Code"
            className="w-72 h-72 border-4 border-white rounded-lg shadow-sm"
          />
        ) : (
          <div className="w-72 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Generating QR code...</span>
          </div>
        )}

        <p className="text-sm text-gray-600 text-center max-w-xs">
          Scan this QR code with your mobile wallet to connect securely
        </p>

        {isMobile && (
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Connection
          </button>
        )}
      </div>

      {/* Mobile Wallet Buttons */}
      {isMobile && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Open in Wallet App
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                className="w-full p-3 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{wallet.name}</p>
                    <p className="text-sm text-gray-500">{wallet.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Connection URI Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Connection URI</label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={sessionUri}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 truncate"
          />
          <button
            onClick={handleCopy}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Copy this URI if you prefer to paste it manually into your wallet
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-2">How to connect:</h5>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Open your mobile wallet app</li>
          <li>Look for the WalletConnect option</li>
          <li>Scan the QR code or paste the URI</li>
          <li>Approve the connection in your wallet</li>
        </ol>
      </div>

      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
