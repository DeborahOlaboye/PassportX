import {
  mockWalletConnectProvider,
  createMockWalletConnectSession,
  createMockWalletConnectTransaction,
  loadFixture
} from '../setup';

describe('WalletConnect Integration Tests', () => {
  let provider: any;
  let sessionFixtures: any;
  let transactionFixtures: any;

  beforeAll(() => {
    sessionFixtures = loadFixture('walletconnect-session.json');
    transactionFixtures = loadFixture('walletconnect-transactions.json');
  });

  describe('Testnet WalletConnect Integration', () => {
    beforeEach(() => {
      provider = mockWalletConnectProvider('testnet');
    });

    it('should establish WalletConnect session on testnet', async () => {
      const session = createMockWalletConnectSession('testnet');
      
      expect(session.network).toBe('testnet');
      expect(session.chainId).toBe(5);
      expect(session.address).toBeDefined();
      expect(session.session.topic).toBeDefined();
    });

    it('should connect to testnet wallet', async () => {
      const result = await provider.connect();
      
      expect(result).toEqual([sessionFixtures.testnet.address]);
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should send transaction on testnet', async () => {
      const transaction = createMockWalletConnectTransaction('testnet', 'sendTransaction');
      
      expect(transaction.method).toBe('eth_sendTransaction');
      expect(transaction.params[0].from).toBe(sessionFixtures.testnet.address);
      expect(transaction.params[0].chainId).toBeUndefined();
    });

    it('should sign transaction on testnet', async () => {
      const transaction = createMockWalletConnectTransaction('testnet', 'signTransaction');
      
      expect(transaction.method).toBe('eth_signTransaction');
      expect(transaction.params[0].chainId).toBe(5);
    });

    it('should sign message on testnet', async () => {
      const transaction = createMockWalletConnectTransaction('testnet', 'personalSign');
      
      expect(transaction.method).toBe('personal_sign');
      expect(transaction.params[1]).toBe(sessionFixtures.testnet.address);
    });

    it('should sign typed data on testnet', async () => {
      const transaction = createMockWalletConnectTransaction('testnet', 'signTypedData');
      
      expect(transaction.method).toBe('eth_signTypedData');
      expect(transaction.params[1].domain.chainId).toBe(5);
    });

    it('should disconnect from testnet wallet', async () => {
      await provider.disconnect();
      
      expect(provider.disconnect).toHaveBeenCalled();
    });

    it('should validate testnet session namespaces', () => {
      const session = sessionFixtures.testnet.session;
      
      expect(session.namespaces.eip155).toBeDefined();
      expect(session.namespaces.eip155.chains).toContain('eip155:5');
      expect(session.namespaces.eip155.methods).toContain('eth_sendTransaction');
      expect(session.namespaces.eip155.methods).toContain('personal_sign');
    });

    it('should validate testnet required namespaces', () => {
      const session = sessionFixtures.testnet.session;
      
      expect(session.requiredNamespaces).toBeDefined();
      expect(session.requiredNamespaces.eip155.chains).toContain('eip155:5');
    });
  });

  describe('Mainnet WalletConnect Integration', () => {
    beforeEach(() => {
      provider = mockWalletConnectProvider('mainnet');
    });

    it('should establish WalletConnect session on mainnet', async () => {
      const session = createMockWalletConnectSession('mainnet');
      
      expect(session.network).toBe('mainnet');
      expect(session.chainId).toBe(1);
      expect(session.address).toBeDefined();
      expect(session.session.topic).toBeDefined();
    });

    it('should connect to mainnet wallet', async () => {
      const result = await provider.connect();
      
      expect(result).toEqual([sessionFixtures.mainnet.address]);
      expect(provider.connect).toHaveBeenCalled();
    });

    it('should send transaction on mainnet', async () => {
      const transaction = createMockWalletConnectTransaction('mainnet', 'sendTransaction');
      
      expect(transaction.method).toBe('eth_sendTransaction');
      expect(transaction.params[0].from).toBe(sessionFixtures.mainnet.address);
      expect(transaction.params[0].gasPrice).toBe('30000000000');
    });

    it('should sign transaction on mainnet', async () => {
      const transaction = createMockWalletConnectTransaction('mainnet', 'signTransaction');
      
      expect(transaction.method).toBe('eth_signTransaction');
      expect(transaction.params[0].chainId).toBe(1);
    });

    it('should sign message on mainnet', async () => {
      const transaction = createMockWalletConnectTransaction('mainnet', 'personalSign');
      
      expect(transaction.method).toBe('personal_sign');
      expect(transaction.params[1]).toBe(sessionFixtures.mainnet.address);
    });

    it('should sign typed data on mainnet', async () => {
      const transaction = createMockWalletConnectTransaction('mainnet', 'signTypedData');
      
      expect(transaction.method).toBe('eth_signTypedData');
      expect(transaction.params[1].domain.chainId).toBe(1);
    });

    it('should disconnect from mainnet wallet', async () => {
      await provider.disconnect();
      
      expect(provider.disconnect).toHaveBeenCalled();
    });

    it('should validate mainnet session namespaces', () => {
      const session = sessionFixtures.mainnet.session;
      
      expect(session.namespaces.eip155).toBeDefined();
      expect(session.namespaces.eip155.chains).toContain('eip155:1');
      expect(session.namespaces.eip155.methods).toContain('eth_sendTransaction');
    });

    it('should validate mainnet required namespaces', () => {
      const session = sessionFixtures.mainnet.session;
      
      expect(session.requiredNamespaces).toBeDefined();
      expect(session.requiredNamespaces.eip155.chains).toContain('eip155:1');
    });
  });

  describe('WalletConnect Provider State Management', () => {
    beforeEach(() => {
      provider = mockWalletConnectProvider('testnet');
    });

    it('should maintain connection state', () => {
      expect(provider.isConnected).toBe(true);
      expect(provider.isAuthorized).toBe(true);
    });

    it('should expose connected accounts', () => {
      expect(provider.accounts).toBeDefined();
      expect(Array.isArray(provider.accounts)).toBe(true);
      expect(provider.accounts.length).toBeGreaterThan(0);
    });

    it('should expose current chain id', () => {
      expect(provider.chainId).toBe(5);
    });

    it('should expose session information', () => {
      expect(provider.session).toBeDefined();
      expect(provider.session.topic).toBeDefined();
      expect(provider.session.relay).toBeDefined();
    });
  });

  describe('WalletConnect Error Handling', () => {
    beforeEach(() => {
      provider = mockWalletConnectProvider('testnet');
    });

    it('should handle connection failures gracefully', async () => {
      const connectError = new Error('Connection failed');
      provider.connect.mockRejectedValueOnce(connectError);

      try {
        await provider.connect();
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Connection failed');
      }
    });

    it('should handle transaction failures gracefully', async () => {
      const txError = new Error('Transaction rejected by user');
      provider.request.mockRejectedValueOnce(txError);

      try {
        await provider.request({ method: 'eth_sendTransaction' });
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Transaction rejected by user');
      }
    });

    it('should handle signing failures gracefully', async () => {
      const signError = new Error('User denied message signature');
      provider.request.mockRejectedValueOnce(signError);

      try {
        await provider.request({ method: 'personal_sign' });
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('User denied message signature');
      }
    });
  });

  describe('WalletConnect Event Handling', () => {
    beforeEach(() => {
      provider = mockWalletConnectProvider('testnet');
    });

    it('should register event listeners', () => {
      const listener = jest.fn();
      
      provider.on('connect', listener);
      
      expect(provider.on).toHaveBeenCalledWith('connect', listener);
    });

    it('should register one-time event listeners', () => {
      const listener = jest.fn();
      
      provider.once('accountsChanged', listener);
      
      expect(provider.once).toHaveBeenCalledWith('accountsChanged', listener);
    });

    it('should unregister event listeners', () => {
      const listener = jest.fn();
      
      provider.off('chainChanged', listener);
      
      expect(provider.off).toHaveBeenCalledWith('chainChanged', listener);
    });

    it('should remove specific listener', () => {
      const listener = jest.fn();
      
      provider.removeListener('connect', listener);
      
      expect(provider.removeListener).toHaveBeenCalledWith('connect', listener);
    });

    it('should clear all listeners', () => {
      provider.removeAllListeners();
      
      expect(provider.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('WalletConnect Cross-Network Support', () => {
    it('should support switching between testnet and mainnet', async () => {
      const testnetProvider = mockWalletConnectProvider('testnet');
      const mainnetProvider = mockWalletConnectProvider('mainnet');
      
      const testnetSession = createMockWalletConnectSession('testnet');
      const mainnetSession = createMockWalletConnectSession('mainnet');
      
      expect(testnetSession.chainId).not.toBe(mainnetSession.chainId);
      expect(testnetProvider.chainId).toBe(5);
      expect(mainnetProvider.chainId).toBe(1);
    });

    it('should validate transaction chain id matches network', async () => {
      const testnetTx = createMockWalletConnectTransaction('testnet', 'signTransaction');
      const mainnetTx = createMockWalletConnectTransaction('mainnet', 'signTransaction');
      
      expect(testnetTx.params[0].chainId).toBe(5);
      expect(mainnetTx.params[0].chainId).toBe(1);
    });
  });
});
