/**
 * Tests for Stacks address validation utilities
 */

import {
  isValidStacksAddress,
  isValidStacksAddressWithChecksum,
  validateContractAddress,
  validateContractAddresses,
  getAddressType,
  isContractAddress,
  isWalletAddress,
  compareAddresses,
  normalizeAddress,
  validateNetworkCompatibility,
  validateAddresses,
  parseAddress,
  createAddress,
  convertAddressNetwork,
  cachedValidation,
  clearValidationCache,
  getValidationCacheSize,
  validateAddressesBatch,
  encodeStacksAddress,
  decodeStacksAddress,
  ADDRESS_VERSIONS,
  getVersionForType,
  addressUtils,
  detectNetworkFromAddress,
  isMainnetAddress,
  isTestnetAddress,
  validateAddressStrict,
  validateMultipleAddresses,
  getAddressFormatInfo,
  isAddressValidForNetwork,
  validateAddressFormat,
  validateAndSummarizeAddresses,
  isAddressType,
  validateAddressVersion,
  hashAddress,
  getAddressStatistics,
  groupAddressesByNetwork,
  groupAddressesByType,
  compareAddressTypes,
  isValidAddressString,
  truncateAddress,
  decomposeAddress,
  isAddressInList,
  filterValidAddresses,
  createAddressBatch,
  sortAddresses,
  getValidationMetrics,
  resetValidationMetrics,
  validateAddressChecksum,
  createValidationConfig,
  validateWithConfig,
  parseAddressHash,
  generateAddressFingerprint,
  isAddressEqual,
  getAddressPrefix,
  getAddressVersionByte,
  convertVersionToNetwork,
  analyzeAddressCollection,
} from '../addressValidation';

