'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check } from 'lucide-react';

interface QRCodeDisplayProps {
  onBack: () => void;
  onClose: () => void;
}

export default function QRCodeDisplay({ onBack, onClose }: QRCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sessionUri, setSessionUri] = useState('');

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const uri = generateWalletConnectUri();
      setSessionUri(uri);

      const qrCanvas = await generateQRCodeImage(uri);
      setQrCode(qrCanvas);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const generateWalletConnectUri = (): string => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default_project_id';
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return `wc:${sessionId}@2?bridge=https://bridge.walletconnect.org&key=placeholder_key&projectId=${projectId}`;
  };

  const generateQRCodeImage = async (text: string): Promise<string> => {
    try {
      const qrCode = require('qrcode');
      return await qrCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">Scan with Mobile Wallet</h3>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center space-y-4">
        {qrCode ? (
          <img
            src={qrCode}
            alt="WalletConnect QR Code"
            className="w-72 h-72 border-4 border-white rounded-lg shadow-sm"
          />
        ) : (
          <div className="w-72 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Generating QR code...</span>
          </div>
        )}

        <p className="text-sm text-gray-600 text-center">
          Use your mobile wallet to scan this QR code
        </p>
      </div>

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
