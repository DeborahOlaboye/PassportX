/**
 * Tests for Stacks address validation utilities
 */

import {
  isValidStacksAddress,
  validateContractAddress,
  validateContractAddresses,
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
