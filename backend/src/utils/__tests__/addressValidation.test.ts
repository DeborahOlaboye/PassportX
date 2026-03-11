/**
 * Tests for address validation utilities
 */

import {
  isValidStacksAddress,
  validateContractAddress,
  validateAddressNetwork,
  validateContractAddresses,
  formatValidationErrors,
} from '../addressValidation';

describe('isValidStacksAddress', () => {
  it('accepts valid mainnet address (SP prefix)', () => {
    expect(isValidStacksAddress('SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9')).toBe(true);
  });

  it('accepts valid testnet address (ST prefix)', () => {
    expect(isValidStacksAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidStacksAddress('')).toBe(false);
  });

  it('rejects null/undefined (type check)', () => {
    expect(isValidStacksAddress(null as unknown as string)).toBe(false);
    expect(isValidStacksAddress(undefined as unknown as string)).toBe(false);
  });

  it('rejects address with wrong prefix (SA...)', () => {
    expect(isValidStacksAddress('SA2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9')).toBe(false);
  });

  it('rejects address that is too short', () => {
    expect(isValidStacksAddress('SP123')).toBe(false);
  });

  it('rejects address that is too long', () => {
    expect(isValidStacksAddress('SP' + 'A'.repeat(40))).toBe(false);
  });

  it('rejects address with lowercase letters', () => {
    expect(isValidStacksAddress('sp2pabaf9ftajynfzh93xenaj8fvy99rrm50d2jg9')).toBe(false);
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

  it('should reject address not starting with S', () => {
    const result = validateContractAddress(
      'AP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must start');
  });

  it('should reject address with invalid network prefix', () => {
    const result = validateContractAddress(
      'SA3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SP');
    expect(result.error).toContain('ST');
  });

  it('should reject address with invalid length', () => {
    const result = validateContractAddress('SP123', 'testContract');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('41 characters');
  });

  it('should reject address with lowercase letters', () => {
    const result = validateContractAddress(
      'SP3fbr2agk5h9qbdh3een6df8ek8jy7rx8qj5svte',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid format');
  });

  it('should reject address with invalid characters', () => {
    const result = validateContractAddress(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVT!',
      'testContract'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid format');
  });
});

describe('validateAddressNetwork', () => {
  it('should validate mainnet address for mainnet network', () => {
    const result = validateAddressNetwork(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'mainnet'
    );
    expect(result.valid).toBe(true);
  });

  it('should validate testnet address for testnet network', () => {
    const result = validateAddressNetwork(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'testnet'
    );
    expect(result.valid).toBe(true);
  });

  it('should reject testnet address for mainnet network', () => {
    const result = validateAddressNetwork(
      'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      'mainnet'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('mainnet');
  });

  it('should reject mainnet address for testnet network', () => {
    const result = validateAddressNetwork(
      'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      'testnet'
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('testnet');
  });
});

describe('validateContractAddresses', () => {
  it('should validate all valid addresses', () => {
    const addresses = {
      contract1: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      contract2: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect errors for all invalid addresses', () => {
    const addresses = {
      contract1: 'invalid1',
      contract2: 'invalid2',
      contract3: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('should handle empty addresses object', () => {
    const result = validateContractAddresses({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should skip empty address values', () => {
    const addresses = {
      contract1: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      contract2: '',
    };
    const result = validateContractAddresses(addresses);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('formatValidationErrors', () => {
  it('should format multiple errors', () => {
    const errors = ['Error 1', 'Error 2', 'Error 3'];
    const formatted = formatValidationErrors(errors);
    expect(formatted).toContain('Error 1');
    expect(formatted).toContain('Error 2');
    expect(formatted).toContain('Error 3');
    expect(formatted.split('\n')).toHaveLength(3);
  });

  it('should format single error', () => {
    const errors = ['Single error'];
    const formatted = formatValidationErrors(errors);
    expect(formatted).toBe('  1. Single error');
  });

  it('should handle empty errors array', () => {
    const formatted = formatValidationErrors([]);
    expect(formatted).toBe('');
  });
});
