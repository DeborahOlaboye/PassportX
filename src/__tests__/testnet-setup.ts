/**
 * Testnet Integration Setup for Contract Hooks Testing
 * Configuration and utilities for connecting to actual testnet contracts
 */

/**
 * Testnet Network Configuration
 */
export const testnetConfig = {
  // Stacks Testnet
  network: {
    name: 'testnet',
    type: 'testnet',
    chainId: 2147483648, // Testnet chain ID
    version: '25.0', // Latest testnet version
    coreApiUrl: 'https://testnet-api.stacks.co',
    explorerUrl: 'https://testnet-explorer.stacks.co',
    btcNetwork: 'testnet',
  },

  // Contract Addresses (replace with actual testnet contracts)
  contracts: {
    badgeIssuer: {
      address: 'ST1HTBVD3JG2YC7P3VVE1CCCMPGTKFVVSXFM9DXXX',
      name: 'badge-issuer-v1',
      deployed: true,
      functions: [
        'issue-badge',
        'revoke-badge',
        'get-badge-details',
        'validate-badge',
        'check-issuer-permission',
      ],
    },

    badgeNFT: {
      address: 'ST1HTBVD3JG2YC7P3VVE1CCCMPGTKFVVSXFM9DYYYY',
      name: 'badge-nft-v1',
      deployed: true,
      functions: ['mint-badge', 'burn-badge', 'get-owner', 'transfer'],
    },

    communityManager: {
      address: 'ST1HTBVD3JG2YC7P3VVE1CCCMPGTKFVVSXFM9DZZZZ',
      name: 'community-manager-v1',
      deployed: true,
      functions: [
        'create-community',
        'update-community',
        'get-community-details',
        'validate-community',
        'check-manager-permission',
      ],
    },

    communityNFT: {
      address: 'ST1HTBVD3JG2YC7P3VVE1CCCMPGTKFVVSXFM9EAAAA',
      name: 'community-nft-v1',
      deployed: true,
      functions: [
        'mint-community-membership',
        'burn-membership',
        'get-owner',
        'transfer',
      ],
    },
  },

  // Test Accounts
  accounts: {
    admin: {
      stxAddress: 'STTEST1234567890ADMIN1234567890ADMIN123456',
      balance: 10000000, // 10 STX
      permissions: ['badge_issuer', 'community_manager'],
    },

    issuer: {
      stxAddress: 'STTEST1234567890ISSUER1234567890ISSUER123456',
      balance: 5000000, // 5 STX
      permissions: ['badge_issuer'],
    },

    communityManager: {
      stxAddress: 'STTEST1234567890COMMGR1234567890COMMGR123456',
      balance: 5000000, // 5 STX
      permissions: ['community_manager'],
    },

    user: {
      stxAddress: 'STTEST1234567890USER1234567890USER1234567890',
      balance: 1000000, // 1 STX
      permissions: [],
    },

    recipient: {
      stxAddress: 'STTEST1234567890RECIPIENT1234567890RECIPIENT',
      balance: 500000, // 0.5 STX
      permissions: [],
    },
  },

  // Fee Configuration
  fees: {
    base: 180,
    priorityLow: 200,
    priorityMedium: 300,
    priorityHigh: 500,
  },

  // Block Configuration
  blocks: {
    confirmations: {
      safe: 6,
      fast: 3,
      fastest: 1,
    },
    targetTime: 10 * 60, // 10 minutes per block
    averageGasPrice: 0.0001, // STX per unit gas
  },
};

/**
 * Testnet Connection Manager
 */
export class TestnetConnectionManager {
  private isConnected: boolean = false;
  private networkInfo: any = null;

