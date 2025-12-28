import { ChainConfig } from '@/types/walletconnect-config';

export const STACKS_MAINNET: ChainConfig = {
  id: 1,
  name: 'Stacks Mainnet',
  namespace: 'stacks:1',
  rpcUrl: 'https://stacks-node-api.mainnet.stacks.co',
  explorerUrl: 'https://explorer.stacks.co',
  nativeCurrency: {
    name: 'Stacks',
    symbol: 'STX',
    decimals: 6,
  },
  blockExplorerUrls: ['https://explorer.stacks.co'],
  enabled: true,
};

export const STACKS_TESTNET: ChainConfig = {
  id: 5050,
  name: 'Stacks Testnet',
  namespace: 'stacks:5050',
  rpcUrl: 'https://stacks-node-api.testnet.stacks.co',
  explorerUrl: 'https://explorer.stacks.co?chain=testnet',
  nativeCurrency: {
    name: 'Stacks',
    symbol: 'STX',
    decimals: 6,
  },
  blockExplorerUrls: ['https://explorer.stacks.co?chain=testnet'],
  enabled: true,
};

export const STACKS_DEVNET: ChainConfig = {
  id: 5051,
  name: 'Stacks Devnet',
  namespace: 'stacks:5051',
  rpcUrl: 'http://localhost:3999',
  explorerUrl: 'http://localhost:8000',
  nativeCurrency: {
    name: 'Stacks',
    symbol: 'STX',
    decimals: 6,
  },
  blockExplorerUrls: ['http://localhost:8000'],
  enabled: process.env.NODE_ENV === 'development',
};

export const SUPPORTED_CHAINS: ChainConfig[] = [
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
].filter((chain) => chain.enabled);

export const CHAIN_ID_TO_CONFIG: Record<number, ChainConfig> = {
  1: STACKS_MAINNET,
  5050: STACKS_TESTNET,
  5051: STACKS_DEVNET,
};

export const NAMESPACE_TO_CHAIN_ID: Record<string, number> = {
  'stacks:1': 1,
  'stacks:5050': 5050,
  'stacks:5051': 5051,
};

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_ID_TO_CONFIG[chainId];
}

export function getChainConfigByNamespace(namespace: string): ChainConfig | undefined {
  const chainId = NAMESPACE_TO_CHAIN_ID[namespace];
  return chainId ? CHAIN_ID_TO_CONFIG[chainId] : undefined;
}

export function isValidChainId(chainId: number): boolean {
  return chainId in CHAIN_ID_TO_CONFIG;
}

export function isValidNamespace(namespace: string): boolean {
  return namespace in NAMESPACE_TO_CHAIN_ID;
}
