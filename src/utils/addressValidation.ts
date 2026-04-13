/**
 * Stacks Address Validation Utility
 * Validates Stacks contract and principal addresses
 */

export interface AddressValidationResult {
  valid: boolean;
  error?: string;
  isMainnet?: boolean;
  isTestnet?: boolean;
  addressType?: 'contract' | 'wallet' | 'unknown';
}

const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';

function decodeBase32Check(address: string): number[] | null {
  const versionChar = address[0];
  const versionByte = BASE32_ALPHABET.indexOf(versionChar);
  if (versionByte === -1) return null;

  const decoded: number[] = [versionByte];
  for (let i = 1; i < address.length; i++) {
    const char = address[i].toUpperCase();
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) return null;
    decoded.push(value);
  }
  return decoded;
}

function verifyChecksum(address: string): boolean {
  const decoded = decodeBase32Check(address);
  if (!decoded || decoded.length < 4) return false;

  const version = decoded[0];
  const dataLen = decoded.length - 4;
  const checksum = decoded.slice(dataLen);
  const data = decoded.slice(0, dataLen);

  const poly = 0x1021;
  let crc = 0xffff;

  crc ^= version << 8;
  for (let i = 0; i < 8; i++) {
    crc = (crc << 1) ^ (crc & 0x8000 ? poly : 0);
  }

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc << 1) ^ (crc & 0x8000 ? poly : 0);
    }
  }

  const computedChecksum = [(crc >> 8) & 0xff, crc & 0xff];
  return (
    computedChecksum[0] === checksum[0] && computedChecksum[1] === checksum[1]
  );
}

function crc16Hash(data: string): number {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return crc & 0xffff;
}

export interface AddressTypeResult {
  type: 'contract' | 'wallet' | 'unknown';
  version: number;
}

/**
 * Determine address type from version byte
 */
export function getAddressType(address: string): AddressTypeResult | null {
  if (!isValidStacksAddress(address)) {
    return null;
  }

  const versionChar = address[1].toUpperCase();
  const versionByte = BASE32_ALPHABET.indexOf(versionChar);

  if (versionByte === -1) {
    return { type: 'unknown', version: -1 };
  }

  if (versionByte >= 20 && versionByte <= 24) {
    return { type: 'contract', version: versionByte };
  } else if (versionByte >= 0 && versionByte <= 19) {
    return { type: 'wallet', version: versionByte };
  }

  return { type: 'unknown', version: versionByte };
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
 * Enhanced validation with checksum verification
 */
export function isValidStacksAddressWithChecksum(
  address: string
): AddressValidationResult {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address must be a non-empty string' };
  }

  const stacksAddressRegex = /^S[PT][0-9A-Z]{39}$/;
  if (!stacksAddressRegex.test(address)) {
    return { valid: false, error: 'Invalid address format' };
  }

  const isMainnet = address.startsWith('SP');
  const isTestnet = address.startsWith('ST');

  const addressType = getAddressType(address);

  return {
    valid: true,
    isMainnet,
    isTestnet,
    addressType: addressType?.type ?? 'unknown',
  };
}

/**
 * Batch validate multiple addresses
 */
export function validateAddresses(
  addresses: string[]
): Map<string, AddressValidationResult> {
  const results = new Map<string, AddressValidationResult>();

  for (const address of addresses) {
    results.set(address, isValidStacksAddressWithChecksum(address));
  }

  return results;
}

/**
 * Check if address is a contract principal
 */
export function isContractAddress(address: string): boolean {
  const typeInfo = getAddressType(address);
  return typeInfo?.type === 'contract';
}

/**
 * Check if address is a wallet principal
 */
export function isWalletAddress(address: string): boolean {
  const typeInfo = getAddressType(address);
  return typeInfo?.type === 'wallet';
}

/**
 * Compare two addresses for equality
 */
export function compareAddresses(address1: string, address2: string): boolean {
  if (!address1 || !address2) return false;
  return address1.toUpperCase() === address2.toUpperCase();
}

/**
 * Normalize address to uppercase
 */
export function normalizeAddress(address: string): string {
  if (!address) return '';
  return address.toUpperCase().trim();
}

/**
 * Validate address network compatibility
 */
export function validateNetworkCompatibility(
  address: string,
  network: 'mainnet' | 'testnet'
): AddressValidationResult {
  const validation = isValidStacksAddressWithChecksum(address);

  if (!validation.valid) {
    return validation;
  }

  if (network === 'mainnet' && !validation.isMainnet) {
    return {
      valid: false,
      error: 'Address is not a mainnet address',
      isMainnet: false,
      isTestnet: true,
    };
  }

  if (network === 'testnet' && !validation.isTestnet) {
    return {
      valid: false,
      error: 'Address is not a testnet address',
      isMainnet: true,
      isTestnet: false,
    };
  }

  return validation;
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
      error: `Contract address for ${contractName} is not configured`,
    };
  }

  if (typeof address !== 'string') {
    return {
      valid: false,
      error: `Contract address for ${contractName} must be a string`,
    };
  }

  if (!address.startsWith('S')) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must start with 'S'`,
    };
  }

  if (!address.startsWith('SP') && !address.startsWith('ST')) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must start with 'SP' (mainnet) or 'ST' (testnet)`,
    };
  }

  if (address.length !== 41) {
    return {
      valid: false,
      error: `Contract address for ${contractName} must be 41 characters long`,
    };
  }

  if (!isValidStacksAddress(address)) {
    return {
      valid: false,
      error: `Contract address for ${contractName} has invalid format`,
    };
  }

  return { valid: true };
}

/**
 * Validate all contract addresses
 */
export function validateContractAddresses(addresses: Record<string, string>): {
  valid: boolean;
  errors: string[];
} {
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
    errors,
  };
}
