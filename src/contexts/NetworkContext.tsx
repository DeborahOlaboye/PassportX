'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NetworkType, NetworkConfig, NetworkState, NETWORK_CONFIGS } from '@/types/network';

const NetworkContext = createContext<NetworkState | undefined>(undefined);

const STORAGE_KEY = 'passportx-network';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>('testnet');
  const [isSwitching, setIsSwitching] = useState(false);

  // Load saved network preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'mainnet' || saved === 'testnet')) {
      setCurrentNetwork(saved as NetworkType);
    }
  }, []);

  const switchNetwork = useCallback(async (network: NetworkType) => {
    if (network === currentNetwork) return;

    setIsSwitching(true);

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, network);

      // Update current network
      setCurrentNetwork(network);

      // Reset application state
      await resetApplicationState();

      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('networkChanged', {
        detail: { network, config: NETWORK_CONFIGS[network] }
      }));

      console.log(`Switched to ${NETWORK_CONFIGS[network].name}`);
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  }, [currentNetwork]);

  const resetApplicationState = async () => {
    // Clear transaction history
    localStorage.removeItem('transactionHistory');

    // Clear any cached data
    // This would be expanded based on what data needs to be cleared

    // Reset wallet connection if needed
    // This would integrate with wallet context

    // Clear any network-specific caches
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('cache-') || key.startsWith('api-cache-')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const getNetworkConfig = useCallback((network: NetworkType): NetworkConfig => {
    return NETWORK_CONFIGS[network];
  }, []);

  const config = NETWORK_CONFIGS[currentNetwork];

  return (
    <NetworkContext.Provider value={{
      currentNetwork,
      config,
      isSwitching,
      switchNetwork,
      getNetworkConfig,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

// Hook for components that need to react to network changes
export function useNetworkChange(callback: (network: NetworkType, config: NetworkConfig) => void) {
  useEffect(() => {
    const handleNetworkChange = (event: CustomEvent) => {
      callback(event.detail.network, event.detail.config);
    };

    window.addEventListener('networkChanged', handleNetworkChange as EventListener);
    return () => {
      window.removeEventListener('networkChanged', handleNetworkChange as EventListener);
    };
  }, [callback]);
}