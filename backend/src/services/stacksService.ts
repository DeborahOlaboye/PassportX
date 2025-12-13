import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  uintCV,
  principalCV,
  tupleCV
} from '@stacks/transactions'
import axios from 'axios'

const network = process.env.STACKS_NETWORK === 'mainnet' 
  ? new StacksMainnet() 
  : new StacksTestnet()

const STACKS_API_URL = process.env.STACKS_API_URL || 'https://api.testnet.hiro.so'

export class StacksService {
  private contractAddress: string
  private contractName: string

  constructor(contractAddress: string, contractName: string) {
    this.contractAddress = contractAddress
    this.contractName = contractName
  }

  async mintBadge(
    senderKey: string,
    recipientAddress: string,
    badgeId: number,
    metadata: {
      name: string
      description: string
      level: number
      category: string
    }
  ) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'mint-badge',
        functionArgs: [
          principalCV(recipientAddress),
          uintCV(badgeId),
          tupleCV({
            name: stringUtf8CV(metadata.name),
            description: stringUtf8CV(metadata.description),
            level: uintCV(metadata.level),
            category: stringUtf8CV(metadata.category)
          })
        ],
        senderKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, network)

      return {
        txId: broadcastResponse.txid,
        transaction
      }
    } catch (error) {
      console.error('Error minting badge:', error)
      throw error
    }
  }

  async createCommunity(
    senderKey: string,
    communityName: string,
    description: string
  ) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: 'community-manager',
        functionName: 'create-community',
        functionArgs: [
          stringUtf8CV(communityName),
          stringUtf8CV(description)
        ],
        senderKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, network)

      return {
        txId: broadcastResponse.txid,
        transaction
      }
    } catch (error) {
      console.error('Error creating community:', error)
      throw error
    }
  }

  async getTransactionStatus(txId: string) {
    try {
      const response = await axios.get(`${STACKS_API_URL}/extended/v1/tx/${txId}`)
      return response.data
    } catch (error) {
      console.error('Error getting transaction status:', error)
      throw error
    }
  }

  async getContractInfo(contractAddress: string, contractName: string) {
    try {
      const response = await axios.get(
        `${STACKS_API_URL}/v2/contracts/interface/${contractAddress}/${contractName}`
      )
      return response.data
    } catch (error) {
      console.error('Error getting contract info:', error)
      throw error
    }
  }

  async readContractFunction(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: any[] = []
  ) {
    try {
      const response = await axios.post(
        `${STACKS_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
        {
          sender: contractAddress,
          arguments: functionArgs
        }
      )
      return response.data
    } catch (error) {
      console.error('Error reading contract function:', error)
      throw error
    }
  }

  async getUserBadges(userAddress: string) {
    try {
      const response = await this.readContractFunction(
        this.contractAddress,
        'passport-core',
        'get-user-badges',
        [principalCV(userAddress)]
      )
      return response.result
    } catch (error) {
      console.error('Error getting user badges:', error)
      throw error
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    return address.startsWith('ST') || address.startsWith('SP')
  }

  async getAccountBalance(address: string) {
    try {
      const response = await axios.get(`${STACKS_API_URL}/extended/v1/address/${address}/balances`)
      return response.data
    } catch (error) {
      console.error('Error getting account balance:', error)
      throw error
    }
  }

  async getAccountTransactions(address: string, limit: number = 20) {
    try {
      const response = await axios.get(
        `${STACKS_API_URL}/extended/v1/address/${address}/transactions?limit=${limit}`
      )
      return response.data
    } catch (error) {
      console.error('Error getting account transactions:', error)
      throw error
    }
  }
}

// Export singleton instances
export const badgeService = new StacksService(
  process.env.BADGE_ISSUER_CONTRACT_ADDRESS || '',
  'badge-issuer'
)

export const communityService = new StacksService(
  process.env.COMMUNITY_MANAGER_CONTRACT_ADDRESS || '',
  'community-manager'
)

export const passportService = new StacksService(
  process.env.PASSPORT_CONTRACT_ADDRESS || '',
  'passport-core'
)