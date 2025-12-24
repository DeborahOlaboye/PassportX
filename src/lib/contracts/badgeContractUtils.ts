import {
  ContractCallOptions,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  contractPrincipalCV
} from '@stacks/transactions'
import { StacksTestnet, StacksMainnet } from '@stacks/network'
import { UserSession } from '@stacks/auth'

export interface BadgeIssuanceParams {
  recipientAddress: string
  templateId: number
  communityId: number
  network: 'testnet' | 'mainnet'
}

export interface BadgeIssuerResponse {
  txId: string
  badgeId?: number
}

export class BadgeIssuerManager {
  private contractAddress: string
  private contractName: string = 'badge-issuer'
  private userSession: UserSession
  private network: 'testnet' | 'mainnet'

  constructor(
    contractAddress: string,
    userSession: UserSession,
    network: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.contractAddress = contractAddress
    this.userSession = userSession
    this.network = network
  }

  private getNetwork() {
    return this.network === 'mainnet'
      ? new StacksMainnet()
      : new StacksTestnet()
  }

  async issueBadge(params: BadgeIssuanceParams): Promise<BadgeIssuerResponse> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in to issue badges')
    }

    if (!params.recipientAddress) {
      throw new Error('Recipient address is required')
    }

    if (params.templateId < 0) {
      throw new Error('Template ID must be a positive number')
    }

    if (params.communityId < 0) {
      throw new Error('Community ID must be a positive number')
    }

    try {
      const contractId = `${this.contractAddress}.${this.contractName}`
      const userData = this.userSession.loadUserData()
      const senderAddress = userData.profile.stxAddress[
        this.network === 'mainnet' ? 'mainnet' : 'testnet'
      ]

      const postConditionMode = PostConditionMode.Allow
      const postConditions = []

      const functionArgs = [
        contractPrincipalCV(params.recipientAddress),
        uintCV(params.templateId)
      ]

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'mint-badge',
        functionArgs,
        senderKey: userData.profile.stxAddress[
          this.network === 'mainnet' ? 'mainnet' : 'testnet'
        ],
        network: this.getNetwork(),
        postConditionMode,
        postConditions,
        onFinish: (data) => {
          return data
        }
      }

      const tx = await this.userSession.signTransaction(txOptions as any)
      
      if (!tx) {
        throw new Error('Transaction signing was cancelled')
      }

      return {
        txId: tx.txId || '',
        badgeId: params.templateId
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User cancelled')) {
          throw new Error('Badge issuance cancelled')
        }
        throw new Error(`Failed to issue badge: ${error.message}`)
      }
      throw new Error('Failed to issue badge')
    }
  }

  async authorizeBadgeIssuer(issuerAddress: string): Promise<BadgeIssuerResponse> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in')
    }

    try {
      const contractId = `${this.contractAddress}.${this.contractName}`
      const userData = this.userSession.loadUserData()

      const functionArgs = [contractPrincipalCV(issuerAddress)]

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'authorize-issuer',
        functionArgs,
        senderKey: userData.profile.stxAddress[
          this.network === 'mainnet' ? 'mainnet' : 'testnet'
        ],
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          return data
        }
      }

      const tx = await this.userSession.signTransaction(txOptions as any)

      if (!tx) {
        throw new Error('Transaction signing was cancelled')
      }

      return {
        txId: tx.txId || ''
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to authorize issuer: ${error.message}`)
      }
      throw new Error('Failed to authorize issuer')
    }
  }

  async revokeBadgeIssuer(issuerAddress: string): Promise<BadgeIssuerResponse> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in')
    }

    try {
      const userData = this.userSession.loadUserData()

      const functionArgs = [contractPrincipalCV(issuerAddress)]

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'revoke-issuer',
        functionArgs,
        senderKey: userData.profile.stxAddress[
          this.network === 'mainnet' ? 'mainnet' : 'testnet'
        ],
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          return data
        }
      }

      const tx = await this.userSession.signTransaction(txOptions as any)

      if (!tx) {
        throw new Error('Transaction signing was cancelled')
      }

      return {
        txId: tx.txId || ''
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to revoke issuer: ${error.message}`)
      }
      throw new Error('Failed to revoke issuer')
    }
  }

  async revokeBadge(badgeId: number): Promise<BadgeIssuerResponse> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in')
    }

    if (badgeId < 0) {
      throw new Error('Badge ID must be a positive number')
    }

    try {
      const userData = this.userSession.loadUserData()

      const functionArgs = [uintCV(badgeId)]

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'revoke-badge',
        functionArgs,
        senderKey: userData.profile.stxAddress[
          this.network === 'mainnet' ? 'mainnet' : 'testnet'
        ],
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          return data
        }
      }

      const tx = await this.userSession.signTransaction(txOptions as any)

      if (!tx) {
        throw new Error('Transaction signing was cancelled')
      }

      return {
        txId: tx.txId || '',
        badgeId
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to revoke badge: ${error.message}`)
      }
      throw new Error('Failed to revoke badge')
    }
  }
}
