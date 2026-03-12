import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { AppConfig, UserSession } from '@stacks/connect';
import { validateContractAddresses } from '@/utils/addressValidation';

// Network configuration
export const getStacksNetwork = (): StacksTestnet | StacksMainnet => {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
  return network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
};

// App configuration for Stacks Connect
export const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

// Contract addresses
const rawContractAddresses = {
  PASSPORT_CORE: process.env.NEXT_PUBLIC_PASSPORT_CONTRACT_ADDRESS || '',
  BADGE_ISSUER: process.env.NEXT_PUBLIC_BADGE_ISSUER_CONTRACT_ADDRESS || '',
  COMMUNITY_MANAGER:
    process.env.NEXT_PUBLIC_COMMUNITY_MANAGER_CONTRACT_ADDRESS || '',
};

const validationResult = validateContractAddresses(rawContractAddresses);
if (!validationResult.valid) {
  const errorMessage = `Invalid contract address configuration:\n${validationResult.errors.join(
    '\n'
  )}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const CONTRACT_ADDRESSES = rawContractAddresses;

// API endpoints
export const API_ENDPOINTS = {
  STACKS_API:
    process.env.NEXT_PUBLIC_STACKS_API_URL || 'https://api.testnet.hiro.so',
};

// Utility functions
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const formatSTX = (microSTX: number): string => {
  return (microSTX / 1000000).toFixed(6);
};
