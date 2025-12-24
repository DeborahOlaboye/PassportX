'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface ConnectionAttempt {
  id: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  walletType: string;
  error?: string;
}

export default function MobileWalletPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ConnectionAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setIsLoading(true);

    // Simulate loading performance data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock performance metrics
    const mockMetrics: PerformanceMetric[] = [
      {
        name: 'Connection Success Rate',
        value: 87.5,
        unit: '%',
        trend: 'up',
        status: 'good',
        description: 'Percentage of successful mobile wallet connections'
      },
      {
        name: 'Average Connection Time',
        value: 12.3,
        unit: 's',
        trend: 'down',
        status: 'good',
        description: 'Average time to establish connection'
      },
      {
        name: 'QR Code Scan Rate',
        value: 94.2,
        unit: '%',
        trend: 'stable',
        status: 'good',
        description: 'Percentage of QR codes successfully scanned'
      },
      {
        name: 'Timeout Rate',
        value: 8.1,
        unit: '%',
        trend: 'down',
        status: 'warning',
        description: 'Percentage of connections that timeout'
      },
      {
        name: 'Error Rate',
        value: 4.2,
        unit: '%',
        trend: 'stable',
        status: 'good',
        description: 'Percentage of connections with errors'
      },
      {
        name: 'User Satisfaction',
        value: 4.1,
        unit: '/5',
        trend: 'up',
        status: 'good',
        description: 'Average user satisfaction rating'
      }
    ];

    // Mock recent connection attempts
    const mockAttempts: ConnectionAttempt[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        duration: 8.5,
        success: true,
        walletType: 'Xverse'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        duration: 15.2,
        success: false,
        walletType: 'Hiro',
        error: 'Connection timeout'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        duration: 6.8,
        success: true,
        walletType: 'Leather'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        duration: 22.1,
        success: false,
        walletType: 'Xverse',
        error: 'Network error'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        duration: 9.3,
        success: true,
        walletType: 'Hiro'
      }
    ];

    setMetrics(mockMetrics);
    setRecentAttempts(mockAttempts);
    setIsLoading(false);
  };

  const getStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Mobile Wallet Performance</h2>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-4 rounded-lg border ${getStatusBgColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{metric.name}</h3>
              {getTrendIcon(metric.trend)}
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-bold text-gray-900">
                {metric.value}
              </span>
              <span className="text-sm text-gray-600">{metric.unit}</span>
            </div>

            <p className="text-xs text-gray-600">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Recent Connection Attempts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Connection Attempts</h3>

        <div className="space-y-3">
          {recentAttempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {attempt.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{attempt.walletType}</span>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(attempt.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(attempt.duration)}
                    </span>

                    {!attempt.success && attempt.error && (
                      <span className="flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {attempt.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                attempt.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {attempt.success ? 'Success' : 'Failed'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Performance Insights</h4>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• Connection success rate is above target (85%+)</li>
              <li>• Average connection time has improved by 2.1 seconds</li>
              <li>• QR code scanning is highly reliable at 94%</li>
              <li>• Timeout rate is within acceptable range</li>
              <li>• User satisfaction remains high at 4.1/5</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}