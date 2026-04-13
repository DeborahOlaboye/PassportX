/**
 * Stacks Address Validation Utility
 * Validates Stacks contract and principal addresses
 */

export interface AddressValidationResult {
  valid: boolean;
  error?: string;
  isMainnet?: boolean;
  isTestnet?: boolean;
  addressType?: 'contract' | 'wallet' | 'unknown' | 'smartContract';
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

export interface AddressFormatInfo {
  format: 'mainnet' | 'testnet';
  prefix: string;
  length: number;
  versionByte: number;
  addressType: 'wallet' | 'contract' | 'smartContract';
}

export function getAddressFormatInfo(
  address: string
): AddressFormatInfo | null {
  const validation = isValidStacksAddressWithChecksum(address);
  if (!validation.valid) return null;

  const prefix = address.substring(0, 2);
  const versionByte = validation.version ?? 0;
  let addressType: 'wallet' | 'contract' | 'smartContract' = 'wallet';

  if (versionByte >= 20 && versionByte <= 24) {
    addressType = versionByte >= 22 ? 'smartContract' : 'contract';
  }

  return {
    format: prefix === 'SP' ? 'mainnet' : 'testnet',
    prefix,
    length: address.length,
    versionByte,
    addressType,
  };
}

export function isAddressValidForNetwork(
  address: string,
  network: 'mainnet' | 'testnet'
): boolean {
  const detection = detectNetworkFromAddress(address);
  return detection.network === network;
}

export function validateAddressFormat(
  address: string,
  expectedFormat: 'mainnet' | 'testnet'
): { valid: boolean; message?: string } {
  if (!isValidStacksAddress(address)) {
    return { valid: false, message: 'Invalid address format' };
  }

  const formatInfo = getAddressFormatInfo(address);
  if (!formatInfo) {
    return { valid: false, message: 'Could not parse address format' };
  }

  if (formatInfo.format !== expectedFormat) {
    return {
      valid: false,
      message: `Address format mismatch: expected ${expectedFormat}, got ${formatInfo.format}`,
    };
  }

  return { valid: true };
}

export interface BatchValidationSummary {
  total: number;
  valid: number;
  invalid: number;
  mainnet: number;
  testnet: number;
  contracts: number;
  wallets: number;
  byNetwork: { mainnet: string[]; testnet: string[] };
  byType: { contracts: string[]; wallets: string[] };
}

export function validateAndSummarizeAddresses(
  addresses: string[]
): BatchValidationSummary {
  const summary: BatchValidationSummary = {
    total: addresses.length,
    valid: 0,
    invalid: 0,
    mainnet: 0,
    testnet: 0,
    contracts: 0,
    wallets: 0,
    byNetwork: { mainnet: [], testnet: [] },
    byType: { contracts: [], wallets: [] },
  };

  for (const address of addresses) {
    const result = isValidStacksAddressWithChecksum(address);
    if (!result.valid) {
      summary.invalid++;
      continue;
    }

    summary.valid++;
    if (result.isMainnet) {
      summary.mainnet++;
      summary.byNetwork.mainnet.push(address);
    }
    if (result.isTestnet) {
      summary.testnet++;
      summary.byNetwork.testnet.push(address);
    }
    if (result.addressType === 'contract') {
      summary.contracts++;
      summary.byType.contracts.push(address);
    }
    if (result.addressType === 'wallet') {
      summary.wallets++;
      summary.byType.wallets.push(address);
    }
  }

  return summary;
}

export function isAddressType(
  address: string,
  type: 'wallet' | 'contract' | 'smartContract'
): boolean {
  const formatInfo = getAddressFormatInfo(address);
  if (!formatInfo) return false;
  return formatInfo.addressType === type;
}

export function validateAddressVersion(
  address: string,
  expectedVersion: number
): boolean {
  const formatInfo = getAddressFormatInfo(address);
  if (!formatInfo) return false;
  return formatInfo.versionByte === expectedVersion;
}

export interface AddressHashResult {
  hash: string;
  algorithm: 'crc16' | 'base32';
}

export function hashAddress(
  address: string,
  algorithm: 'crc16' | 'base32' = 'crc16'
): AddressHashResult {
  if (algorithm === 'crc16') {
    return { hash: crc16Hash(address).toString(16), algorithm };
  }
  const decoded = decodeBase32Check(address);
  if (!decoded) {
    return { hash: '', algorithm: 'base32' };
  }
  const hash = decoded.reduce((acc, b) => acc * 31 + b, 0);
  return { hash: hash.toString(36), algorithm };
}

export interface AddressStatistics {
  total: number;
  valid: number;
  invalid: number;
  mainnetCount: number;
  testnetCount: number;
  walletCount: number;
  contractCount: number;
  smartContractCount: number;
}

export function getAddressStatistics(addresses: string[]): AddressStatistics {
  const stats: AddressStatistics = {
    total: addresses.length,
    valid: 0,
    invalid: 0,
    mainnetCount: 0,
    testnetCount: 0,
    walletCount: 0,
    contractCount: 0,
    smartContractCount: 0,
  };

  for (const address of addresses) {
    const result = isValidStacksAddressWithChecksum(address);
    if (!result.valid) {
      stats.invalid++;
      continue;
    }

    stats.valid++;
    if (result.isMainnet) stats.mainnetCount++;
    if (result.isTestnet) stats.testnetCount++;
    if (result.addressType === 'wallet') stats.walletCount++;
    if (result.addressType === 'contract') stats.contractCount++;
    if (
      result.addressType &&
      result.addressType !== 'wallet' &&
      result.addressType !== 'contract' &&
      result.addressType !== 'unknown'
    )
      stats.smartContractCount++;
  }

  return stats;
}

export function groupAddressesByNetwork(addresses: string[]): {
  mainnet: string[];
  testnet: string[];
  invalid: string[];
} {
  const result = {
    mainnet: [] as string[],
    testnet: [] as string[],
    invalid: [] as string[],
  };

  for (const address of addresses) {
    const result2 = isValidStacksAddressWithChecksum(address);
    if (!result2.valid) {
      result.invalid.push(address);
    } else if (result2.isMainnet) {
      result.mainnet.push(address);
    } else if (result2.isTestnet) {
      result.testnet.push(address);
    }
  }

  return result;
}

export function groupAddressesByType(addresses: string[]): {
  wallet: string[];
  contract: string[];
  smartContract: string[];
  unknown: string[];
} {
  const result = {
    wallet: [] as string[],
    contract: [] as string[],
    smartContract: [] as string[],
    unknown: [] as string[],
  };

  for (const address of addresses) {
    const formatInfo = getAddressFormatInfo(address);
    if (!formatInfo) {
      result.unknown.push(address);
    } else if (formatInfo.addressType === 'wallet') {
      result.wallet.push(address);
    } else if (formatInfo.addressType === 'contract') {
      result.contract.push(address);
    } else if (
      formatInfo.addressType &&
      formatInfo.addressType !== 'wallet' &&
      formatInfo.addressType !== 'contract' &&
      formatInfo.addressType !== 'unknown'
    ) {
      result.smartContract.push(address);
    }
  }

  return result;
}

export interface AddressComparisonResult {
  equal: boolean;
  sameNetwork: boolean;
  sameType: boolean;
  difference: string[];
}

export function compareAddressTypes(
  address1: string,
  address2: string
): AddressComparisonResult {
  const result: AddressComparisonResult = {
    equal: false,
    sameNetwork: false,
    sameType: false,
    difference: [],
  };

  const format1 = getAddressFormatInfo(address1);
  const format2 = getAddressFormatInfo(address2);

  if (!format1 || !format2) {
    result.difference.push('One or both addresses are invalid');
    return result;
  }

  result.equal = address1.toUpperCase() === address2.toUpperCase();
  result.sameNetwork = format1.format === format2.format;
  result.sameType = format1.addressType === format2.addressType;

  if (!result.equal) {
    if (!result.sameNetwork) {
      result.difference.push('Different networks');
    }
    if (!result.sameType) {
      result.difference.push('Different address types');
    }
  }

  return result;
}

export function isValidAddressString(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 20 || address.length > 50) return false;
  return isValidStacksAddress(address);
}

