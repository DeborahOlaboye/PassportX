'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Smartphone,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
  category: 'general' | 'troubleshooting' | 'security' | 'compatibility';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-mobile-wallet',
    question: 'What is mobile wallet connection?',
    answer: (
      <div className="space-y-2">
        <p>
          Mobile wallet connection allows you to link your mobile cryptocurrency wallet
          (like Xverse, Hiro, or Leather) to PassportX using WalletConnect protocol.
          This enables secure blockchain interactions without exposing your private keys.
        </p>
        <p>
          The connection is temporary and can be revoked at any time from your wallet app.
        </p>
      </div>
    ),
    category: 'general',
  },
  {
    id: 'supported-wallets',
    question: 'Which mobile wallets are supported?',
    answer: (
      <div className="space-y-3">
        <p>PassportX supports the following mobile wallets:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🔷</span>
            <div>
              <div className="font-medium">Xverse</div>
              <div className="text-sm text-gray-600">iOS & Android</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🔶</span>
            <div>
              <div className="font-medium">Hiro Wallet</div>
              <div className="text-sm text-gray-600">iOS & Android</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-2xl">🟫</span>
            <div>
              <div className="font-medium">Leather</div>
              <div className="text-sm text-gray-600">iOS & Android</div>
            </div>
          </div>
        </div>
      </div>
    ),
    category: 'compatibility',
  },
  {
    id: 'qr-code-expiry',
    question: 'How long does the QR code last?',
    answer: (
      <div className="space-y-2">
        <p>
          QR codes are valid for <strong>5 minutes</strong> after generation.
          After this time, you'll need to generate a new QR code for security reasons.
        </p>
        <p>
          If the connection times out, simply click "Try Again" to generate a fresh QR code.
        </p>
      </div>
    ),
    category: 'general',
  },
  {
    id: 'connection-fails',
    question: 'What if the connection fails?',
    answer: (
      <div className="space-y-3">
        <p>Try these troubleshooting steps:</p>
        <ol className="list-decimal list-inside space-y-2 ml-4">
          <li>Ensure your mobile wallet app is updated to the latest version</li>
          <li>Check that you have a stable internet connection</li>
          <li>Make sure camera permissions are enabled for QR scanning</li>
          <li>Try closing and reopening both the wallet app and browser</li>
          <li>Clear your browser cache and try again</li>
          <li>Try using a different browser or device</li>
        </ol>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              If problems persist, contact our support team with details about your device and wallet.
            </p>
          </div>
        </div>
      </div>
    ),
    category: 'troubleshooting',
  },
  {
    id: 'is-it-secure',
    question: 'Is mobile wallet connection secure?',
    answer: (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Yes, it's very secure!</h4>
            <p className="text-sm text-gray-600">
              Mobile wallet connections use industry-standard encryption and the WalletConnect protocol.
              Your private keys never leave your mobile wallet.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Security features:</h4>
          <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>End-to-end encryption between your wallet and PassportX</li>
            <li>Temporary connections that expire automatically</li>
            <li>No storage of sensitive data on our servers</li>
            <li>You can revoke connections anytime from your wallet</li>
            <li>All transactions require explicit approval on your mobile device</li>
          </ul>
        </div>
      </div>
    ),
    category: 'security',
  },
  {
    id: 'network-requirements',
    question: 'Do I need internet to connect?',
    answer: (
      <div className="space-y-2">
        <p>
          <strong>Yes, internet connection is required</strong> for the initial connection process.
          Both your computer/browser and mobile device need to be online.
        </p>
        <p>
          Once connected, some features may work offline depending on your wallet's capabilities,
          but most blockchain interactions require internet connectivity.
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wifi className="w-4 h-4" />
          <span>Stable internet recommended for best experience</span>
        </div>
      </div>
    ),
    category: 'general',
  },
  {
    id: 'multiple-devices',
    question: 'Can I connect from multiple devices?',
    answer: (
      <div className="space-y-2">
        <p>
          You can connect the same wallet to multiple devices or browsers simultaneously.
          Each connection is independent and can be managed separately from your wallet app.
        </p>
        <p>
          However, for security reasons, we recommend limiting connections to devices you actively use.
        </p>
      </div>
    ),
    category: 'general',
  },
  {
    id: 'disconnect-wallet',
    question: 'How do I disconnect my wallet?',
    answer: (
      <div className="space-y-3">
        <p>You can disconnect your wallet in two ways:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="font-medium">From Wallet App</span>
            </div>
            <p className="text-sm text-gray-600">
              Open your mobile wallet app, go to settings or connected apps,
              and disconnect PassportX.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">From PassportX</span>
            </div>
            <p className="text-sm text-gray-600">
              Use the wallet disconnect option in your PassportX account settings.
            </p>
          </div>
        </div>
      </div>
    ),
    category: 'general',
  },
  {
    id: 'connection-timeout',
    question: 'What happens if connection times out?',
    answer: (
      <div className="space-y-2">
        <p>
          If the connection process takes longer than 5 minutes, it will timeout for security reasons.
          This is normal and helps protect against potential security issues.
        </p>
        <p>
          Simply click "Try Again" to generate a new QR code and restart the connection process.
          Your previous connection attempts are automatically cleaned up.
        </p>
      </div>
    ),
    category: 'troubleshooting',
  },
  {
    id: 'data-collection',
    question: 'What data is collected during connection?',
    answer: (
      <div className="space-y-3">
        <p>
          We collect minimal data necessary for the connection to function:
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm">Wallet address (public information only)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm">Connection timestamp and duration</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm">Device type (for compatibility)</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm">Private keys or sensitive wallet data</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          All data is encrypted and used only to provide the service.
          You can opt out of analytics in your settings.
        </p>
      </div>
    ),
    category: 'security',
  },
];

const CATEGORIES = {
  general: { label: 'General', color: 'bg-blue-100 text-blue-800' },
  troubleshooting: { label: 'Troubleshooting', color: 'bg-orange-100 text-orange-800' },
  security: { label: 'Security', color: 'bg-green-100 text-green-800' },
  compatibility: { label: 'Compatibility', color: 'bg-purple-100 text-purple-800' },
};

export default function MobileWalletFAQ() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQItem['category']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredItems = FAQ_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Mobile Wallet FAQ</h2>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as FAQItem['category'])}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : `${config.color} hover:opacity-80`
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No FAQ items found matching your search.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const categoryConfig = CATEGORIES[item.category];

            return (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.color}`}>
                      {categoryConfig.label}
                    </span>
                    <span className="font-medium text-gray-900">{item.question}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 text-gray-700">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Still have questions?</h4>
            <p className="text-sm text-blue-700 mb-2">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex gap-3">
              <a
                href="https://discord.gg/passportx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Join Discord Community
              </a>
              <a
                href="mailto:support@passportx.app"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}