'use client';

import React, { useState } from 'react';
import { useMultiAccount } from '@/contexts/MultiAccountContext';
import { Account, AccountSortOption } from '@/types/multi-account';
import { Copy, Check, Trash2, Star } from 'lucide-react';

interface AccountListProps {
  sortBy?: AccountSortOption;
  onAccountSelect?: (account: Account) => void;
  maxHeight?: string;
  className?: string;
  showActions?: boolean;
}

export default function AccountList({
  sortBy = 'recent',
  onAccountSelect,
  maxHeight = 'max-h-96',
  className = '',
  showActions = true,
}: AccountListProps) {
  const { state, switchAccount, removeAccount, updateAccountSettings, filterAccounts } =
    useMultiAccount();
  const [copied, setCopied] = useState<string | null>(null);

  const accounts = filterAccounts({ sortBy });

  const handleAccountClick = async (account: Account) => {
    await switchAccount(account.address, 'user');
    onAccountSelect?.(account);
  };

  const handleRemove = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this account?')) {
      await removeAccount(address);
    }
  };

  const handlePin = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    const account = state.accounts.find((a) => a.address === address);
    if (account) {
      const currentSettings = state.preferences.accounts[address] || {};
      await updateAccountSettings(address, {
        ...currentSettings,
        pinned: !currentSettings.pinned,
      });
    }
  };

  const handleCopy = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (accounts.length === 0) {
    return (
      <div className={`flex items-center justify-center p-6 text-gray-500 ${className}`}>
        <p>No accounts available</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`overflow-y-auto ${maxHeight} space-y-2`}>
        {accounts.map((account) => (
          <button
            key={account.address}
            onClick={() => handleAccountClick(account)}
            className={`w-full p-4 rounded-lg border transition-all text-left ${
              state.activeAccount?.address === account.address
                ? 'bg-blue-50 border-blue-200 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {account.name || account.metadata?.displayName || shortAddress(account.address)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{shortAddress(account.address)}</p>

                {account.balance && (
                  <p className="text-sm text-gray-700 mt-2">
                    Balance: <span className="font-medium">{account.balance}</span>
                  </p>
                )}
              </div>

              {state.activeAccount?.address === account.address && (
                <div className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Active
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => handleCopy(e, account.address)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Copy address"
                >
                  {copied === account.address ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={(e) => handlePin(e, account.address)}
                  className={`p-1 rounded transition-colors ${
                    state.preferences.accounts[account.address]?.pinned
                      ? 'text-yellow-500'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Pin account"
                >
                  <Star className="w-4 h-4" fill="currentColor" />
                </button>

                <div className="flex-1"></div>

                <button
                  onClick={(e) => handleRemove(e, account.address)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                  title="Remove account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
