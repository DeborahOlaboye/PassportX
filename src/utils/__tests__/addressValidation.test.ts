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
