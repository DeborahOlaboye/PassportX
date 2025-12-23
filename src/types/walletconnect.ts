export interface WalletMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface SessionProposal {
  id: number;
  params: {
    requiredNamespaces: Record<string, any>;
    optionalNamespaces?: Record<string, any>;
  };
}

export interface SessionSettled {
  topic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  expiry: number;
  namespaces: Record<string, any>;
  accounts: string[];
}

export interface TransactionRequest {
  to: string;
  from: string;
  data?: string;
  value?: string;
  gasPrice?: string;
  gas?: string;
  nonce?: string;
}

export interface SignatureRequest {
  message: string;
  address: string;
  method: 'personal_sign' | 'eth_signTypedData';
}

export interface WalletConnectError extends Error {
  code: number;
  data?: Record<string, any>;
}

export enum ChainNamespace {
  STACKS = 'stacks',
  ETHEREUM = 'eip155',
  COSMOS = 'cosmos',
  SOLANA = 'solana',
}

export const STACKS_CHAIN_IDS = {
  MAINNET: 1,
  TESTNET: 5050,
  DEVNET: 5051,
} as const;

export const STACKS_NAMESPACE = `${ChainNamespace.STACKS}:${STACKS_CHAIN_IDS.MAINNET}`;
export const STACKS_TESTNET_NAMESPACE = `${ChainNamespace.STACKS}:${STACKS_CHAIN_IDS.TESTNET}`;

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isPairing: boolean;
  sessionTopic?: string;
  walletAddress?: string;
  chainId?: number;
  error?: string;
}

export interface WalletConnectSession {
  topic: string;
  expiry: number;
  relay: {
    protocol: string;
    data?: string;
  };
  namespaces: Record<string, any>;
  pairingTopic?: string;
}