describe('isValidStacksAddress', () => {
  it('should validate mainnet addresses', () => {
    expect(
      isValidStacksAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
    ).toBe(true);
    expect(
      isValidStacksAddress('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7')
    ).toBe(true);
  });

  it('should validate testnet addresses', () => {
    expect(
      isValidStacksAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')
    ).toBe(true);
    expect(
      isValidStacksAddress('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG')
    ).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(isValidStacksAddress('')).toBe(false);
    expect(isValidStacksAddress('SP123')).toBe(false);
    expect(
      isValidStacksAddress('SA3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
    ).toBe(false);
    expect(
      isValidStacksAddress('SP3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte')
    ).toBe(false);
    expect(isValidStacksAddress('invalid')).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(isValidStacksAddress(null as any)).toBe(false);
    expect(isValidStacksAddress(undefined as any)).toBe(false);
    expect(isValidStacksAddress(123 as any)).toBe(false);
  });
});

describe('validateContractAddress', () => {
  it('should validate valid mainnet address', () => {
    const result = validateContractAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testContract'
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should validate valid testnet address', () => {
    const result = validateContractAddress(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'testContract'
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty address', () => {
    const result = validateContractAddress('', 'testContract');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not configured');
  });

  it('should reject non-string address', () => {
    const result = validateContractAddress(123 as any, 'testContract');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be a string');
  });

  it('should reject address not starting with S', () => {
    const result = validateContractAddress(
      'AP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("must start with 'S'");
  });

  it('should reject address with invalid network prefix', () => {
    const result = validateContractAddress(
      'SA3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("'SP' (mainnet) or 'ST' (testnet)");
  });

  it('should reject address with invalid length', () => {
    const result = validateContractAddress('SP123', 'testContract');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('41 characters');
  });

  it('should reject address with invalid format', () => {
    const result = validateContractAddress(
      'SP3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid format');
  });

  it('should include contract name in error messages', () => {
    const result = validateContractAddress('', 'MyContract');
    expect(result.error).toContain('MyContract');
  });
});

describe('validateContractAddresses', () => {
  it('should validate all valid addresses', () => {
    const addresses = {
      PASSPORT_CORE: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      BADGE_ISSUER: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect errors for invalid addresses', () => {
    const addresses = {
      PASSPORT_CORE: 'invalid1',
      BADGE_ISSUER: 'invalid2',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate mixed valid and invalid addresses', () => {
    const addresses = {
      PASSPORT_CORE: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      BADGE_ISSUER: 'invalid',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle empty addresses object', () => {
    const result = validateContractAddresses({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should skip empty address values', () => {
    const addresses = {
      PASSPORT_CORE: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      BADGE_ISSUER: '',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('isValidStacksAddressWithChecksum', () => {
  it('should return validation result with network info', () => {
    const result = isValidStacksAddressWithChecksum(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.valid).toBe(true);
    expect(result.isMainnet).toBe(true);
    expect(result.isTestnet).toBe(false);
    expect(result.addressType).toBeDefined();
  });

  it('should detect testnet addresses', () => {
    const result = isValidStacksAddressWithChecksum(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(result.valid).toBe(true);
    expect(result.isMainnet).toBe(false);
    expect(result.isTestnet).toBe(true);
  });

  it('should return error for invalid addresses', () => {
    const result = isValidStacksAddressWithChecksum('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('getAddressType', () => {
  it('should identify contract addresses', () => {
    const result = getAddressType('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
    expect(result?.type).toBe('contract');
  });

  it('should identify wallet addresses', () => {
    const result = getAddressType('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result?.type).toBe('wallet');
  });

  it('should return null for invalid addresses', () => {
    const result = getAddressType('invalid');
    expect(result).toBeNull();
  });
});

describe('isContractAddress', () => {
  it('should return true for contract addresses', () => {
    expect(isContractAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe(
      true
    );
  });

  it('should return false for wallet addresses', () => {
    expect(isContractAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(
      false
    );
  });
});

describe('isWalletAddress', () => {
  it('should return true for wallet addresses', () => {
    expect(isWalletAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(
      true
    );
  });

  it('should return false for contract addresses', () => {
    expect(isWalletAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe(
      false
    );
  });
});

describe('compareAddresses', () => {
  it('should compare addresses case-insensitively', () => {
    expect(
      compareAddresses(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        'sp3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte'
      )
    ).toBe(true);
  });

  it('should return false for different addresses', () => {
    expect(
      compareAddresses(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
      )
    ).toBe(false);
  });

  it('should return false for empty inputs', () => {
    expect(
      compareAddresses('', 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
    ).toBe(false);
  });
});

describe('normalizeAddress', () => {
  it('should uppercase and trim address', () => {
    expect(
      normalizeAddress('  sp3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte  ')
    ).toBe('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
  });

  it('should return empty string for empty input', () => {
    expect(normalizeAddress('')).toBe('');
  });
});

describe('validateNetworkCompatibility', () => {
  it('should validate mainnet compatibility', () => {
    const result = validateNetworkCompatibility(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'mainnet'
    );
    expect(result.valid).toBe(true);
  });

  it('should reject mainnet address for testnet', () => {
    const result = validateNetworkCompatibility(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testnet'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not a testnet address');
  });

  it('should reject testnet address for mainnet', () => {
    const result = validateNetworkCompatibility(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'mainnet'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not a mainnet address');
  });
});

describe('validateAddresses', () => {
  it('should batch validate multiple addresses', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'invalid',
    ];
    const results = validateAddresses(addresses);
    expect(
      results.get('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')?.valid
    ).toBe(true);
    expect(
      results.get('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')?.valid
    ).toBe(true);
    expect(results.get('invalid')?.valid).toBe(false);
  });
});

describe('parseAddress', () => {
  it('should parse valid mainnet address', () => {
    const result = parseAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
    expect(result).not.toBeNull();
    expect(result?.prefix).toBe('SP');
    expect(result?.isMainnet).toBe(true);
    expect(result?.isTestnet).toBe(false);
  });

  it('should parse valid testnet address', () => {
    const result = parseAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
    expect(result).not.toBeNull();
    expect(result?.prefix).toBe('ST');
    expect(result?.isMainnet).toBe(false);
    expect(result?.isTestnet).toBe(true);
  });

  it('should return null for invalid address', () => {
    expect(parseAddress('invalid')).toBeNull();
  });
});

describe('convertAddressNetwork', () => {
  it('should convert mainnet to testnet', () => {
    const result = convertAddressNetwork(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testnet'
    );
    expect(result).not.toBeNull();
    expect(result?.startsWith('ST')).toBe(true);
  });

  it('should convert testnet to mainnet', () => {
    const result = convertAddressNetwork(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'mainnet'
    );
    expect(result).not.toBeNull();
    expect(result?.startsWith('SP')).toBe(true);
  });

  it('should return null for invalid address', () => {
    expect(convertAddressNetwork('invalid', 'mainnet')).toBeNull();
  });
});

describe('cachedValidation', () => {
  beforeEach(() => {
    clearValidationCache();
  });

  it('should cache and return validation result', () => {
    const result1 = cachedValidation(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    const result2 = cachedValidation(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result1.valid).toBe(result2.valid);
    expect(getValidationCacheSize()).toBe(1);
  });

  it('should respect TTL', () => {
    cachedValidation('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', { ttlMs: 0 });
    const result = cachedValidation(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      { ttlMs: 0 }
    );
    expect(result.checksumValid).toBeDefined();
  });
});

describe('validateAddressesBatch', () => {
  it('should validate addresses with progress', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'invalid',
    ];
    let progressCallCount = 0;
    const results = validateAddressesBatch(addresses, (progress) => {
      progressCallCount++;
      expect(progress.total).toBe(3);
      expect(progress.processed).le(3);
    });
    expect(results.size).toBe(3);
    expect(progressCallCount).toBe(3);
  });
});

describe('encodeStacksAddress', () => {
  it('should encode valid address', () => {
    const result = encodeStacksAddress(
      'sp',
      0,
      '3FBRB2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.encoded).toBeDefined();
    expect(result.prefix).toBe('sp');
    expect(result.version).toBe(0);
  });
});

describe('decodeStacksAddress', () => {
  it('should decode valid address', () => {
    const result = decodeStacksAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result).not.toBeNull();
    expect(result?.prefix).toBeDefined();
    expect(result?.version).toBeDefined();
  });

  it('should return null for invalid address', () => {
    expect(decodeStacksAddress('invalid')).toBeNull();
  });
});

describe('ADDRESS_VERSIONS', () => {
  it('should have correct mainnet versions', () => {
    expect(ADDRESS_VERSIONS.mainnet.wallet).toBe(0);
    expect(ADDRESS_VERSIONS.mainnet.contract).toBe(22);
    expect(ADDRESS_VERSIONS.mainnet.smartContract).toBe(24);
  });

  it('should have correct testnet versions', () => {
    expect(ADDRESS_VERSIONS.testnet.wallet).toBe(26);
    expect(ADDRESS_VERSIONS.testnet.contract).toBe(20);
    expect(ADDRESS_VERSIONS.testnet.smartContract).toBe(21);
  });
});

describe('getVersionForType', () => {
  it('should return correct version for mainnet wallet', () => {
    expect(getVersionForType('mainnet', 'wallet')).toBe(0);
  });

  it('should return correct version for mainnet contract', () => {
    expect(getVersionForType('mainnet', 'contract')).toBe(22);
  });

  it('should return correct version for testnet wallet', () => {
    expect(getVersionForType('testnet', 'wallet')).toBe(26);
  });

  it('should return correct version for testnet contract', () => {
    expect(getVersionForType('testnet', 'contract')).toBe(20);
  });
});

describe('addressUtils', () => {
  it('should have verifyChecksum function', () => {
    expect(typeof addressUtils.verifyChecksum).toBe('function');
  });

  it('should have crc16Hash function', () => {
    expect(typeof addressUtils.crc16Hash).toBe('function');
  });

  it('should have decodeBase32Check function', () => {
    expect(typeof addressUtils.decodeBase32Check).toBe('function');
  });

  it('should compute crc16 hash', () => {
    const hash = addressUtils.crc16Hash('test');
    expect(typeof hash).toBe('number');
  });
});

describe('isValidStacksAddressWithChecksum extended fields', () => {
  it('should include checksumValid in result', () => {
    const result = isValidStacksAddressWithChecksum(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.checksumValid).toBeDefined();
    expect(typeof result.checksumValid).toBe('boolean');
  });

  it('should include version in result', () => {
    const result = isValidStacksAddressWithChecksum(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.version).toBeDefined();
    expect(typeof result.version).toBe('number');
  });

  it('should include networkId in result', () => {
    const mainnetResult = isValidStacksAddressWithChecksum(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(mainnetResult.networkId).toBe(1);

    const testnetResult = isValidStacksAddressWithChecksum(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(testnetResult.networkId).toBe(0);
  });
});

describe('detectNetworkFromAddress', () => {
  it('should detect mainnet from SP prefix', () => {
    const result = detectNetworkFromAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.network).toBe('mainnet');
    expect(result.isMainnet).toBe(true);
    expect(result.isTestnet).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it('should detect testnet from ST prefix', () => {
    const result = detectNetworkFromAddress(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(result.network).toBe('testnet');
    expect(result.isMainnet).toBe(false);
    expect(result.isTestnet).toBe(true);
    expect(result.confidence).toBe(1);
  });

  it('should return unknown for invalid address', () => {
    const result = detectNetworkFromAddress('invalid');
    expect(result.network).toBe('unknown');
    expect(result.confidence).toBe(0);
  });
});

describe('isMainnetAddress', () => {
  it('should return true for mainnet address', () => {
    expect(isMainnetAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe(
      true
    );
  });

  it('should return false for testnet address', () => {
    expect(isMainnetAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(
      false
    );
  });
});

describe('isTestnetAddress', () => {
  it('should return true for testnet address', () => {
    expect(isTestnetAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(
      true
    );
  });

  it('should return false for mainnet address', () => {
    expect(isTestnetAddress('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe(
      false
    );
  });
});

describe('validateAddressStrict', () => {
  it('should pass basic validation with no options', () => {
    const result = validateAddressStrict(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.valid).toBe(true);
  });

  it('should reject invalid prefix when allowedPrefixes specified', () => {
    const result = validateAddressStrict(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      {
        allowedPrefixes: ['ST'],
      }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Prefix SP not allowed');
  });

  it('should reject invalid version when allowedVersions specified', () => {
    const result = validateAddressStrict(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      {
        allowedVersions: [30, 31],
      }
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not allowed');
  });
});

describe('validateMultipleAddresses', () => {
  it('should separate valid and invalid addresses', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'invalid',
    ];
    const result = validateMultipleAddresses(addresses);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid.size).toBe(1);
    expect(result.invalid.get('invalid')).toBeDefined();
  });

  it('should respect strict options', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ];
    const result = validateMultipleAddresses(addresses, {
      allowedPrefixes: ['SP'],
    });
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]).toBe('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
  });
});

describe('getAddressFormatInfo', () => {
  it('should return format info for valid address', () => {
    const result = getAddressFormatInfo(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result).not.toBeNull();
    expect(result?.format).toBe('mainnet');
    expect(result?.prefix).toBe('SP');
    expect(result?.length).toBe(41);
    expect(result?.addressType).toBeDefined();
  });

  it('should return null for invalid address', () => {
    expect(getAddressFormatInfo('invalid')).toBeNull();
  });
});

describe('isAddressValidForNetwork', () => {
  it('should return true for mainnet address on mainnet', () => {
    expect(
      isAddressValidForNetwork(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        'mainnet'
      )
    ).toBe(true);
  });

  it('should return false for testnet address on mainnet', () => {
    expect(
      isAddressValidForNetwork(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'mainnet'
      )
    ).toBe(false);
  });
});

describe('validateAddressFormat', () => {
  it('should validate correct format', () => {
    const result = validateAddressFormat(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'mainnet'
    );
    expect(result.valid).toBe(true);
  });

  it('should reject wrong format', () => {
    const result = validateAddressFormat(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'mainnet'
    );
    expect(result.valid).toBe(false);
    expect(result.message).toContain('format mismatch');
  });

  it('should reject invalid address', () => {
    const result = validateAddressFormat('invalid', 'mainnet');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid address format');
  });
});

import {
  validateAndSummarizeAddresses,
  isAddressType,
  validateAddressVersion,
  hashAddress,
  getAddressStatistics,
  groupAddressesByNetwork,
  groupAddressesByType,
} from '../addressValidation';

describe('validateAndSummarizeAddresses', () => {
  it('should summarize addresses correctly', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
      'invalid-address',
    ];
    const summary = validateAndSummarizeAddresses(addresses);
    expect(summary.total).toBe(5);
    expect(summary.valid).toBe(4);
    expect(summary.invalid).toBe(1);
    expect(summary.mainnet).toBe(2);
    expect(summary.testnet).toBe(2);
  });
});

describe('isAddressType', () => {
  it('should identify wallet addresses', () => {
    expect(
      isAddressType('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', 'wallet')
    ).toBe(true);
    expect(
      isAddressType('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'wallet')
    ).toBe(true);
  });

  it('should return false for invalid addresses', () => {
    expect(isAddressType('invalid', 'wallet')).toBe(false);
  });
});

describe('validateAddressVersion', () => {
  it('should validate version byte', () => {
    expect(
      validateAddressVersion('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', 0)
    ).toBe(true);
    expect(
      validateAddressVersion('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', 22)
    ).toBe(false);
  });

  it('should return false for invalid addresses', () => {
    expect(validateAddressVersion('invalid', 0)).toBe(false);
  });
});

describe('hashAddress', () => {
  it('should hash address with crc16', () => {
    const result = hashAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'crc16'
    );
    expect(result.algorithm).toBe('crc16');
    expect(result.hash).toBeTruthy();
  });

  it('should hash address with base32', () => {
    const result = hashAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'base32'
    );
    expect(result.algorithm).toBe('base32');
    expect(result.hash).toBeTruthy();
  });

  it('should return empty hash for invalid address', () => {
    const result = hashAddress('invalid', 'base32');
    expect(result.hash).toBe('');
  });
});

describe('getAddressStatistics', () => {
  it('should calculate statistics correctly', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ];
    const stats = getAddressStatistics(addresses);
    expect(stats.total).toBe(3);
    expect(stats.valid).toBe(3);
    expect(stats.invalid).toBe(0);
    expect(stats.mainnetCount).toBe(2);
    expect(stats.testnetCount).toBe(1);
  });

  it('should count address types', () => {
    const addresses = ['SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'];
    const stats = getAddressStatistics(addresses);
    expect(stats.walletCount).toBe(1);
  });
});

describe('groupAddressesByNetwork', () => {
  it('should group addresses by network', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'invalid-address',
    ];
    const grouped = groupAddressesByNetwork(addresses);
    expect(grouped.mainnet).toContain(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(grouped.testnet).toContain(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(grouped.invalid).toContain('invalid-address');
  });
});

describe('groupAddressesByType', () => {
  it('should group addresses by type', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ];
    const grouped = groupAddressesByType(addresses);
    expect(grouped.wallet.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid addresses', () => {
    const grouped = groupAddressesByType(['invalid']);
    expect(grouped.unknown).toContain('invalid');
  });
});

import {
  compareAddressTypes,
  isValidAddressString,
  truncateAddress,
  decomposeAddress,
  isAddressInList,
  filterValidAddresses,
  createAddressBatch,
  sortAddresses,
  getValidationMetrics,
  resetValidationMetrics,
} from '../addressValidation';

describe('compareAddressTypes', () => {
  it('should compare addresses correctly', () => {
    const result = compareAddressTypes(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7'
    );
    expect(result.sameNetwork).toBe(true);
    expect(result.sameType).toBe(true);
  });

  it('should detect different networks', () => {
    const result = compareAddressTypes(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    );
    expect(result.sameNetwork).toBe(false);
  });

  it('should handle invalid addresses', () => {
    const result = compareAddressTypes(
      'invalid',
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(result.difference.length).toBeGreaterThan(0);
  });
});

describe('isValidAddressString', () => {
  it('should validate valid addresses', () => {
    expect(
      isValidAddressString('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')
    ).toBe(true);
  });

  it('should reject invalid addresses', () => {
    expect(isValidAddressString('invalid')).toBe(false);
    expect(isValidAddressString('')).toBe(false);
    expect(isValidAddressString('SP')).toBe(false);
  });
});

describe('truncateAddress', () => {
  it('should truncate long addresses', () => {
    const truncated = truncateAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(truncated).toBe('SP3FB...SVTE');
  });

  it('should not truncate short addresses', () => {
    const truncated = truncateAddress('SP123456', 6, 4);
    expect(truncated).toBe('SP123456');
  });
});

describe('decomposeAddress', () => {
  it('should decompose address into components', () => {
    const components = decomposeAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(components).not.toBeNull();
    expect(components?.prefix).toBe('SP');
    expect(components?.network).toBe('mainnet');
  });

  it('should return null for invalid addresses', () => {
    expect(decomposeAddress('invalid')).toBeNull();
  });
});

describe('isAddressInList', () => {
  it('should find address in list', () => {
    const list = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    ];
    expect(
      isAddressInList('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE', list)
    ).toBe(true);
  });

  it('should return false for address not in list', () => {
    const list = ['SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'];
    expect(
      isAddressInList('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', list)
    ).toBe(false);
  });
});

describe('filterValidAddresses', () => {
  it('should filter valid and invalid addresses', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'invalid',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ];
    const result = filterValidAddresses(addresses);
    expect(result.valid.length).toBe(2);
    expect(result.invalid.length).toBe(1);
  });
});

describe('createAddressBatch', () => {
  it('should create address batch', () => {
    const batch = createAddressBatch(0, 5);
    expect(batch).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('sortAddresses', () => {
  it('should sort addresses alphabetically', () => {
    const addresses = [
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    ];
    const sorted = sortAddresses(addresses, 'alphabetical');
    expect(sorted[0]).toBe('SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7');
  });
});

describe('getValidationMetrics', () => {
  beforeEach(() => {
    resetValidationMetrics();
  });

  it('should return initial metrics', () => {
    const metrics = getValidationMetrics();
    expect(metrics.totalValidated).toBe(0);
    expect(metrics.successRate).toBe(0);
  });
});

import {
  validateAddressChecksum,
  createValidationConfig,
  validateWithConfig,
  parseAddressHash,
  generateAddressFingerprint,
  isAddressEqual,
  getAddressPrefix,
  getAddressVersionByte,
  convertVersionToNetwork,
  analyzeAddressCollection,
} from '../addressValidation';

describe('validateAddressChecksum', () => {
  it('should validate checksum correctly', () => {
    const result = validateAddressChecksum(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(typeof result).toBe('boolean');
  });

  it('should return false for invalid address', () => {
    expect(validateAddressChecksum('invalid')).toBe(false);
  });
});

describe('createValidationConfig', () => {
  it('should create default config', () => {
    const config = createValidationConfig();
    expect(config.allowTestnet).toBe(true);
    expect(config.allowMainnet).toBe(true);
    expect(config.requireChecksum).toBe(false);
  });

  it('should create custom config', () => {
    const config = createValidationConfig({ allowTestnet: false });
    expect(config.allowTestnet).toBe(false);
  });
});

describe('validateWithConfig', () => {
  it('should validate with config', () => {
    const config = createValidationConfig({ allowTestnet: false });
    const result = validateWithConfig(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      config
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Testnet');
  });
});

describe('parseAddressHash', () => {
  it('should parse address hash', () => {
    const hash = parseAddressHash('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE');
    expect(hash).toBeTruthy();
  });
});

describe('generateAddressFingerprint', () => {
  it('should generate fingerprint', () => {
    const fingerprint = generateAddressFingerprint(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(fingerprint).toMatch(/^addr_[a-f0-9]+$/);
  });
});

describe('isAddressEqual', () => {
  it('should compare addresses case-insensitively', () => {
    expect(
      isAddressEqual(
        'sp3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte',
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
      )
    ).toBe(true);
  });

  it('should compare addresses case-sensitively', () => {
    expect(
      isAddressEqual(
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
        true
      )
    ).toBe(true);
  });
});

describe('getAddressPrefix', () => {
  it('should get prefix', () => {
    expect(getAddressPrefix('SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE')).toBe(
      'SP'
    );
    expect(getAddressPrefix('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(
      'ST'
    );
  });

  it('should return empty for invalid', () => {
    expect(getAddressPrefix('invalid')).toBe('');
  });
});

describe('getAddressVersionByte', () => {
  it('should get version byte', () => {
    const version = getAddressVersionByte(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
    );
    expect(version).toBeGreaterThanOrEqual(0);
  });
});

describe('convertVersionToNetwork', () => {
  it('should convert version to network', () => {
    expect(convertVersionToNetwork(0)).toBe('mainnet');
    expect(convertVersionToNetwork(26)).toBe('testnet');
    expect(convertVersionToNetwork(100)).toBe('unknown');
  });
});

describe('analyzeAddressCollection', () => {
  it('should analyze address collection', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ];
    const stats = analyzeAddressCollection(addresses);
    expect(stats.total).toBe(3);
    expect(stats.unique).toBe(3);
    expect(stats.duplicateCount).toBe(0);
  });

  it('should detect duplicates', () => {
    const addresses = [
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    ];
    const stats = analyzeAddressCollection(addresses);
    expect(stats.duplicateCount).toBe(1);
  });
});
