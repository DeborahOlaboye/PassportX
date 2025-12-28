import { WalletConnectProviderConfig, WalletConnectSessionConfig } from '@/types/walletconnect-config';

export interface StacksWalletConfig {
  projectId: string;
  relayUrl: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  requiredNamespaces: {
    stacks: {
      methods: string[];
      chains: string[];
      events: string[];
    };
  };
  optionalNamespaces?: {
    stacks: {
      methods: string[];
      chains: string[];
      events: string[];
    };
  };
}

export const createStacksWalletConfig = (): StacksWalletConfig => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'passportx_walletconnect_project';
  const relayUrl = process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL || 'wss://relay.walletconnect.org';

  return {
    projectId,
    relayUrl,
    metadata: {
      name: 'PassportX',
      description: 'Decentralized Achievement Passport',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://passportx.app',
      icons: [
        typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : 'https://passportx.app/icon.png'
      ],
    },
    requiredNamespaces: {
      stacks: {
        methods: [
          'stacks_signMessage',
          'stacks_signTransaction',
          'stacks_getAccounts',
          'stacks_getAddresses',
          'stacks_sendTransaction',
        ],
        chains: ['stacks:1', 'stacks:2147483648'], // Mainnet and testnet
        events: ['accountsChanged', 'chainChanged'],
      },
    },
    optionalNamespaces: {
      stacks: {
        methods: ['stacks_getBlockHeight', 'stacks_getBalance'],
        chains: ['stacks:1', 'stacks:2147483648'],
        events: [],
      },
    },
  };
};

export const createWalletConnectUri = (sessionTopic: string, config: StacksWalletConfig): string => {
  const { projectId, relayUrl } = config;
  const relayData = 'irn'; // Default relay protocol

  // Create the URI according to WalletConnect v2 specification
  const uri = `wc:${sessionTopic}@2?relay-protocol=${relayData}&symKey=${generateSymKey()}&projectId=${projectId}`;

  return uri;
};

const generateSymKey = (): string => {
  // Generate a random symmetric key for encryption
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const getMobileWalletDeepLinks = (uri: string) => {
  const encodedUri = encodeURIComponent(uri);

  return {
    xverse: `xverse://wc?uri=${encodedUri}`,
    hiro: `hiro://wc?uri=${encodedUri}`,
    leather: `leather://wc?uri=${encodedUri}`,
    // Generic fallback
    walletconnect: `wc://wc?uri=${encodedUri}`,
  };
};

export const detectMobilePlatform = (): 'ios' | 'android' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }

  if (/android/.test(userAgent)) {
    return 'android';
  }

  return 'unknown';
};

export const openMobileWallet = (walletType: 'xverse' | 'hiro' | 'leather', uri: string): void => {
  const deepLinks = getMobileWalletDeepLinks(uri);
  const platform = detectMobilePlatform();

  let url = deepLinks[walletType];

  // Try to open the app
  if (platform === 'ios') {
    // iOS deep linking
    window.location.href = url;
  } else if (platform === 'android') {
    // Android intent
    window.location.href = url;
  } else {
    // Desktop - copy to clipboard as fallback
    navigator.clipboard?.writeText(uri);
    alert(`URI copied to clipboard. Please paste it into your ${walletType} wallet.`);
  }

  // Fallback: try to open in new tab after a delay
  setTimeout(() => {
    window.open(url, '_blank');
  }, 1000);
};