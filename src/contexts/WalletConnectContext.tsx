'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ConnectedWallet {
  address: string;
  name: string;
  chainId: number;
  sessionTopic?: string;
}

export interface WalletConnectContextType {
  isConnecting: boolean;
  isConnected: boolean;
  connectedWallet: ConnectedWallet | null;
  error: string | null;
  connectWallet: (wallet: ConnectedWallet) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  clearError: () => void;
}

const WalletConnectContext = createContext<WalletConnectContextType | undefined>(undefined);

interface WalletConnectProviderProps {
  children: ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async (wallet: ConnectedWallet) => {
    try {
      setIsConnecting(true);
      setError(null);

      if (typeof window !== 'undefined') {
        localStorage.setItem('walletconnect_wallet', JSON.stringify(wallet));
      }

      setConnectedWallet(wallet);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletconnect_wallet');
        localStorage.removeItem('walletconnect_session');
      }

      setConnectedWallet(null);
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: WalletConnectContextType = {
    isConnecting,
    isConnected,
    connectedWallet,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
  };

  return (
    <WalletConnectContext.Provider value={value}>{children}</WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (context === undefined) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}
