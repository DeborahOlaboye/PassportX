'use client';

import React, { useState } from 'react';
import { useMultiAccount } from '@/contexts/MultiAccountContext';
import { X, Plus } from 'lucide-react';
import AccountList from './AccountList';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function AccountManagementModal({
  isOpen,
  onClose,
  title = 'Manage Accounts',
}: AccountManagementModalProps) {
  const { state } = useMultiAccount();
  const [selectedTab, setSelectedTab] = useState<'accounts' | 'settings'>('accounts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setSelectedTab('accounts')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              selectedTab === 'accounts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Accounts ({state.accounts.length})
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              selectedTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'accounts' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Manage your connected accounts and switch between them
                </p>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Connect Account</span>
                </button>
              </div>

              <AccountList showActions={true} />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={state.preferences.hideBalances}
                      className="w-4 h-4 rounded border-gray-300"
                      disabled
                    />
                    <span className="text-sm text-gray-700">Hide balance amounts</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort Accounts By
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                      <option value="recent">Recent Activity</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="balance">Balance</option>
                      <option value="custom">Custom Order</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Export Account Data
                    </h4>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                      Export Accounts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
