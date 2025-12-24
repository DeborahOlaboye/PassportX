'use client';

import React, { useState } from 'react';
import { useMultiAccount } from '@/contexts/MultiAccountContext';
import { ChevronDown, Plus, Copy, Check } from 'lucide-react';

interface AccountSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  maxDisplay?: number;
  className?: string;
}

export default function AccountSelector({
  isOpen = false,
  onClose,
  maxDisplay = 5,
  className = '',
}: AccountSelectorProps) {
  const { state, switchAccount, filterAccounts } = useMultiAccount();
  const [copied, setCopied] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(isOpen);

  const sortedAccounts = filterAccounts({ sortBy: 'recent' });
  const displayAccounts = sortedAccounts.slice(0, maxDisplay);
  const hasMore = sortedAccounts.length > maxDisplay;

  const handleAccountSwitch = async (address: string) => {
    try {
      await switchAccount(address, 'user');
      setIsDropdownOpen(false);
      onClose?.();
    } catch (error) {
      console.error('Failed to switch account:', error);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!state.accounts || state.accounts.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-700">
          {state.activeAccount?.name || shortAddress(state.activeAccount?.address || '')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase px-2 py-1">
              Connected Accounts ({state.accounts.length})
            </p>

            {displayAccounts.map((account) => (
              <button
                key={account.address}
                onClick={() => handleAccountSwitch(account.address)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  state.activeAccount?.address === account.address
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {account.name || account.metadata?.displayName || shortAddress(account.address)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{shortAddress(account.address)}</p>
                </div>

                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  {state.activeAccount?.address === account.address && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAddress(account.address);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied === account.address ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </button>
            ))}

            {hasMore && (
              <button
                className="w-full px-3 py-2 text-xs text-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                View {sortedAccounts.length - maxDisplay} more accounts
              </button>
            )}

            <div className="border-t border-gray-200 pt-2 mt-2">
              <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
