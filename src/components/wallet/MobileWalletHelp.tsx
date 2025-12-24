'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ExternalLink, Smartphone } from 'lucide-react';

interface MobileWalletHelpProps {
  walletType?: 'xverse' | 'hiro' | 'leather';
}

const WALLET_GUIDES = {
  xverse: {
    name: 'Xverse',
    downloadUrl: 'https://www.xverse.app/download',
    setupSteps: [
      'Download Xverse from the App Store or Google Play',
      'Create or import a Stacks wallet',
      'Enable camera permissions for QR scanning',
      'Return to PassportX and scan the QR code',
    ],
    troubleshooting: [
      'Ensure Xverse app is updated to the latest version',
      'Check that camera permissions are enabled',
      'Try closing and reopening the Xverse app',
      'Clear browser cache and try again',
    ],
  },
  hiro: {
    name: 'Hiro Wallet',
    downloadUrl: 'https://wallet.hiro.so',
    setupSteps: [
      'Download Hiro Wallet from the official website',
      'Create a new wallet or restore from seed phrase',
      'Navigate to the WalletConnect section',
      'Scan the QR code or paste the connection URI',
    ],
    troubleshooting: [
      'Ensure you\'re using the official Hiro Wallet app',
      'Check your internet connection',
      'Try restarting both the wallet app and browser',
      'Contact Hiro support if issues persist',
    ],
  },
  leather: {
    name: 'Leather',
    downloadUrl: 'https://leather.io',
    setupSteps: [
      'Download Leather from the official website',
      'Set up your Bitcoin wallet',
      'Enable Stacks integration in settings',
      'Use WalletConnect to connect to dApps',
    ],
    troubleshooting: [
      'Ensure Leather is connected to Stacks network',
      'Check wallet balance and network fees',
      'Try switching between different networks',
      'Update Leather to the latest version',
    ],
  },
};

export default function MobileWalletHelp({ walletType }: MobileWalletHelpProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<'xverse' | 'hiro' | 'leather'>(
    walletType || 'xverse'
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const currentGuide = WALLET_GUIDES[selectedWallet];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Mobile Wallet Setup Guide</h2>
      </div>

      {/* Wallet Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Wallet
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(WALLET_GUIDES).map(([key, guide]) => (
            <button
              key={key}
              onClick={() => setSelectedWallet(key as 'xverse' | 'hiro' | 'leather')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedWallet === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {key === 'xverse' ? '🔷' : key === 'hiro' ? '🔶' : '🟫'}
                </div>
                <div className="text-sm font-medium">{guide.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Download Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Download {currentGuide.name}</h3>
              <p className="text-sm text-blue-700">Get the app to connect your wallet</p>
            </div>
          </div>
          <a
            href={currentGuide.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Download
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('setup')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">Setup Steps</span>
          {expandedSection === 'setup' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSection === 'setup' && (
          <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {currentGuide.setupSteps.map((step, index) => (
                <li key={index} className="text-gray-700">{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Troubleshooting */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('troubleshooting')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="font-medium">Troubleshooting</span>
          {expandedSection === 'troubleshooting' ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSection === 'troubleshooting' && (
          <div className="mt-2 p-4 bg-white border border-gray-200 rounded-lg">
            <ul className="list-disc list-inside space-y-2 text-sm">
              {currentGuide.troubleshooting.map((tip, index) => (
                <li key={index} className="text-gray-700">{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Quick Tips</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Ensure your mobile wallet app is updated</li>
          <li>• Check that you have a stable internet connection</li>
          <li>• Allow camera permissions for QR code scanning</li>
          <li>• Try refreshing the page if connection fails</li>
        </ul>
      </div>

      {/* Support Links */}
      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-sm text-gray-600 mb-2">Need more help?</p>
        <div className="flex justify-center gap-4">
          <a
            href="https://docs.passportx.app/mobile-wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Documentation
          </a>
          <a
            href="https://discord.gg/passportx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}