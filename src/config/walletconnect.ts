import { WalletConnectProviderConfig } from '@/types/walletconnect-config';
import { SUPPORTED_CHAINS, CHAIN_ID_TO_CONFIG } from './chains';
import { RELAY_CONFIG } from './relay';
import { getAppMetadata } from './metadata';

const STACKS_METHODS = [
  'stacks_call',
  'stacks_signMessage',
  'stacks_signTransaction',
  'stacks_sendTransaction',
];

const STACKS_EVENTS = [
  'stacks_chainChanged',
  'stacks_accountsChanged',
  'stacks_connect',
  'stacks_disconnect',
];

export function buildWalletConnectConfig(): WalletConnectProviderConfig {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

  if (!projectId) {
    console.warn(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect may not work properly.'
    );
  }

  const rpcMap: Record<number, string> = {};
  SUPPORTED_CHAINS.forEach((chain) => {
    rpcMap[chain.id] = chain.rpcUrl;
  });

  return {
    projectId: projectId || 'default_project_id',
    relayUrl: RELAY_CONFIG.url,
    metadata: getAppMetadata(),
    chains: SUPPORTED_CHAINS,
    methods: STACKS_METHODS,
    events: STACKS_EVENTS,
    rpcMap,
    explorerUrl: 'https://explorer.stacks.co',
  };
}

export function validateConfig(config: WalletConnectProviderConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.projectId) {
    errors.push('projectId is required');
  }

  if (!config.relayUrl) {
    errors.push('relayUrl is required');
  }

  if (!config.metadata) {
    errors.push('metadata is required');
  } else {
    if (!config.metadata.name) errors.push('metadata.name is required');
    if (!config.metadata.url) errors.push('metadata.url is required');
    if (!config.metadata.icons || config.metadata.icons.length === 0) {
      errors.push('metadata.icons is required and must not be empty');
    }
  }

  if (!config.chains || config.chains.length === 0) {
    errors.push('chains must be defined and not empty');
  }

  if (!config.methods || config.methods.length === 0) {
    errors.push('methods must be defined and not empty');
  }

  if (!config.events || config.events.length === 0) {
    errors.push('events must be defined and not empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getChainRpcUrl(chainId: number, config?: WalletConnectProviderConfig): string {
  const chain = CHAIN_ID_TO_CONFIG[chainId];
  if (chain) return chain.rpcUrl;

  if (config?.rpcMap && config.rpcMap[chainId]) {
    return config.rpcMap[chainId];
  }

  throw new Error(`No RPC URL found for chain ${chainId}`);
}

export function printConfigDebug(config: WalletConnectProviderConfig): void {
  if (typeof window === 'undefined') return;

  console.group('WalletConnect Provider Config');
  console.log('Project ID:', config.projectId);
  console.log('Relay URL:', config.relayUrl);
  console.log('Metadata:', config.metadata);
  console.log('Chains:', config.chains.map((c) => `${c.name} (${c.id})`));
  console.log('Methods:', config.methods);
  console.log('Events:', config.events);
  console.groupEnd();
}