export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
}

export interface AddressComponents {
  prefix: string;
  versionByte: number;
  payload: string;
  checksum: string;
  network: string;
  type: string;
}

export function decomposeAddress(address: string): AddressComponents | null {
  const formatInfo = getAddressFormatInfo(address);
  if (!formatInfo) return null;

  const prefix = address.substring(0, 2);
  const versionByte = formatInfo.versionByte;
  const payload = address.substring(3, 40);
  const checksum = address.substring(40);

  return {
    prefix,
    versionByte,
    payload,
    checksum,
    network: formatInfo.format,
    type: formatInfo.addressType,
  };
}

export function isAddressInList(
  address: string,
  addressList: string[]
): boolean {
  const normalizedAddress = address.toUpperCase();
  return addressList.some((a) => a.toUpperCase() === normalizedAddress);
}

export function filterValidAddresses(addresses: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const address of addresses) {
    if (isValidStacksAddress(address)) {
      valid.push(address);
    } else {
      invalid.push(address);
    }
  }

  return { valid, invalid };
}

export interface AddressRangeResult {
  start: string;
  end: string;
  count: number;
}

export function createAddressBatch(
  startIndex: number,
  count: number
): number[] {
  const batch: number[] = [];
  for (let i = 0; i < count; i++) {
    batch.push(startIndex + i);
  }
  return batch;
}

