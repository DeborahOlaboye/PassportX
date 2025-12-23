import { UserSession } from '@stacks/connect';
import { 
  ContractCallOptions, 
  PostConditionMode,
  FungiblePostCondition,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  uintCV,
  stringAsciiCV,
  trueCV,
  falseCV,
  contractPrincipalCV
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

export interface CommunityMetadata {
  name: string;
  description: string;
  owner: string;
  createdAt: number;
  active: boolean;
}

export interface CommunitySettings {
  publicBadges: boolean;
  allowMemberRequests: boolean;
  requireApproval: boolean;
}

export interface CreateCommunityParams {
  name: string;
  description: string;
  stxPayment: number;
  network: 'testnet' | 'mainnet';
}

export class CommunityContractManager {
  private contractAddress: string;
  private contractName: string = 'community-manager';
  private userSession: UserSession;
  private network: 'testnet' | 'mainnet';

  constructor(
    contractAddress: string,
    userSession: UserSession,
    network: 'testnet' | 'mainnet' = 'testnet'
  ) {
    this.contractAddress = contractAddress;
    this.userSession = userSession;
    this.network = network;
  }

  private getNetwork() {
    return this.network === 'mainnet' 
      ? new StacksMainnet()
      : new StacksTestnet();
  }

  async createCommunity(
    params: CreateCommunityParams
  ): Promise<{ txId: string; communityId?: number }> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in to create a community');
    }

    if (params.name.length > 64) {
      throw new Error('Community name must be less than 64 characters');
    }

    if (params.description.length > 256) {
      throw new Error('Community description must be less than 256 characters');
    }

    if (params.stxPayment < 0) {
      throw new Error('STX payment must be a positive number');
    }

    try {
      const contractId = `${this.contractAddress}.${this.contractName}`;
      const userData = this.userSession.loadUserData();
      const senderAddress = userData.profile.stxAddress[
        this.network === 'mainnet' ? 'mainnet' : 'testnet'
      ];

      const postConditionMode = PostConditionMode.Deny;
      const postConditions: FungiblePostCondition[] = params.stxPayment > 0 
        ? [
            makeStandardSTXPostCondition(
              senderAddress,
              FungibleConditionCode.LessEqual,
              BigInt(params.stxPayment * 1_000_000)
            )
          ]
        : [];

      const functionArgs = [
        stringAsciiCV(params.name),
        stringAsciiCV(params.description)
      ];

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-community',
        functionArgs,
        senderKey: userData.appPrivateKey,
        network: this.getNetwork(),
        postConditionMode,
        postConditions,
        anchorMode: 'any'
      };

      const response = await (window as any).stacks?.openContractCall?.(txOptions);

      if (!response?.txid) {
        throw new Error('Transaction failed or was cancelled');
      }

      return {
        txId: response.txid
      };
    } catch (error) {
      console.error('Community creation error:', error);
      throw error;
    }
  }

  async addCommunityMember(
    communityId: number,
    memberAddress: string,
    role: string
  ): Promise<{ txId: string }> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in');
    }

    if (role.length > 32) {
      throw new Error('Role must be less than 32 characters');
    }

    try {
      const userData = this.userSession.loadUserData();

      const functionArgs = [
        uintCV(communityId),
        contractPrincipalCV(memberAddress, this.contractName),
        stringAsciiCV(role)
      ];

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'add-community-member',
        functionArgs,
        senderKey: userData.appPrivateKey,
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 'any'
      };

      const response = await (window as any).stacks?.openContractCall?.(txOptions);

      if (!response?.txid) {
        throw new Error('Failed to add community member');
      }

      return { txId: response.txid };
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  async updateCommunitySettings(
    communityId: number,
    settings: CommunitySettings
  ): Promise<{ txId: string }> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in');
    }

    try {
      const userData = this.userSession.loadUserData();

      const functionArgs = [
        uintCV(communityId),
        {
          type: 'tuple',
          data: {
            'public-badges': settings.publicBadges ? trueCV() : falseCV(),
            'allow-member-requests': settings.allowMemberRequests ? trueCV() : falseCV(),
            'require-approval': settings.requireApproval ? trueCV() : falseCV()
          }
        }
      ];

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'update-community-settings',
        functionArgs,
        senderKey: userData.appPrivateKey,
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 'any'
      };

      const response = await (window as any).stacks?.openContractCall?.(txOptions);

      if (!response?.txid) {
        throw new Error('Failed to update community settings');
      }

      return { txId: response.txid };
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  async transferCommunityOwnership(
    communityId: number,
    newOwnerAddress: string
  ): Promise<{ txId: string }> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in');
    }

    try {
      const userData = this.userSession.loadUserData();

      const functionArgs = [
        uintCV(communityId),
        contractPrincipalCV(newOwnerAddress, this.contractName)
      ];

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'transfer-community-ownership',
        functionArgs,
        senderKey: userData.appPrivateKey,
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 'any'
      };

      const response = await (window as any).stacks?.openContractCall?.(txOptions);

      if (!response?.txid) {
        throw new Error('Failed to transfer community ownership');
      }

      return { txId: response.txid };
    } catch (error) {
      console.error('Transfer ownership error:', error);
      throw error;
    }
  }

  async deactivateCommunity(communityId: number): Promise<{ txId: string }> {
    if (!this.userSession.isUserSignedIn()) {
      throw new Error('User must be signed in');
    }

    try {
      const userData = this.userSession.loadUserData();

      const functionArgs = [uintCV(communityId)];

      const txOptions: ContractCallOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'deactivate-community',
        functionArgs,
        senderKey: userData.appPrivateKey,
        network: this.getNetwork(),
        postConditionMode: PostConditionMode.Deny,
        anchorMode: 'any'
      };

      const response = await (window as any).stacks?.openContractCall?.(txOptions);

      if (!response?.txid) {
        throw new Error('Failed to deactivate community');
      }

      return { txId: response.txid };
    } catch (error) {
      console.error('Deactivate community error:', error);
      throw error;
    }
  }

  validateTransactionStatus = async (txId: string): Promise<boolean> => {
    try {
      const network = this.getNetwork();
      const baseUrl = this.network === 'mainnet'
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(
        `${baseUrl}/extended/v1/tx/${txId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction status: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tx_status === 'success';
    } catch (error) {
      console.error('Transaction validation error:', error);
      throw error;
    }
  };
}

export const initializeCommunityManager = (
  contractAddress: string,
  userSession: UserSession,
  network: 'testnet' | 'mainnet' = 'testnet'
): CommunityContractManager => {
  return new CommunityContractManager(contractAddress, userSession, network);
};
