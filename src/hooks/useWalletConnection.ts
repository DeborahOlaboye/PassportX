import { useCallback } from 'react';
import {
  useWalletConnect,
  ConnectedWallet,
} from '@/contexts/WalletConnectContext';

export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  formattedAddress: string | null;
  isLoading: boolean;
  error: string | null;
  connect: (wallet: ConnectedWallet) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing user wallet connection state from the WalletConnect context.
 * This wrapper exposes a consistent hook interface for components and utilities.
 */
export const useWalletConnection = (): WalletConnection => {
  const {
    isConnected,
    connectedWallet,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    clearError,
  } = useWalletConnect();

  const address = connectedWallet?.address ?? null;
  const formattedAddress = address ? formatAddress(address) : null;

  const connect = useCallback(
    async (wallet: ConnectedWallet) => {
      await connectWallet(wallet);
    },
    [connectWallet]
  );

  const disconnect = useCallback(async () => {
    await disconnectWallet();
  }, [disconnectWallet]);

  return {
    isConnected,
    address,
    formattedAddress,
    isLoading: isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  };
};

export const formatAddress = (addr: string): string => {
  if (!addr || addr.length <= 10) {
    return addr;
  }

  const prefix = addr.slice(0, 6);
  const suffix = addr.slice(-4);
  return `${prefix}...${suffix}`;
};
