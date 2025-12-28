'use client';

import { useState, useEffect } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { networkManager } from '@/utils/networkManager';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function NetworkStatus({ showDetails = false, className = '' }: NetworkStatusProps) {
  const { currentNetwork, config, isSwitching } = useNetwork();
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);

  useEffect(() => {
    checkNetworkStatus();
    const interval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [currentNetwork]);

  const checkNetworkStatus = async () => {
    try {
      const startTime = Date.now();

      // Check API connectivity
      const response = await fetch(`${config.apiUrl}/v2/info`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const endTime = Date.now();
      setLatency(endTime - startTime);

      if (response.ok) {
        const data = await response.json();
        setBlockHeight(data.stacks_tip_height || data.burn_block_height);
        setIsOnline(true);
      } else {
        setIsOnline(false);
        setBlockHeight(null);
      }
    } catch (error) {
      console.warn('Network status check failed:', error);
      setIsOnline(false);
      setLatency(null);
      setBlockHeight(null);
    }
  };

  const getStatusColor = () => {
    if (isSwitching) return 'text-yellow-600';
    if (!isOnline) return 'text-red-600';
    if (latency && latency > 2000) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isSwitching) return '🔄';
    if (!isOnline) return '❌';
    if (latency && latency > 2000) return '⚠️';
    return '✅';
  };

  const getStatusText = () => {
    if (isSwitching) return 'Switching networks...';
    if (!isOnline) return 'Offline';
    if (latency && latency > 2000) return 'Slow connection';
    return 'Online';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <span className={getStatusColor()}>{getStatusIcon()}</span>
        <span>{config.name}</span>
        <span className="text-gray-500">•</span>
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Network Status</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Network:</span>
          <span className="font-medium">{config.name}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status:</span>
          <span className={`flex items-center space-x-1 ${getStatusColor()}`}>
            <span>{getStatusIcon()}</span>
            <span>{getStatusText()}</span>
          </span>
        </div>

        {latency !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Latency:</span>
            <span className="font-mono text-sm">
              {latency < 1000 ? `${latency}ms` : `${(latency / 1000).toFixed(1)}s`}
            </span>
          </div>
        )}

        {blockHeight !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Block Height:</span>
            <span className="font-mono text-sm">{blockHeight.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600">RPC URL:</span>
          <span className="font-mono text-xs text-gray-500 truncate max-w-48">
            {config.rpcUrl}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Explorer:</span>
          <a
            href={config.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Explorer →
          </a>
        </div>

        {config.faucetUrl && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Faucet:</span>
            <a
              href={config.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Get Test STX →
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        <button
          onClick={checkNetworkStatus}
          className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}