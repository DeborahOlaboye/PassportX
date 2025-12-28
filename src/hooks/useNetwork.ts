import { useNetwork, useNetworkChange } from '@/contexts/NetworkContext';
import { networkManager } from '@/utils/networkManager';
import { NetworkSwitcher } from '@/utils/networkSwitcher';
import { NetworkType } from '@/types/network';

// Re-export main hook
export { useNetwork, useNetworkChange };

// Additional convenience hooks
export function useCurrentNetwork() {
  const { currentNetwork } = useNetwork();
  return currentNetwork;
}

export function useNetworkConfig() {
  const { config } = useNetwork();
  return config;
}

export function useIsMainnet() {
  const network = useCurrentNetwork();
  return network === 'mainnet';
}

export function useIsTestnet() {
  const network = useCurrentNetwork();
  return network === 'testnet';
}

export function useNetworkManager() {
  return networkManager;
}

export function useNetworkSwitcher() {
  const { switchNetwork } = useNetwork();

  return {
    switchNetwork,
    switchToMainnet: () => switchNetwork('mainnet'),
    switchToTestnet: () => switchNetwork('testnet'),
  };
}

// Hook for network-aware API calls
export function useNetworkApi() {
  const network = useCurrentNetwork();

  const getApiUrl = (endpoint: string) => {
    return networkManager.buildApiUrl(endpoint);
  };

  const getExplorerUrl = (path: string) => {
    return networkManager.buildExplorerUrl(path);
  };

  const getTransactionUrl = (txId: string) => {
    return networkManager.getTransactionUrl(txId);
  };

  const getAddressUrl = (address: string) => {
    return networkManager.getAddressUrl(address);
  };

  const getContractUrl = (contractId: string) => {
    return networkManager.getContractUrl(contractId);
  };

  return {
    network,
    getApiUrl,
    getExplorerUrl,
    getTransactionUrl,
    getAddressUrl,
    getContractUrl,
  };
}

// Hook for contract addresses
export function useContractAddresses() {
  const network = useCurrentNetwork();

  return {
    passportCore: networkManager.getContractAddress('passportCore'),
    badgeIssuer: networkManager.getContractAddress('badgeIssuer'),
    communityManager: networkManager.getContractAddress('communityManager'),
  };
}