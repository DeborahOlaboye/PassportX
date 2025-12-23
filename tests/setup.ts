// Test setup file
import { readFileSync } from 'fs';
import { join } from 'path';

// Load test fixtures
export const loadFixture = (filename: string) => {
  const filePath = join(__dirname, 'fixtures', filename);
  return JSON.parse(readFileSync(filePath, 'utf8'));
};

// Mock Stacks API responses
export const mockStacksApi = {
  getAccountInfo: jest.fn(),
  getContractInfo: jest.fn(),
  callReadOnlyFunction: jest.fn(),
  broadcastTransaction: jest.fn()
};

// Mock WalletConnect responses
export const mockWalletConnect = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendTransaction: jest.fn(),
  signTransaction: jest.fn(),
  signMessage: jest.fn(),
  signTypedData: jest.fn(),
  getSession: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn()
};

// Test utilities
export const createMockUser = (address: string) => ({
  address,
  badges: [],
  communities: []
});

export const createMockBadge = (id: number, templateId: number) => ({
  id,
  templateId,
  owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  metadata: {
    level: 1,
    category: 1,
    timestamp: Date.now(),
    active: true
  }
});

// WalletConnect test utilities
export const createMockWalletConnectSession = (network: 'testnet' | 'mainnet') => {
  const fixtures = loadFixture('walletconnect-session.json');
  return fixtures[network];
};

export const createMockWalletConnectTransaction = (network: 'testnet' | 'mainnet', type: string) => {
  const fixtures = loadFixture('walletconnect-transactions.json');
  return fixtures[network][type];
};

export const mockWalletConnectProvider = (network: 'testnet' | 'mainnet' = 'testnet') => {
  const session = createMockWalletConnectSession(network);
  return {
    connect: jest.fn().mockResolvedValue([session.address]),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isConnected: true,
    isAuthorized: true,
    accounts: [session.address],
    chainId: session.chainId,
    request: jest.fn().mockResolvedValue('0x'),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    session: session.session
  };
};