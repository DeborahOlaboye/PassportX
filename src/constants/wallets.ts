export const WALLET_CONFIG = {
  XVERSE: {
    id: 'xverse',
    name: 'Xverse',
    icon: '🔷',
    description: 'Popular Stacks and Bitcoin wallet',
    downloadUrl: 'https://www.xverse.app',
    deepLink: 'xverse://',
  },
  HIRO: {
    id: 'hiro',
    name: 'Hiro Wallet',
    icon: '🔶',
    description: 'Official Stacks wallet by Hiro',
    downloadUrl: 'https://www.hiro.so/wallet',
    deepLink: 'hirowallet://',
  },
  LEATHER: {
    id: 'leather',
    name: 'Leather',
    icon: '🟫',
    description: 'Bitcoin-native wallet with Stacks support',
    downloadUrl: 'https://leather.io',
    deepLink: 'leather://',
  },
} as const;

export const STACKS_NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Mainnet',
    rpcUrl: 'https://stacks-node-api.mainnet.stacks.co',
    explorerUrl: 'https://explorer.stacks.co',
  },
  TESTNET: {
    chainId: 5050,
    name: 'Testnet',
    rpcUrl: 'https://stacks-node-api.testnet.stacks.co',
    explorerUrl: 'https://explorer.stacks.co?chain=testnet',
  },
  DEVNET: {
    chainId: 5051,
    name: 'Devnet',
    rpcUrl: 'http://localhost:3999',
    explorerUrl: 'http://localhost:8000',
  },
} as const;

export const WALLETCONNECT_DEFAULTS = {
  RELAY_URL: 'wss://relay.walletconnect.org',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  QR_CODE_SIZE: 300,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  DISCONNECTION_FAILED: 'Failed to disconnect wallet.',
  INVALID_ADDRESS: 'Invalid wallet address.',
  SESSION_EXPIRED: 'Session has expired. Please reconnect.',
  UNSUPPORTED_NETWORK: 'This network is not supported.',
  USER_REJECTED: 'Connection was rejected by the user.',
  WALLET_NOT_INSTALLED: 'Wallet is not installed. Please install it first.',
} as const;

export const SUCCESS_MESSAGES = {
  CONNECTED: 'Wallet connected successfully!',
  DISCONNECTED: 'Wallet disconnected.',
  SESSION_RESTORED: 'Session restored successfully.',
  ADDRESS_COPIED: 'Address copied to clipboard!',
} as const;
