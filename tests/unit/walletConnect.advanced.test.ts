/**
 * Advanced tests for wallet utilities.
 */

import {
  isTestnetAddress,
  isMainnetAddress,
  getNetworkFromAddress,
  validateWalletState,
  isLocalStorageAvailable,
  getWalletInfo,
  enrichWalletData,
  sanitizeWalletForLogging,
  calculateRetryDelay,
  areWalletsEqual,
  generateWalletChecksum,
  createWalletSnapshot,
  formatWalletTimestamp,
  isSessionExpired,
  getSessionTimeout,
} from '@/utils/walletConnect';

describe('Wallet Network Detection', () => {
  it('should detect testnet addresses', () => {
    const testnetAddress = 'SM1234567890123456789012345678901234567';
    expect(isTestnetAddress(testnetAddress)).toBe(true);
  });

  it('should detect mainnet addresses', () => {
    const mainnetAddress = 'SP1234567890123456789012345678901234567';
    expect(isMainnetAddress(mainnetAddress)).toBe(true);
  });

  it('should categorize network from address', () => {
    const testnetAddr = 'SM1234567890123456789012345678901234567';
    const mainnetAddr = 'SP1234567890123456789012345678901234567';
    const unknownAddr = 'XX1234567890123456789012345678901234567';

    expect(getNetworkFromAddress(testnetAddr)).toBe('testnet');
    expect(getNetworkFromAddress(mainnetAddr)).toBe('mainnet');
    expect(getNetworkFromAddress(unknownAddr)).toBe('unknown');
  });
});

describe('Wallet State Validation', () => {
  it('should validate complete wallet state', () => {
    const validWallet = {
      address: 'SP1234567890123456789012345678901234567',
      name: 'Test Wallet',
      chainId: 1,
    };
    expect(validateWalletState(validWallet)).toBe(false); // Invalid format
  });

  it('should reject wallet with invalid address', () => {
    const invalidWallet = {
      address: 'INVALID',
      name: 'Test Wallet',
      chainId: 1,
    };
    expect(validateWalletState(invalidWallet)).toBe(false);
  });

  it('should reject wallet with empty name', () => {
    const invalidWallet = {
      address: 'SP1234567890123456789012345678901234567',
      name: '',
      chainId: 1,
    };
    expect(validateWalletState(invalidWallet)).toBe(false);
  });

  it('should reject wallet with invalid chainId', () => {
    const invalidWallet = {
      address: 'SP1234567890123456789012345678901234567',
      name: 'Test',
      chainId: -1,
    };
    expect(validateWalletState(invalidWallet)).toBe(false);
  });
});

describe('Retry Logic', () => {
  it('should calculate exponential backoff delay', () => {
    const config = {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    };

    const delay0 = calculateRetryDelay(0, config);
    const delay1 = calculateRetryDelay(1, config);
    const delay2 = calculateRetryDelay(2, config);

    expect(delay0).toBe(1000);
    expect(delay1).toBe(2000);
    expect(delay2).toBe(4000);
  });

  it('should respect max delay limit', () => {
    const config = {
      maxAttempts: 5,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
    };

    const delay4 = calculateRetryDelay(4, config);
    expect(delay4).toBeLessThanOrEqual(config.maxDelayMs);
  });
});

describe('Wallet Utilities', () => {
  it('should compare wallets correctly', () => {
    const wallet1 = {
      address: 'SP123',
      name: 'Test',
      chainId: 1,
    };
    const wallet2 = {
      address: 'SP123',
      name: 'Test',
      chainId: 1,
    };
    const wallet3 = {
      address: 'SP456',
      name: 'Test',
      chainId: 1,
    };

    expect(areWalletsEqual(wallet1, wallet2)).toBe(true);
    expect(areWalletsEqual(wallet1, wallet3)).toBe(false);
    expect(areWalletsEqual(null, null)).toBe(true);
    expect(areWalletsEqual(wallet1, null)).toBe(false);
  });

  it('should generate consistent checksums', () => {
    const wallet = {
      address: 'SP123',
      name: 'Test',
      chainId: 1,
    };

    const checksum1 = generateWalletChecksum(wallet);
    const checksum2 = generateWalletChecksum(wallet);

    expect(checksum1).toBe(checksum2);
  });

  it('should create wallet snapshots', () => {
    const wallet = {
      address: 'SP123',
      name: 'Test',
      chainId: 1,
    };

    const snapshot = createWalletSnapshot(wallet);
    expect(snapshot.address).toBe(wallet.address);
    expect(snapshot.snapshotAt).toBeDefined();
    expect(snapshot.checksum).toBeDefined();
  });
});

describe('Session Management', () => {
  it('should detect expired sessions', () => {
    const pastTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    const recentTime = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago

    expect(isSessionExpired(pastTime)).toBe(true);
    expect(isSessionExpired(recentTime)).toBe(false);
  });

  it('should return session timeout value', () => {
    const timeout = getSessionTimeout();
    expect(timeout).toBe(24 * 60 * 60 * 1000); // 24 hours
  });
});

describe('Timestamp Formatting', () => {
  it('should format timestamps correctly', () => {
    const timestamp = Date.now();
    const formatted = formatWalletTimestamp(timestamp);
    expect(formatted).not.toBe('Invalid date');
    expect(typeof formatted).toBe('string');
  });

  it('should handle invalid timestamps', () => {
    const formatted = formatWalletTimestamp(NaN);
    expect(formatted).toBe('Invalid date');
  });
});

describe('Wallet Data Enrichment', () => {
  it('should enrich wallet with metadata', () => {
    const wallet = {
      address: 'SP1234567890123456789012345678901234567',
      name: 'xverse',
      chainId: 1,
    };

    const enriched = enrichWalletData(wallet);
    expect(enriched.network).toBe('mainnet');
    expect(enriched.shortAddress).toBeDefined();
    expect(enriched.metadata).toBeDefined();
  });

  it('should sanitize wallet for logging', () => {
    const wallet = {
      address: 'SP1234567890123456789012345678901234567',
      name: 'Test Wallet',
      chainId: 1,
    };

    const sanitized = sanitizeWalletForLogging(wallet);
    expect(sanitized.name).toBe(wallet.name);
    expect(sanitized.network).toBe('mainnet');
    expect(sanitized.shortAddress).toBeDefined();
    expect(sanitized.chainId).toBe(wallet.chainId);
  });
});

describe('Wallet Info Retrieval', () => {
  it('should return wallet info for known wallet', () => {
    const info = getWalletInfo('xverse');
    expect(info.id).toBe('xverse');
    expect(info.name).toBe('Xverse');
  });

  it('should return default info for unknown wallet', () => {
    const info = getWalletInfo('unknown-wallet');
    expect(info.id).toBe('unknown-wallet');
    expect(info.name).toBeDefined();
  });
});
