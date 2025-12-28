'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Smartphone,
  QrCode,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

interface ConnectionSummary {
  totalConnections: number;
  successfulConnections: number;
  averageConnectionTime: number;
  mostUsedWallet: string;
  lastConnectionDate: Date | null;
  connectionHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function MobileWalletConnectionSummary() {
  const [summary, setSummary] = useState<ConnectionSummary>({
    totalConnections: 0,
    successfulConnections: 0,
    averageConnectionTime: 0,
    mostUsedWallet: 'None',
    lastConnectionDate: null,
    connectionHealth: 'good'
  });

  useEffect(() => {
    loadConnectionSummary();
  }, []);

  const loadConnectionSummary = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem('passportx_mobile_wallet_summary');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSummary({
          ...parsed,
          lastConnectionDate: parsed.lastConnectionDate ? new Date(parsed.lastConnectionDate) : null
        });
      } catch (error) {
        // Use default values
      }
    }

    // Mock data for demonstration
    setSummary({
      totalConnections: 47,
      successfulConnections: 45,
      averageConnectionTime: 8.3,
      mostUsedWallet: 'Xverse',
      lastConnectionDate: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      connectionHealth: 'excellent'
    });
  };

  const successRate = summary.totalConnections > 0
    ? Math.round((summary.successfulConnections / summary.totalConnections) * 100)
    : 0;

  const getHealthColor = (health: ConnectionSummary['connectionHealth']) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthIcon = (health: ConnectionSummary['connectionHealth']) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <TrendingUp className="w-5 h-5" />;
      case 'fair': return <Activity className="w-5 h-5" />;
      case 'poor': return <Shield className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatLastConnection = (date: Date | null) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Recently';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Connection Summary</h2>
        </div>

        {/* Health Status */}
        <div className={`p-4 rounded-lg border ${getHealthColor(summary.connectionHealth)}`}>
          <div className="flex items-center gap-3">
            {getHealthIcon(summary.connectionHealth)}
            <div>
              <h3 className="font-medium capitalize">
                Connection Health: {summary.connectionHealth}
              </h3>
              <p className="text-sm opacity-90">
                Your mobile wallet connections are performing well
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{summary.totalConnections}</div>
          <div className="text-sm text-gray-600">Total Connections</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{summary.averageConnectionTime}s</div>
          <div className="text-sm text-gray-600">Avg. Connection Time</div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{summary.mostUsedWallet}</div>
          <div className="text-sm text-gray-600">Most Used Wallet</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Last Connection</span>
          </div>
          <span className="text-sm font-medium">
            {formatLastConnection(summary.lastConnectionDate)}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Successful Connections</span>
          </div>
          <span className="text-sm font-medium text-green-600">
            {summary.successfulConnections} / {summary.totalConnections}
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Wallet Types Used</span>
          </div>
          <span className="text-sm font-medium">
            {summary.mostUsedWallet !== 'None' ? 'Multiple' : 'None'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex gap-3">
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            View Details
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}