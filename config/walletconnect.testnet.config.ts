export const walletConnectTestnetConfig = {
  projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  relayUrl: process.env.WALLETCONNECT_RELAY_URL || 'wss://relay.walletconnect.org',
  enabled: process.env.NEXT_PUBLIC_WALLETCONNECT_ENABLED === 'true',
  network: 'testnet',
  chainId: 5,
  chainName: 'Ethereum Testnet (Goerli)',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://goerli.infura.io/v3/',
  blockExplorerUrl: 'https://goerli.etherscan.io',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  testMode: process.env.WALLETCONNECT_TEST_MODE === 'true',
  logLevel: (process.env.WALLETCONNECT_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  timeout: parseInt(process.env.WALLETCONNECT_TIMEOUT || '30000', 10),
  requiredNamespaces: {
    eip155: {
      methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
      chains: ['eip155:5'],
      events: ['chainChanged', 'accountsChanged', 'disconnect']
    }
  },
  optionalNamespaces: {
    eip155: {
      methods: ['eth_call', 'eth_getBalance', 'eth_estimateGas'],
      chains: ['eip155:5'],
      events: []
    }
  },
  sessionConfig: {
    expiry: 86400 * 7,
    relayProtocol: 'irn',
    relayData: 'eu-1'
  }
};

export const createWalletConnectTestnetSession = () => ({
  topic: `testnet-session-${Date.now()}`,
  relay: {
    protocol: walletConnectTestnetConfig.sessionConfig.relayProtocol,
    data: walletConnectTestnetConfig.sessionConfig.relayData
  },
  expiry: Math.floor(Date.now() / 1000) + walletConnectTestnetConfig.sessionConfig.expiry,
  namespaces: walletConnectTestnetConfig.requiredNamespaces
});
