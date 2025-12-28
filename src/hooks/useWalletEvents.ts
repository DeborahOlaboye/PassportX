import { useEffect, useCallback } from 'react';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

export interface WalletEventListener {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
  onAccountChanged?: (address: string) => void;
  onNetworkChanged?: (chainId: number) => void;
  onError?: (error: Error) => void;
}

export function useWalletEvents(listeners: WalletEventListener) {
  const { isConnected, connectedWallet } = useWalletConnect();

  useEffect(() => {
    if (isConnected && connectedWallet) {
      listeners.onConnected?.(connectedWallet.address);
    }
  }, [isConnected, connectedWallet, listeners.onConnected]);

  useEffect(() => {
    if (!isConnected && connectedWallet === null) {
      listeners.onDisconnected?.();
    }
  }, [isConnected, connectedWallet, listeners.onDisconnected]);

  const handleAccountChange = useCallback(
    (newAddress: string) => {
      listeners.onAccountChanged?.(newAddress);
    },
    [listeners.onAccountChanged]
  );

  const handleNetworkChange = useCallback(
    (newChainId: number) => {
      listeners.onNetworkChanged?.(newChainId);
    },
    [listeners.onNetworkChanged]
  );

  const handleWalletError = useCallback(
    (error: Error) => {
      listeners.onError?.(error);
    },
    [listeners.onError]
  );

  return {
    handleAccountChange,
    handleNetworkChange,
    handleWalletError,
  };
}