export function sortAddresses(
  addresses: string[],
  sortBy: 'network' | 'type' | 'alphabetical' = 'alphabetical'
): string[] {
  const sorted = [...addresses];

  if (sortBy === 'alphabetical') {
    return sorted.sort((a, b) => a.localeCompare(b));
  }

  if (sortBy === 'network') {
    return sorted.sort((a, b) => {
      const formatA = getAddressFormatInfo(a);
      const formatB = getAddressFormatInfo(b);
      if (!formatA || !formatB) return 0;
      return formatA.format.localeCompare(formatB.format);
    });
  }

  if (sortBy === 'type') {
    return sorted.sort((a, b) => {
      const formatA = getAddressFormatInfo(a);
      const formatB = getAddressFormatInfo(b);
      if (!formatA || !formatB) return 0;
      return formatA.addressType.localeCompare(formatB.addressType);
    });
  }

  return sorted;
}

export interface AddressValidationMetrics {
  totalValidated: number;
  successRate: number;
  averageProcessingTime: number;
  cacheHitRate: number;
}

const validationMetrics = {
  total: 0,
  successful: 0,
  totalTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

export function recordValidationMetrics(
  success: boolean,
  processingTimeMs: number,
  fromCache: boolean = false
): void {
  validationMetrics.total++;
  if (success) validationMetrics.successful++;
  validationMetrics.totalTime += processingTimeMs;
  if (fromCache) {
    validationMetrics.cacheHits++;
  } else {
    validationMetrics.cacheMisses++;
  }
}

export function getValidationMetrics(): AddressValidationMetrics {
  const successRate =
    validationMetrics.total > 0
      ? (validationMetrics.successful / validationMetrics.total) * 100
      : 0;
  const avgTime =
    validationMetrics.total > 0
      ? validationMetrics.totalTime / validationMetrics.total
      : 0;
  const cacheRate =
    validationMetrics.cacheHits + validationMetrics.cacheMisses > 0
      ? (validationMetrics.cacheHits /
          (validationMetrics.cacheHits + validationMetrics.cacheMisses)) *
        100
      : 0;

  return {
    totalValidated: validationMetrics.total,
    successRate,
    averageProcessingTime: avgTime,
    cacheHitRate: cacheRate,
  };
}

export function resetValidationMetrics(): void {
  validationMetrics.total = 0;
  validationMetrics.successful = 0;
  validationMetrics.totalTime = 0;
  validationMetrics.cacheHits = 0;
  validationMetrics.cacheMisses = 0;
}
