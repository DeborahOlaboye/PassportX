/**
 * Stacks Address Validation Utility
 * Validates Stacks contract and principal addresses
 */

export interface AddressValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate Stacks address format
 * Valid addresses follow pattern: S[P|T] + 39 alphanumeric characters
 * - Mainnet addresses start with SP
 * - Testnet addresses start with ST
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const stacksAddressRegex = /^S[PT][0-9A-Z]{39}$/;
  return stacksAddressRegex.test(address);
}

/**
 * Validate contract address with detailed error messages
 */
export function validateContractAddress(
  address: string,
  contractName: string
): AddressValidationResult {
  if (!address) {
    return {
      valid: false,
      error: `Contract address for ${contractName} is not configured`
    };
  }

  if (typeof address !== 'string') {
    return {
      valid: false,
      error: `Contract address for ${contractName} must be a string`
    };
  }

  if (!address.startsWith('S')) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must start with 'S'`
    };
  }

  if (!address.startsWith('SP') && !address.startsWith('ST')) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must start with 'SP' (mainnet) or 'ST' (testnet)`
    };
  }

  if (address.length !== 41) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must be 41 characters long`
    };
  }

  if (!isValidStacksAddress(address)) {
    return {
      valid: false,
      error: `Contract address for ${contractName} has invalid format`
    };
  }

  return { valid: true };
}

/**
 * Validate all contract addresses
 */
export function validateContractAddresses(
  addresses: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [name, address] of Object.entries(addresses)) {
    if (address) {
      const result = validateContractAddress(address, name);
      if (!result.valid && result.error) {
        errors.push(result.error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
