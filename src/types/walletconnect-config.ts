export interface ChainConfig {
  id: number;
  name: string;
  namespace: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
  enabled: boolean;
}

export interface RelayConfig {
  url: string;
  protocol: string;
}

export interface MetadataConfig {
  name: string;
  description: string;
  url: string;
  icons: string[];
  verifyUrl?: string;
}

export interface WalletConnectProviderConfig {
  projectId: string;
  relayUrl: string;
  metadata: MetadataConfig;
  chains: ChainConfig[];
  methods: string[];
  events: string[];
  rpcMap?: Record<number, string>;
  explorerUrl?: string;
}

export interface ProviderInitOptions {
  config: WalletConnectProviderConfig;
  debug?: boolean;
  autoConnect?: boolean;
}

export interface InitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  error?: string;
  config?: WalletConnectProviderConfig;
}
