/**
 * Test setup and configuration for contract hooks tests
 * Provides common mocks, fixtures, and utilities for all test suites
 */

import { ReactNode } from 'react';

// Mock user session data
export const mockUserSession = {
  isUserSignedIn: jest.fn(() => true),
  isSessionValid: jest.fn(() => true),
  loadUserData: jest.fn(() => ({
    profile: {
      stxAddress: {
        testnet: 'STTEST123456789TESTNETADDRESS123456',
        mainnet: 'SPTEST123456789MAINNETADDRESS123456',
      },
      name: 'Test User',
    },
  })),
  signUserOut: jest.fn(),
};

// Mock user object
export const mockUser = {
  stacksAddress: 'STTEST123456789TESTNETADDRESS123456',
  username: 'testuser',
  profileUrl: 'https://example.com/profile',
  email: 'test@example.com',
};

// Mock context value
export const mockAuthContext = {
  user: mockUser,
  userSession: mockUserSession,
  isLoading: false,
  isAuthenticated: true,
  error: null,
};

/**
 * Badge issuance test fixtures
 */
export const badgeIssuanceFixtures = {
  validParams: {
    recipientAddress: 'ST2CY5V5NWVNTZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5ZYZZ',
    templateId: 1,
    communityId: 1,
    recipientName: 'John Doe',
    recipientEmail: 'john@example.com',
  },

  validResponse: {
    txId: 'tx_0123456789abcdef0123456789abcdef',
    badgeId: 1,
  },

  successStates: [
    {
      isLoading: false,
      error: null,
      success: true,
      txId: 'tx_0123456789abcdef0123456789abcdef',
      badgeId: 1,
    },
  ],

  errorResponses: {
    userRejected: new Error('User rejected the transaction'),
    insufficientBalance: new Error('Insufficient STX balance'),
    invalidAddress: new Error('Invalid recipient address format'),
    templateNotFound: new Error('Badge template does not exist'),
    communityNotFound: new Error('Community does not exist'),
    unauthorized: new Error('Only badge issuers can issue badges'),
  },
};

/**
 * Community creation test fixtures
 */
export const communityCreationFixtures = {
  validParams: {
    name: 'Web3 Developers',
    description: 'A community for Web3 developers',
    about: 'We are passionate about building on blockchain',
    website: 'https://web3devs.com',
    stxPayment: 1000,
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#004E89',
    },
    settings: {
      allowMemberInvites: true,
      requireApproval: false,
      allowBadgeIssuance: true,
      allowCustomBadges: true,
    },
    tags: ['web3', 'developers', 'blockchain'],
  },

  minimalParams: {
    name: 'Minimal Community',
    description: 'Minimal setup community',
    stxPayment: 100,
    settings: {
      allowMemberInvites: false,
      requireApproval: true,
      allowBadgeIssuance: false,
      allowCustomBadges: false,
    },
  },

  validResponse: {
    txId: 'tx_community_0123456789abcdef',
    communityId: 1,
  },

  statusResponses: {
    success: {
      status: 'success',
      blockHeight: 50000,
      blockTime: 1672531200,
      confirmed: true,
      fee: 180,
    },

    pending: {
      status: 'pending',
      blockHeight: null,
      confirmed: false,
    },

    failed: {
      status: 'failed',
      blockHeight: 49999,
      confirmed: true,
      error: 'Insufficient STX balance',
    },
  },

  errorResponses: {
    duplicateName: new Error('Community name already taken'),
    insufficientPayment: new Error('Minimum STX payment is 100 microSTX'),
    unauthorized: new Error('You do not have permission to create communities'),
    maxLimitReached: new Error(
      'Maximum number of communities created by this user reached'
    ),
    maintenanceMode: new Error('Contract is in maintenance mode'),
    invalidName: new Error('Community name must be 3-50 characters'),
    invalidDescription: new Error(
      'Community description must be 10-500 characters'
    ),
  },
};

/**
 * Transaction test fixtures
 */
export const transactionFixtures = {
  txIds: {
    valid: 'tx_0123456789abcdef0123456789abcdef0123456789abcdef',
    invalid: 'invalid_tx_id',
    nonexistent: 'tx_0000000000000000000000000000000000000000',
  },

  blockHeights: {
    recent: 50000,
    old: 49000,
    future: 51000,
  },

  timestamps: {
    recent: Math.floor(Date.now() / 1000),
    old: 1672531200,
    future: Math.floor(Date.now() / 1000) + 86400,
  },

  fees: {
    low: 120,
    medium: 180,
    high: 250,
    custom: [140, 160, 200],
  },
};

/**
 * Network configuration fixtures
 */
export const networkFixtures = {
  testnet: {
    network: 'testnet',
    explorerUrl: 'https://testnet-explorer.stacks.co',
    apiUrl: 'https://testnet-api.stacks.co',
  },

  mainnet: {
    network: 'mainnet',
    explorerUrl: 'https://explorer.stacks.co',
    apiUrl: 'https://api.stacks.co',
  },
};

/**
 * Error simulation utilities
 */
