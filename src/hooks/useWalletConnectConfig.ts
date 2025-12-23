import { useCallback, useMemo } from 'react';
import { useWalletConnectConfig as useConfigContext } from '@/contexts/WalletConnectConfigContext';
import { ChainConfig } from '@/types/walletconnect-config';
import { CHAIN_ID_TO_CONFIG } from '@/config/chains';

export function useWalletConnectConfig() {
  const { config, isInitialized, isInitializing, error, initializeConfig } =
    useConfigContext();

  const isReady = isInitialized && !isInitializing && !error;

  const getSupportedChains = useCallback((): ChainConfig[] => {
    return config?.chains || [];
  }, [config]);

  const getSupportedMethods = useCallback((): string[] => {
    return config?.methods || [];
  }, [config]);

  const getSupportedEvents = useCallback((): string[] => {
    return config?.events || [];
  }, [config]);

  const getChainConfig = useCallback(
    (chainId: number): ChainConfig | undefined => {
      if (config?.chains) {
        return config.chains.find((c) => c.id === chainId);
      }
      return CHAIN_ID_TO_CONFIG[chainId];
    },
    [config]
  );

  const getRpcUrl = useCallback(
    (chainId: number): string | undefined => {
      const chain = getChainConfig(chainId);
      if (chain) return chain.rpcUrl;

      if (config?.rpcMap && config.rpcMap[chainId]) {
        return config.rpcMap[chainId];
      }

      return undefined;
    },
    [config, getChainConfig]
  );

  const getExplorerUrl = useCallback(
    (chainId: number, txHash?: string): string | undefined => {
      const chain = getChainConfig(chainId);
      if (!chain) return undefined;

      if (txHash) {
        return `${chain.explorerUrl}/tx/${txHash}`;
      }

      return chain.explorerUrl;
    },
    [getChainConfig]
  );

  const memoizedValue = useMemo(
    () => ({
      config,
      isInitialized,
      isInitializing,
      isReady,
      error,
      initializeConfig,
      getSupportedChains,
      getSupportedMethods,
      getSupportedEvents,
      getChainConfig,
      getRpcUrl,
      getExplorerUrl,
    }),
    [
      config,
      isInitialized,
      isInitializing,
      isReady,
      error,
      initializeConfig,
      getSupportedChains,
      getSupportedMethods,
      getSupportedEvents,
      getChainConfig,
      getRpcUrl,
      getExplorerUrl,
    ]
  );

  return memoizedValue;
}
