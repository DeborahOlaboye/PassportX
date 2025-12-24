'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Trash2,
  Download,
  Filter
} from 'lucide-react';

interface ConnectionRecord {
  id: string;
  walletName: string;
  walletType: 'xverse' | 'hiro' | 'leather' | 'other';
  status: 'success' | 'failed' | 'timeout' | 'cancelled';
  timestamp: Date;
  duration: number; // in seconds
  deviceInfo: {
    platform: 'ios' | 'android' | 'desktop';
    userAgent: string;
  };
  errorMessage?: string;
  sessionId?: string;
}

interface MobileWalletConnectionHistoryProps {
  onClearHistory?: () => void;
  onExportHistory?: () => void;
  maxRecords?: number;
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Success',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Failed',
  },
  timeout: {
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Timeout',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Cancelled',
  },
};

const WALLET_ICONS = {
  xverse: '🔷',
  hiro: '🔶',
  leather: '🟫',
  other: '👛',
};

const PLATFORM_ICONS = {
  ios: '🍎',
  android: '🤖',
  desktop: '💻',
};

// Mock data for demonstration - in real app, this would come from localStorage or API
const MOCK_HISTORY: ConnectionRecord[] = [
  {
    id: '1',
    walletName: 'Xverse',
    walletType: 'xverse',
    status: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    duration: 45,
    deviceInfo: {
      platform: 'ios',
      userAgent: 'Mobile Safari',
    },
    sessionId: 'wc_123456',
  },
  {
    id: '2',
    walletName: 'Hiro Wallet',
    walletType: 'hiro',
    status: 'failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    duration: 120,
    deviceInfo: {
      platform: 'android',
      userAgent: 'Chrome Mobile',
    },
    errorMessage: 'Connection rejected by user',
  },
  {
    id: '3',
    walletName: 'Leather',
    walletType: 'leather',
    status: 'timeout',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    duration: 300,
    deviceInfo: {
      platform: 'desktop',
      userAgent: 'Chrome',
    },
  },
];

export default function MobileWalletConnectionHistory({
  onClearHistory,
  onExportHistory,
  maxRecords = 50,
}: MobileWalletConnectionHistoryProps) {
  const [history, setHistory] = useState<ConnectionRecord[]>(MOCK_HISTORY);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mobileWalletHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
        }));
        setHistory(parsed);
      } catch (error) {
        console.error('Failed to load wallet history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mobileWalletHistory', JSON.stringify(history));
  }, [history]);

  const filteredHistory = history.filter(record =>
    filter === 'all' || record.status === filter
  );

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all connection history?')) {
      setHistory([]);
      onClearHistory?.();
    }
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `wallet-history-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    onExportHistory?.();
  };

  const successCount = history.filter(r => r.status === 'success').length;
  const failureCount = history.filter(r => r.status === 'failed').length;
  const totalConnections = history.length;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Connection History</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          <button
            onClick={handleExportHistory}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalConnections}</div>
          <div className="text-sm text-blue-700">Total Connections</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successCount}</div>
          <div className="text-sm text-green-700">Successful</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{failureCount}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              All ({totalConnections})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'success' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Success ({successCount})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-sm rounded ${
                filter === 'failed' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Failed ({failureCount})
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No connection history found</p>
            <p className="text-sm">Your mobile wallet connections will appear here</p>
          </div>
        ) : (
          filteredHistory.map((record) => {
            const statusConfig = STATUS_CONFIG[record.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg">{WALLET_ICONS[record.walletType]}</span>
                    <div>
                      <div className="font-medium text-gray-900">{record.walletName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>{PLATFORM_ICONS[record.deviceInfo.platform]}</span>
                        <span>{formatTimestamp(record.timestamp)}</span>
                        <span>•</span>
                        <span>{formatDuration(record.duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </div>
                  {record.errorMessage && (
                    <div className="text-xs text-red-500 mt-1 max-w-32 truncate">
                      {record.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
          Showing {filteredHistory.length} of {totalConnections} connections
        </div>
      )}
    </div>
  );
}