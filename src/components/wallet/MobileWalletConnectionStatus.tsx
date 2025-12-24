'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export type ConnectionStatus =
  | 'idle'
  | 'generating_qr'
  | 'waiting_for_scan'
  | 'scanned'
  | 'connecting'
  | 'connected'
  | 'failed'
  | 'timeout'
  | 'network_error';

interface MobileWalletConnectionStatusProps {
  status: ConnectionStatus;
  walletName?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  timeoutSeconds?: number;
}

const STATUS_CONFIG = {
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    message: 'Ready to connect',
    description: 'Click to generate QR code',
  },
  generating_qr: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    message: 'Generating QR Code',
    description: 'Creating secure connection link...',
  },
  waiting_for_scan: {
    icon: Smartphone,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    message: 'Waiting for Scan',
    description: 'Open your wallet app and scan the QR code',
  },
  scanned: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'QR Code Scanned',
    description: 'Wallet detected, establishing connection...',
  },
  connecting: {
    icon: RefreshCw,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    message: 'Connecting',
    description: 'Securely connecting to your wallet...',
  },
  connected: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'Connected Successfully',
    description: 'Your wallet is now connected to PassportX',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    message: 'Connection Failed',
    description: 'Unable to connect to wallet. Please try again.',
  },
  timeout: {
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    message: 'Connection Timeout',
    description: 'Connection took too long. Please try again.',
  },
  network_error: {
    icon: WifiOff,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    message: 'Network Error',
    description: 'Check your internet connection and try again.',
  },
};

export default function MobileWalletConnectionStatus({
  status,
  walletName,
  onRetry,
  onCancel,
  timeoutSeconds = 300, // 5 minutes default
}: MobileWalletConnectionStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  const [isAnimating, setIsAnimating] = useState(false);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  useEffect(() => {
    if (status === 'waiting_for_scan' || status === 'connecting') {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsAnimating(false);
      setTimeRemaining(timeoutSeconds);
    }
  }, [status, timeoutSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const showRetryButton = status === 'failed' || status === 'timeout' || status === 'network_error';
  const showCancelButton = status === 'waiting_for_scan' || status === 'connecting';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      {/* Status Icon */}
      <div className={`p-4 rounded-full ${config.bgColor} mb-4`}>
        <Icon
          className={`w-8 h-8 ${config.color} ${
            isAnimating ? 'animate-spin' : ''
          }`}
        />
      </div>

      {/* Status Message */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {config.message}
        </h3>
        <p className="text-sm text-gray-600">
          {config.description}
        </p>
        {walletName && (
          <p className="text-xs text-gray-500 mt-1">
            Wallet: {walletName}
          </p>
        )}
      </div>

      {/* Timeout Timer */}
      {(status === 'waiting_for_scan' || status === 'connecting') && timeRemaining > 0 && (
        <div className="mb-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Time remaining</div>
          <div className="text-2xl font-mono font-bold text-gray-700">
            {formatTime(timeRemaining)}
          </div>
        </div>
      )}

      {/* Progress Indicator for Active States */}
      {(status === 'generating_qr' || status === 'connecting') && (
        <div className="w-full mb-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {showRetryButton && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}

        {showCancelButton && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Additional Help for Certain States */}
      {status === 'waiting_for_scan' && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2">
            <Wifi className="w-3 h-3" />
            Ensure stable internet connection
          </div>
          <div className="text-xs text-gray-400">
            Having trouble? Check our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              mobile wallet guide
            </a>
          </div>
        </div>
      )}

      {status === 'network_error' && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-red-500 mb-2">
            <WifiOff className="w-3 h-3" />
            Network connection required
          </div>
        </div>
      )}

      {status === 'timeout' && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-orange-500 mb-2">
            <AlertTriangle className="w-3 h-3" />
            Connection timed out
          </div>
          <div className="text-xs text-gray-400">
            Try refreshing the page or using a different network
          </div>
        </div>
      )}
    </div>
  );
}