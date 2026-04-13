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
  checksumValid?: boolean;
  version?: number;
  networkId?: number;
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

/**
 * Verify checksum using CRC-16 algorithm
 * @internal Used for advanced validation scenarios
 */
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

/**
 * Calculate CRC-16 hash for address data
 * @internal Used for advanced validation scenarios
 */
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

/**
 * Export utility functions for advanced use cases
 * These functions are used internally but exposed for advanced validation needs
 */
export const addressUtils = {
  verifyChecksum,
  crc16Hash,
  decodeBase32Check,
  BASE32_ALPHABET,
};

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
  const checksumValid = addressUtils.verifyChecksum(address);

  return {
    valid: true,
    isMainnet,
    isTestnet,
    addressType: addressType?.type ?? 'unknown',
    checksumValid,
    version: addressType?.version,
    networkId: isMainnet ? 1 : 0,
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

export interface AddressParsingResult {
  prefix: string;
  version: number;
  data: string;
  checksum: string;
  isMainnet: boolean;
  isTestnet: boolean;
}

export function parseAddress(address: string): AddressParsingResult | null {
  if (!isValidStacksAddress(address)) {
    return null;
  }

  const prefix = address.substring(0, 2);
  const versionChar = address[2].toUpperCase();
  const version = BASE32_ALPHABET.indexOf(versionChar);
  const data = address.substring(3, 40);
  const checksum = address.substring(40);

  return {
    prefix,
    version,
    data,
    checksum,
    isMainnet: prefix === 'SP',
    isTestnet: prefix === 'ST',
  };
}

export function createAddress(
  prefix: 'SP' | 'ST',
  version: number,
  data: string,
  checksum: string
): string {
  const versionChar = BASE32_ALPHABET[version % 32];
  return `${prefix}${versionChar}${data}${checksum}`;
}

export function convertAddressNetwork(
  address: string,
  targetNetwork: 'mainnet' | 'testnet'
): string | null {
  const parsed = parseAddress(address);
  if (!parsed) return null;

  const newPrefix = targetNetwork === 'mainnet' ? 'SP' : 'ST';
  return createAddress(newPrefix, parsed.version, parsed.data, parsed.checksum);
}

export interface ValidationCacheOptions {
  maxSize?: number;
  ttlMs?: number;
}

const validationCache = new Map<
  string,
  { result: AddressValidationResult; timestamp: number }
>();

export function cachedValidation(
  address: string,
  options: ValidationCacheOptions = {}
): AddressValidationResult {
  const key = address.toUpperCase();
  const cached = validationCache.get(key);
  const now = Date.now();
  const ttl = options.ttlMs ?? 60000;

  if (cached && now - cached.timestamp < ttl) {
    return cached.result;
  }

  const result = isValidStacksAddressWithChecksum(address);
  validationCache.set(key, { result, timestamp: now });

  if (validationCache.size > (options.maxSize ?? 1000)) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey) validationCache.delete(firstKey);
  }

  return result;
}

export function clearValidationCache(): void {
  validationCache.clear();
}

export function getValidationCacheSize(): number {
  return validationCache.size;
}

export interface BatchValidationProgress {
  total: number;
  processed: number;
  valid: number;
  invalid: number;
  percentage: number;
}

export function validateAddressesBatch(
  addresses: string[],
  onProgress?: (progress: BatchValidationProgress) => void
): Map<string, AddressValidationResult> {
  const results = new Map<string, AddressValidationResult>();
  const total = addresses.length;
  let processed = 0;
  let valid = 0;
  let invalid = 0;

  for (const address of addresses) {
    const result = isValidStacksAddressWithChecksum(address);
    results.set(address, result);
    processed++;
    if (result.valid) valid++;
    else invalid++;

    if (onProgress) {
      onProgress({
        total,
        processed,
        valid,
        invalid,
        percentage: Math.round((processed / total) * 100),
      });
    }
  }

  return results;
}

const BECH32M_CHARSET = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';

function bech32Encode(prefix: string, data: number[]): string {
  const converted = convertToBase32(data);
  return `${prefix.toLowerCase()}${converted.join('').toUpperCase()}`;
}

function convertToBase32(data: number[]): string[] {
  const result: string[] = [];
  let buffer = 0;
  let bits = 0;

  for (const byte of data) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result.push(BECH32M_CHARSET[(buffer >> bits) & 31]);
    }
  }

  if (bits > 0) {
    result.push(BECH32M_CHARSET[(buffer << (5 - bits)) & 31]);
  }

  return result;
}

function convertFromBase32(data: string): number[] | null {
  const result: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of data.toUpperCase()) {
    const value = BECH32M_CHARSET.indexOf(char);
    if (value === -1) return null;
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      result.push((buffer >> bits) & 255);
    }
  }

  return result;
}