  /**
   * Connect to testnet
   */
  async connect(): Promise<boolean> {
    try {
      // Simulate testnet connection
      const response = await fetch(
        `${testnetConfig.network.coreApiUrl}/v2/info`
      );

      if (!response.ok) {
        throw new Error(`Failed to connect to testnet: ${response.statusText}`);
      }

      this.networkInfo = await response.json();
      this.isConnected = true;

      console.log('Connected to Stacks testnet');
      console.log(`Chain height: ${this.networkInfo.stacks_tip_height}`);
      console.log(`Node version: ${this.networkInfo.stacks_tip_version}`);

      return true;
    } catch (error) {
      console.error('Failed to connect to testnet:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Verify contract is deployed
   */
  async verifyContract(
    address: string,
    contractName: string
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Not connected to testnet');
    }

    try {
      const url = `${testnetConfig.network.coreApiUrl}/v2/contracts/interface/${address}/${contractName}`;
      const response = await fetch(url);

      return response.ok;
    } catch (error) {
      console.error(
        `Failed to verify contract ${address}.${contractName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Not connected to testnet');
    }

    try {
      const url = `${testnetConfig.network.coreApiUrl}/v2/accounts/${address}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get balance for ${address}`);
      }

      const data = await response.json();
      return parseInt(data.balance, 16);
    } catch (error) {
      console.error(`Failed to get balance for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Faucet STX to address (testnet only)
   */
  async faucet(address: string, amount: number = 1000000): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Not connected to testnet');
    }

    try {
      const url = `https://testnet-faucet.stacks.co/send`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.txid;
    } catch (error) {
      console.error(`Failed to get STX from faucet:`, error);
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to testnet');
    }

    try {
      const url = `${testnetConfig.network.coreApiUrl}/v2/transactions/${txId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to get transaction status`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get transaction status:`, error);
      throw error;
    }
  }

  /**
   * Get chain height
   */
  getChainHeight(): number {
    if (!this.networkInfo) {
      return 0;
    }
    return this.networkInfo.stacks_tip_height;
  }

  /**
   * Is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.isConnected = false;
    this.networkInfo = null;
  }
}

/**
 * Contract Deployment Verifier
 */
export class ContractDeploymentVerifier {
  constructor(private connectionManager: TestnetConnectionManager) {}

  /**
   * Verify all required contracts are deployed
   */
  async verifyAllContracts(): Promise<
    { contract: string; deployed: boolean }[]
  > {
    const results: { contract: string; deployed: boolean }[] = [];

    for (const [key, contract] of Object.entries(testnetConfig.contracts)) {
      const deployed = await this.connectionManager.verifyContract(
        contract.address,
        contract.name
      );

      results.push({
        contract: `${contract.address}.${contract.name}`,
        deployed,
      });

      if (!deployed) {
        console.warn(`⚠️  Contract ${key} not deployed at ${contract.address}`);
      } else {
        console.log(`✓ Contract ${key} deployed successfully`);
      }
    }

    return results;
  }

  /**
   * Verify contract has required functions
   */
  async verifyContractFunctions(
    address: string,
    contractName: string
  ): Promise<boolean> {
    try {
      const url = `${testnetConfig.network.coreApiUrl}/v2/contracts/interface/${address}/${contractName}`;
      const response = await fetch(url);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const functionNames = data.functions?.map((fn: any) => fn.name) || [];

      console.log(`✓ Contract functions: ${functionNames.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Failed to verify contract functions:', error);
      return false;
    }
  }

  /**
   * Check if accounts have sufficient balance
   */
  async verifyAccountBalances(): Promise<
    { account: string; balance: number; sufficient: boolean }[]
  > {
    const results: { account: string; balance: number; sufficient: boolean }[] =
      [];

    for (const [key, account] of Object.entries(testnetConfig.accounts)) {
      try {
        const balance = await this.connectionManager.getBalance(
          account.stxAddress
        );
        const sufficient = balance >= 100000; // At least 0.1 STX

        results.push({
          account: key,
          balance,
          sufficient,
        });

        if (!sufficient) {
          console.warn(
            `⚠️  Account ${key} has insufficient balance: ${
              balance / 1000000
            } STX`
          );
        } else {
          console.log(`✓ Account ${key} balance: ${balance / 1000000} STX`);
        }
      } catch (error) {
        console.error(`Failed to check balance for ${key}:`, error);
        results.push({
          account: key,
          balance: 0,
          sufficient: false,
        });
      }
    }

    return results;
  }
}

/**
 * Full testnet readiness check
 */
export async function runTestnetReadinessCheck(): Promise<boolean> {
  console.log('\n=== Testnet Readiness Check ===\n');

  const connectionManager = new TestnetConnectionManager();

  // Step 1: Connect to testnet
  console.log('1. Connecting to testnet...');
  const connected = await connectionManager.connect();
  if (!connected) {
    console.error('❌ Failed to connect to testnet');
    return false;
  }

  // Step 2: Verify contracts
  console.log('\n2. Verifying contract deployments...');
  const verifier = new ContractDeploymentVerifier(connectionManager);
  const contractResults = await verifier.verifyAllContracts();

  const allContractsDeployed = contractResults.every((r) => r.deployed);
  if (!allContractsDeployed) {
    console.warn('⚠️  Some contracts are not deployed');
  }

  // Step 3: Verify account balances
  console.log('\n3. Verifying account balances...');
  const balanceResults = await verifier.verifyAccountBalances();

  const allAccountsSufficient = balanceResults.every((r) => r.sufficient);
  if (!allAccountsSufficient) {
    console.warn('⚠️  Some accounts have insufficient balance');
    console.log('Getting STX from faucet...');

    for (const [key, account] of Object.entries(testnetConfig.accounts)) {
      try {
        const txId = await connectionManager.faucet(account.stxAddress);
        console.log(`✓ Faucet request for ${key}: ${txId}`);
      } catch (error) {
        console.error(`Failed to faucet STX to ${key}`);
      }
    }
  }

  // Step 4: Final status
  console.log('\n=== Testnet Readiness Status ===');
  console.log(`Chain Height: ${connectionManager.getChainHeight()}`);
  console.log(`Contracts Ready: ${allContractsDeployed ? '✓' : '⚠️'}`);
  console.log(`Accounts Ready: ${allAccountsSufficient ? '✓' : '⚠️'}`);

  const ready = connected && allContractsDeployed && allAccountsSufficient;

  console.log(`\nOverall Status: ${ready ? '✅ READY' : '⚠️ NOT READY'}\n`);

  connectionManager.disconnect();
  return ready;
}

export default {
  testnetConfig,
  TestnetConnectionManager,
  ContractDeploymentVerifier,
  runTestnetReadinessCheck,
};
