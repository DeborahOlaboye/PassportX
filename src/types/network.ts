export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkConfig {
  type: NetworkType;
  name: string;
  chainId: number;
  rpcUrl: string;
  apiUrl: string;
  explorerUrl: string;
  contractAddresses: {
    passportCore: string;
    badgeIssuer: string;
    communityManager: string;
  };
  faucetUrl?: string;
}

export interface NetworkState {
  currentNetwork: NetworkType;
  config: NetworkConfig;
  isSwitching: boolean;
  switchNetwork: (network: NetworkType) => Promise<void>;
  getNetworkConfig: (network: NetworkType) => NetworkConfig;
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    type: 'mainnet',
    name: 'Stacks Mainnet',
    chainId: 1,
    rpcUrl: 'https://stacks-node-api.mainnet.stacks.co',
    apiUrl: 'https://api.mainnet.stacks.co',
    explorerUrl: 'https://explorer.stacks.co',
    contractAddresses: {
      passportCore: 'SP1RECIPIENT7ADDR7ADDR7ADDR7ADDR7ADDR7A',
      badgeIssuer: 'SP1RECIPIENT7ADDR7ADDR7ADDR7ADDR7ADDR7A',
      communityManager: 'SP1RECIPIENT7ADDR7ADDR7ADDR7ADDR7ADDR7A',
    },
  },
  testnet: {
    type: 'testnet',
    name: 'Stacks Testnet',
    chainId: 2147483648,
    rpcUrl: 'https://stacks-node-api.testnet.stacks.co',
    apiUrl: 'https://api.testnet.stacks.co',
    explorerUrl: 'https://explorer.stacks.co',
    contractAddresses: {
      passportCore: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      badgeIssuer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      communityManager: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    },
    faucetUrl: 'https://explorer.stacks.co/sandbox/faucet',
  },
};