export const errorSimulation = {
  /**
   * Simulates a failed transaction
   */
  createFailedTransaction: (reason: string) => ({
    txId: `tx_failed_${Date.now()}`,
    status: 'failed',
    error: reason,
  }),

  /**
   * Simulates a timeout
   */
  createTimeoutError: (duration: number = 30000) =>
    new Error(`Request timeout after ${duration}ms`),

  /**
   * Simulates a network error
   */
  createNetworkError: (message: string = 'Network error') =>
    new Error(`Failed to connect to blockchain: ${message}`),

  /**
   * Simulates a validation error
   */
  createValidationError: (field: string, reason: string) =>
    new Error(`Validation error: ${field} - ${reason}`),

  /**
   * Simulates a contract revert
   */
  createContractRevert: (errorCode: string) =>
    new Error(`Contract revert: ${errorCode}`),
};

/**
 * Mock implementations for contract managers
 */
export const contractManagerMocks = {
  /**
   * Creates a mock BadgeIssuerManager
   */
  createBadgeIssuerManager: (overrides = {}) => ({
    issueBadge: jest.fn().mockResolvedValue({
      txId: 'tx_badge_123',
      badgeId: 1,
      ...overrides,
    }),
    revokeBadge: jest.fn().mockResolvedValue({
      txId: 'tx_revoke_123',
      badgeId: 1,
    }),
    getBadgeDetails: jest.fn().mockResolvedValue({
      id: 1,
      templateId: 1,
      recipientAddress: 'ST123',
      issuedAt: Date.now(),
      revokedAt: null,
    }),
    validateBadge: jest.fn().mockResolvedValue(true),
  }),

  /**
   * Creates a mock CommunityContractManager
   */
  createCommunityManager: (overrides = {}) => ({
    createCommunity: jest.fn().mockResolvedValue({
      txId: 'tx_community_123',
      communityId: 1,
      ...overrides,
    }),
    updateCommunity: jest.fn().mockResolvedValue({
      txId: 'tx_update_123',
      communityId: 1,
    }),
    validateTransactionStatus: jest.fn().mockResolvedValue({
      status: 'success',
      blockHeight: 50000,
      confirmed: true,
    }),
    getCommunityDetails: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Community',
      owner: 'ST123',
      createdAt: Date.now(),
    }),
  }),
};

/**
 * Wait utilities for async tests
 */
export const waitUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: (condition: () => boolean, timeout = 5000, interval = 100) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (condition()) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Condition not met within timeout'));
        }
      }, interval);
    });
  },

  /**
   * Wait for state update
   */
  waitForStateUpdate: (
    stateGetter: () => any,
    expectedValue: any,
    timeout = 5000
  ) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (stateGetter() === expectedValue) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(
            new Error(`State did not reach expected value: ${expectedValue}`)
          );
        }
      }, 100);
    });
  },
};

/**
 * Assertion utilities
 */
export const assertions = {
  /**
   * Verify successful transaction state
   */
  assertSuccessfulTransaction: (result: any) => {
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
    expect(result.success).toBe(true);
    expect(result.txId).toBeDefined();
    expect(result.txId).not.toBeNull();
  },

  /**
   * Verify failed transaction state
   */
  assertFailedTransaction: (result: any, expectedError?: string) => {
    expect(result.isLoading).toBe(false);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    if (expectedError) {
      expect(result.error).toContain(expectedError);
    }
  },

  /**
   * Verify loading state
   */
  assertLoadingState: (result: any) => {
    expect(result.isLoading).toBe(true);
  },

  /**
   * Verify reset state
   */
  assertResetState: (result: any) => {
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
    expect(result.success).toBe(false);
    expect(result.txId).toBeNull();
  },
};

/**
 * Test data generators
 */
export const testDataGenerators = {
  /**
   * Generate random Stacks address
   */
  generateStacksAddress: (network: 'testnet' | 'mainnet' = 'testnet') => {
    const prefix = network === 'mainnet' ? 'SP' : 'ST';
    const randomPart = Array.from({ length: 39 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    return `${prefix}${randomPart.toUpperCase().slice(0, 39)}`;
  },

  /**
   * Generate random transaction ID
   */
  generateTransactionId: () => {
    return `tx_${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
  },

  /**
   * Generate random badge ID
   */
  generateBadgeId: () => Math.floor(Math.random() * 1000000),

  /**
   * Generate random community ID
   */
  generateCommunityId: () => Math.floor(Math.random() * 10000),

  /**
   * Generate test badge issuance params
   */
  generateBadgeParams: (overrides = {}) => ({
    recipientAddress: this.generateStacksAddress(),
    templateId: Math.floor(Math.random() * 100),
    communityId: Math.floor(Math.random() * 100),
    ...overrides,
  }),

  /**
   * Generate test community params
   */
  generateCommunityParams: (overrides = {}) => ({
    name: `Test Community ${Math.random().toString(36).slice(2, 9)}`,
    description: 'A test community',
    stxPayment: Math.floor(Math.random() * 5000) + 100,
    settings: {
      allowMemberInvites: Math.random() > 0.5,
      requireApproval: Math.random() > 0.5,
      allowBadgeIssuance: Math.random() > 0.5,
      allowCustomBadges: Math.random() > 0.5,
    },
    ...overrides,
  }),
};

export default {
  mockUserSession,
  mockUser,
  mockAuthContext,
  badgeIssuanceFixtures,
  communityCreationFixtures,
  transactionFixtures,
  networkFixtures,
  errorSimulation,
  contractManagerMocks,
  waitUtils,
  assertions,
  testDataGenerators,
};