export interface Bech32EncodingResult {
  encoded: string;
  prefix: string;
  version: number;
  data: string;
}

export function encodeStacksAddress(
  prefix: string,
  version: number,
  data: string
): Bech32EncodingResult {
  const versionByte = [version];
  const dataBytes = convertFromBase32(data);
  if (!dataBytes) {
    throw new Error('Invalid base32 data');
  }
  const payload = [...versionByte, ...dataBytes];
  const encoded = bech32Encode(prefix, payload);
  return { encoded, prefix, version, data };
}

export function decodeStacksAddress(
  address: string
): { prefix: string; version: number; data: string } | null {
  const lowerAddress = address.toLowerCase();
  const separatorIndex = lowerAddress.indexOf('1');
  if (separatorIndex === -1) return null;

  const prefix = address.substring(0, separatorIndex + 1).toLowerCase();
  const data = address.substring(separatorIndex + 1);
  const decoded = convertFromBase32(data);

  if (!decoded || decoded.length < 1) return null;

  const version = decoded[0];
  const payloadData = decoded.slice(1);
  const dataStr = payloadData.map((b) => BECH32M_CHARSET[b % 32]).join('');

  return { prefix, version, data: dataStr };
}

export interface AddressVersion {
  mainnet: {
    wallet: number;
    contract: number;
    smartContract: number;
  };
  testnet: {
    wallet: number;
    contract: number;
    smartContract: number;
  };
}

export const ADDRESS_VERSIONS: AddressVersion = {
  mainnet: {
    wallet: 0,
    contract: 22,
    smartContract: 24,
  },
  testnet: {
    wallet: 26,
    contract: 20,
    smartContract: 21,
  },
};

export function getVersionForType(
  network: 'mainnet' | 'testnet',
  type: 'wallet' | 'contract' | 'smartContract'
): number {
  return ADDRESS_VERSIONS[network][type];
}

export interface NetworkDetectionResult {
  network: 'mainnet' | 'testnet' | 'unknown';
  isMainnet: boolean;
  isTestnet: boolean;
  confidence: number;
}

export function detectNetworkFromAddress(
  address: string
): NetworkDetectionResult {
  if (!isValidStacksAddress(address)) {
    return {
      network: 'unknown',
      isMainnet: false,
      isTestnet: false,
      confidence: 0,
    };
  }

  const prefix = address.substring(0, 2);
  const isMainnet = prefix === 'SP';
  const isTestnet = prefix === 'ST';

  return {
    network: isMainnet ? 'mainnet' : isTestnet ? 'testnet' : 'unknown',
    isMainnet,
    isTestnet,
    confidence: isMainnet || isTestnet ? 1 : 0,
  };
}

export function isMainnetAddress(address: string): boolean {
  return detectNetworkFromAddress(address).isMainnet;
}

export function isTestnetAddress(address: string): boolean {
  return detectNetworkFromAddress(address).isTestnet;
}

export interface StrictValidationOptions {
  requireChecksum?: boolean;
  requireValidVersion?: boolean;
  allowedVersions?: number[];
  allowedPrefixes?: string[];
}

export function validateAddressStrict(
  address: string,
  options: StrictValidationOptions = {}
): AddressValidationResult {
  const basicResult = isValidStacksAddressWithChecksum(address);

  if (!basicResult.valid) {
    return basicResult;
  }

  const errors: string[] = [];

  if (options.requireChecksum && !basicResult.checksumValid) {
    errors.push('Checksum verification failed');
  }

  if (options.requireValidVersion && basicResult.version === undefined) {
    errors.push('Invalid version byte');
  }

  if (options.allowedVersions && basicResult.version !== undefined) {
    if (!options.allowedVersions.includes(basicResult.version)) {
      errors.push(`Version ${basicResult.version} not allowed`);
    }
  }

  if (options.allowedPrefixes) {
    const prefix = address.substring(0, 2);
    if (!options.allowedPrefixes.includes(prefix)) {
      errors.push(`Prefix ${prefix} not allowed`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  return basicResult;
}

export function validateMultipleAddresses(
  addresses: string[],
  options?: StrictValidationOptions
): { valid: string[]; invalid: Map<string, string> } {
  const valid: string[] = [];
  const invalid = new Map<string, string>();

  for (const address of addresses) {
    const result = options
      ? validateAddressStrict(address, options)
      : isValidStacksAddressWithChecksum(address);

    if (result.valid) {
      valid.push(address);
    } else if (result.error) {
      invalid.set(address, result.error);
    }
  }

  return { valid, invalid };
}
