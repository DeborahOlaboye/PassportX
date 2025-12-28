import { NetworkType, NetworkConfig, NETWORK_CONFIGS } from '@/types/network';

export class NetworkManager {
  private static instance: NetworkManager;
  private currentNetwork: NetworkType = 'testnet';
  private config: NetworkConfig = NETWORK_CONFIGS.testnet;

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  setNetwork(network: NetworkType): void {
    this.currentNetwork = network;
    this.config = NETWORK_CONFIGS[network];
  }

  getCurrentNetwork(): NetworkType {
    return this.currentNetwork;
  }

  getCurrentConfig(): NetworkConfig {
    return this.config;
  }

  getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  getExplorerUrl(): string {
    return this.config.explorerUrl;
  }

  getContractAddress(contract: keyof NetworkConfig['contractAddresses']): string {
    return this.config.contractAddresses[contract];
  }

  getFaucetUrl(): string | undefined {
    return this.config.faucetUrl;
  }

  isMainnet(): boolean {
    return this.currentNetwork === 'mainnet';
  }

  isTestnet(): boolean {
    return this.currentNetwork === 'testnet';
  }

  // Utility methods for API calls
  buildApiUrl(endpoint: string): string {
    return `${this.getApiUrl()}${endpoint}`;
  }

  buildExplorerUrl(path: string): string {
    return `${this.getExplorerUrl()}${path}`;
  }

  // Transaction explorer URL
  getTransactionUrl(txId: string): string {
    return this.buildExplorerUrl(`/txid/${txId}`);
  }

  // Address explorer URL
  getAddressUrl(address: string): string {
    return this.buildExplorerUrl(`/address/${address}`);
  }

  // Contract explorer URL
  getContractUrl(contractId: string): string {
    return this.buildExplorerUrl(`/contract/${contractId}`);
  }
}

// Global instance
export const networkManager = NetworkManager.getInstance();

// HTTP client with network awareness
export class NetworkAwareHttpClient {
  private baseUrl: string;

  constructor(networkType: NetworkType = 'testnet') {
    this.baseUrl = NETWORK_CONFIGS[networkType].apiUrl;
    this.updateNetwork(networkType);
  }

  updateNetwork(networkType: NetworkType): void {
    this.baseUrl = NETWORK_CONFIGS[networkType].apiUrl;
  }

  async get(endpoint: string, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any, options?: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Global HTTP client instance
export const httpClient = new NetworkAwareHttpClient();