'use client';

import { useState } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { NetworkType, NETWORK_CONFIGS } from '@/types/network';

interface NetworkSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'minimal';
  showStatus?: boolean;
  className?: string;
}

export function NetworkSelector({
  variant = 'dropdown',
  showStatus = true,
  className = ''
}: NetworkSelectorProps) {
  const { currentNetwork, config, isSwitching, switchNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkSwitch = async (network: NetworkType) => {
    try {
      await switchNetwork(network);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
      // Could show error toast here
    }
  };

  const getNetworkIcon = (network: NetworkType) => {
    return network === 'mainnet' ? '🌐' : '🧪';
  };

  const getNetworkColor = (network: NetworkType) => {
    return network === 'mainnet'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {(Object.keys(NETWORK_CONFIGS) as NetworkType[]).map((network) => (
          <button
            key={network}
            onClick={() => handleNetworkSwitch(network)}
            disabled={isSwitching || currentNetwork === network}
            className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
              currentNetwork === network
                ? getNetworkColor(network)
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSwitching && currentNetwork === network ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Switching...
              </span>
            ) : (
              <span className="flex items-center">
                <span className="mr-2">{getNetworkIcon(network)}</span>
                {NETWORK_CONFIGS[network].name}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNetworkColor(currentNetwork)}`}>
          <span className="mr-1">{getNetworkIcon(currentNetwork)}</span>
          {currentNetwork.toUpperCase()}
        </span>
        {showStatus && (
          <span className="text-xs text-gray-500">
            {isSwitching ? 'Switching...' : 'Connected'}
          </span>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={`flex items-center space-x-2 px-3 py-2 border rounded-md bg-white text-sm font-medium ${getNetworkColor(currentNetwork)} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span>{getNetworkIcon(currentNetwork)}</span>
        <span>{config.name}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {(Object.keys(NETWORK_CONFIGS) as NetworkType[]).map((network) => (
            <button
              key={network}
              onClick={() => handleNetworkSwitch(network)}
              disabled={isSwitching}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                currentNetwork === network ? 'bg-gray-100' : ''
              }`}
            >
              <span>{getNetworkIcon(network)}</span>
              <span>{NETWORK_CONFIGS[network].name}</span>
              {currentNetwork === network && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Compact version for header/status bar
export function NetworkStatus({ className = '' }: { className?: string }) {
  const { currentNetwork, config, isSwitching } = useNetwork();

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isSwitching ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
      <span className="font-medium">{config.name}</span>
      {isSwitching && <span className="text-gray-500">Switching...</span>}
    </div>
  );
}