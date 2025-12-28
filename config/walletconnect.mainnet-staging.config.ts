export const walletConnectMainnetStagingConfig = {
  projectId: process.env.WALLETCONNECT_PROJECT_ID || '',
  relayUrl: process.env.WALLETCONNECT_RELAY_URL || 'wss://relay.walletconnect.org',
  enabled: process.env.NEXT_PUBLIC_WALLETCONNECT_ENABLED === 'true',
  network: 'mainnet',
  chainId: 1,
  chainName: 'Ethereum Mainnet',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.infura.io/v3/',
  blockExplorerUrl: 'https://etherscan.io',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  },
  testMode: process.env.WALLETCONNECT_TEST_MODE === 'true',
  logLevel: (process.env.WALLETCONNECT_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  timeout: parseInt(process.env.WALLETCONNECT_TIMEOUT || '45000', 10),
  deploymentApprovalRequired: process.env.WALLETCONNECT_DEPLOYMENT_APPROVAL_REQUIRED === 'true',
  requireSecurityAudit: process.env.WALLETCONNECT_REQUIRE_SECURITY_AUDIT === 'true',
  requiredNamespaces: {
    eip155: {
      methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
      chains: ['eip155:1'],
      events: ['chainChanged', 'accountsChanged', 'disconnect']
    }
  },
  optionalNamespaces: {
    eip155: {
      methods: ['eth_call', 'eth_getBalance', 'eth_estimateGas', 'eth_blockNumber'],
      chains: ['eip155:1'],
      events: []
    }
  },
  sessionConfig: {
    expiry: 86400 * 30,
    relayProtocol: 'irn',
    relayData: 'eu-1'
  },
  securityRequirements: {
    mfaRequired: true,
    rateLimitEnabled: true,
    auditLoggingEnabled: true,
    encryptionRequired: true
  }
};

export const createWalletConnectMainnetStagingSession = () => ({
  topic: `mainnet-staging-session-${Date.now()}`,
  relay: {
    protocol: walletConnectMainnetStagingConfig.sessionConfig.relayProtocol,
    data: walletConnectMainnetStagingConfig.sessionConfig.relayData
  },
  expiry: Math.floor(Date.now() / 1000) + walletConnectMainnetStagingConfig.sessionConfig.expiry,
  namespaces: walletConnectMainnetStagingConfig.requiredNamespaces,
  securityContext: {
    approvalRequired: walletConnectMainnetStagingConfig.deploymentApprovalRequired,
    securityAuditCompleted: walletConnectMainnetStagingConfig.requireSecurityAudit,
    timestamp: new Date().toISOString()
  }
});

export const validateMainnetStagingDeployment = async (): Promise<boolean> => {
  const checks = {
    projectIdSet: !!walletConnectMainnetStagingConfig.projectId,
    auditingEnabled: walletConnectMainnetStagingConfig.requireSecurityAudit,
    encryptionEnabled: walletConnectMainnetStagingConfig.securityRequirements.encryptionRequired,
    mfaEnabled: walletConnectMainnetStagingConfig.securityRequirements.mfaRequired
  };

  const allChecksPassed = Object.values(checks).every(check => check);
  
  if (!allChecksPassed) {
    console.error('Mainnet staging deployment validation failed:', checks);
  }

  return allChecksPassed;
};
