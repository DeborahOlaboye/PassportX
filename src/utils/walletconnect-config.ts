import { WalletConnectProviderConfig, ChainConfig } from '@/types/walletconnect-config';

export function getEnvironmentConfig(): {
  projectId: string;
  relayUrl: string;
  debug: boolean;
} {
  return {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    relayUrl: process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL || 'wss://relay.walletconnect.org',
    debug: process.env.NODE_ENV === 'development',
  };
}

export function createChainNamespace(chainId: number, namespace: string = 'stacks'): string {
  return `${namespace}:${chainId}`;
}

export function parseNamespace(namespace: string): { namespace: string; chainId: number } {
  const [ns, chainIdStr] = namespace.split(':');
  return {
    namespace: ns,
    chainId: parseInt(chainIdStr, 10),
  };
}

export function isChainSupported(chainId: number, supportedChains: ChainConfig[]): boolean {
  return supportedChains.some((chain) => chain.id === chainId);
}

export function getChainNamespace(chainId: number, supportedChains: ChainConfig[]): string | null {
  const chain = supportedChains.find((c) => c.id === chainId);
  return chain?.namespace || null;
}

export function filterEnabledChains(chains: ChainConfig[]): ChainConfig[] {
  return chains.filter((chain) => chain.enabled);
}

export function getRequiredNamespaces(
  chains: ChainConfig[],
  methods: string[],
  events: string[]
): Record<string, any> {
  const namespaces: Record<string, any> = {};

  chains.forEach((chain) => {
    namespaces[chain.namespace] = {
      chains: [chain.namespace],
      methods,
      events,
    };
  });

  return namespaces;
}

export function mergeRpcMaps(baseMap: Record<number, string>, customMap?: Record<number, string>): Record<number, string> {
  if (!customMap) return baseMap;
  return {
    ...baseMap,
    ...customMap,
  };
}

export function isConfigurationValid(config: WalletConnectProviderConfig): boolean {
  return !!(
    config.projectId &&
    config.relayUrl &&
    config.metadata &&
    config.chains &&
    config.chains.length > 0 &&
    config.methods &&
    config.methods.length > 0 &&
    config.events &&
    config.events.length > 0
  );
}

export function getConfigurationStatus(config: WalletConnectProviderConfig): {
  status: 'ready' | 'invalid' | 'partial';
  messages: string[];
} {
  const messages: string[] = [];

  if (!config.projectId) {
    messages.push('Missing projectId');
  }

  if (!config.relayUrl) {
    messages.push('Missing relayUrl');
  }

  if (!config.metadata) {
    messages.push('Missing metadata');
  }

  if (!config.chains || config.chains.length === 0) {
    messages.push('No chains configured');
  }

  if (!config.methods || config.methods.length === 0) {
    messages.push('No methods configured');
  }

  if (!config.events || config.events.length === 0) {
    messages.push('No events configured');
  }

  const status = messages.length === 0 ? 'ready' : messages.length < 3 ? 'partial' : 'invalid';

  return { status, messages };
}
