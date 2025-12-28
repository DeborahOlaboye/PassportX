/**
 * Smart Contract Configuration
 * Manages contract addresses for different networks
 */

export interface ContractConfig {
  address: string
  name: string
}

export interface NetworkContracts {
  badgeReader: ContractConfig
  badgeIssuer: ContractConfig
  badgeMetadata: ContractConfig
  passportNft: ContractConfig
  passportCore: ContractConfig
  communityManager: ContractConfig
  accessControl: ContractConfig
}

const DEVNET_CONTRACTS: NetworkContracts = {
  badgeReader: {
    address: process.env.DEVNET_BADGE_READER_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'badge-reader'
  },
  badgeIssuer: {
    address: process.env.DEVNET_BADGE_ISSUER_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'badge-issuer'
  },
  badgeMetadata: {
    address: process.env.DEVNET_BADGE_METADATA_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'badge-metadata'
  },
  passportNft: {
    address: process.env.DEVNET_PASSPORT_NFT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'passport-nft'
  },
  passportCore: {
    address: process.env.DEVNET_PASSPORT_CORE_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'passport-core'
  },
  communityManager: {
    address: process.env.DEVNET_COMMUNITY_MANAGER_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'community-manager'
  },
  accessControl: {
    address: process.env.DEVNET_ACCESS_CONTROL_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    name: 'access-control'
  }
}

const TESTNET_CONTRACTS: NetworkContracts = {
  badgeReader: {
    address: process.env.TESTNET_BADGE_READER_ADDRESS || '',
    name: 'badge-reader'
  },
  badgeIssuer: {
    address: process.env.TESTNET_BADGE_ISSUER_ADDRESS || '',
    name: 'badge-issuer'
  },
  badgeMetadata: {
    address: process.env.TESTNET_BADGE_METADATA_ADDRESS || '',
    name: 'badge-metadata'
  },
  passportNft: {
    address: process.env.TESTNET_PASSPORT_NFT_ADDRESS || '',
    name: 'passport-nft'
  },
  passportCore: {
    address: process.env.TESTNET_PASSPORT_CORE_ADDRESS || '',
    name: 'passport-core'
  },
  communityManager: {
    address: process.env.TESTNET_COMMUNITY_MANAGER_ADDRESS || '',
    name: 'community-manager'
  },
  accessControl: {
    address: process.env.TESTNET_ACCESS_CONTROL_ADDRESS || '',
    name: 'access-control'
  }
}

const MAINNET_CONTRACTS: NetworkContracts = {
  badgeReader: {
    // Update these addresses after mainnet deployment
    address: process.env.MAINNET_BADGE_READER_ADDRESS || '',
    name: 'badge-reader'
  },
  badgeIssuer: {
    address: process.env.MAINNET_BADGE_ISSUER_ADDRESS || '',
    name: 'badge-issuer'
  },
  badgeMetadata: {
    address: process.env.MAINNET_BADGE_METADATA_ADDRESS || '',
    name: 'badge-metadata'
  },
  passportNft: {
    address: process.env.MAINNET_PASSPORT_NFT_ADDRESS || '',
    name: 'passport-nft'
  },
  passportCore: {
    address: process.env.MAINNET_PASSPORT_CORE_ADDRESS || '',
    name: 'passport-core'
  },
  communityManager: {
    address: process.env.MAINNET_COMMUNITY_MANAGER_ADDRESS || '',
    name: 'community-manager'
  },
  accessControl: {
    address: process.env.MAINNET_ACCESS_CONTROL_ADDRESS || '',
    name: 'access-control'
  }
}

/**
 * Get contracts for current network
 */
export function getContracts(): NetworkContracts {
  const network = process.env.STACKS_NETWORK || 'devnet'

  switch (network.toLowerCase()) {
    case 'mainnet':
      return MAINNET_CONTRACTS
    case 'testnet':
      return TESTNET_CONTRACTS
    case 'devnet':
    default:
      return DEVNET_CONTRACTS
  }
}

/**
 * Get fully qualified contract identifier
 */
export function getContractId(contract: ContractConfig): string {
  return `${contract.address}.${contract.name}`
}

/**
 * Verify all contract addresses are configured
 */
export function verifyContractConfiguration(): boolean {
  const contracts = getContracts()
  const network = process.env.STACKS_NETWORK || 'devnet'

  // For mainnet, ensure all addresses are set
  if (network === 'mainnet') {
    const allConfigured = Object.values(contracts).every(
      contract => contract.address && contract.address.startsWith('SP')
    )

    if (!allConfigured) {
      console.error('❌ Mainnet contract addresses not fully configured!')
      return false
    }
  }

  console.log(`✅ Contract configuration verified for ${network}`)
  return true
}

/**
 * Get contract explorer URL
 */
export function getContractExplorerUrl(contract: ContractConfig): string {
  const network = process.env.STACKS_NETWORK || 'devnet'
  const baseUrl = network === 'mainnet'
    ? 'https://explorer.stacks.co'
    : 'https://explorer.hiro.so'

  return `${baseUrl}/txid/${getContractId(contract)}?chain=${network}`
}

export default {
  getContracts,
  getContractId,
  verifyContractConfiguration,
  getContractExplorerUrl
}
