import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CommunityContractManager,
  CreateCommunityParams,
  CommunitySettings
} from '@/lib/contracts/communityContractUtils';

interface CreateCommunityOptions {
  name: string;
  description: string;
  about?: string;
  website?: string;
  stxPayment: number;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  settings: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    allowBadgeIssuance: boolean;
    allowCustomBadges: boolean;
  };
  tags?: string[];
}

interface CreateCommunityState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  txId: string | null;
  communityId: number | null;
}

export const useCreateCommunity = () => {
  const { user, userSession } = useAuth();
  const [state, setState] = useState<CreateCommunityState>({
    isLoading: false,
    error: null,
    success: false,
    txId: null,
    communityId: null
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      txId: null,
      communityId: null
    });
  }, []);

  const createCommunity = useCallback(
    async (options: CreateCommunityOptions) => {
      if (!user || !userSession.isUserSignedIn()) {
        setState(prev => ({
          ...prev,
          error: 'You must be signed in to create a community'
        }));
        throw new Error('User not authenticated');
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      try {
        const contractAddress = process.env.NEXT_PUBLIC_COMMUNITY_MANAGER_ADDRESS ||
          (process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
            ? process.env.NEXT_PUBLIC_MAINNET_COMMUNITY_MANAGER_ADDRESS
            : process.env.NEXT_PUBLIC_TESTNET_COMMUNITY_MANAGER_ADDRESS);

        if (!contractAddress) {
          throw new Error('Community manager contract address not configured');
        }

        const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';

        const manager = new CommunityContractManager(
          contractAddress,
          userSession,
          network
        );

        const contractParams: CreateCommunityParams = {
          name: options.name,
          description: options.description,
          stxPayment: options.stxPayment,
          network: network as 'testnet' | 'mainnet'
        };

        const result = await manager.createCommunity(contractParams);

        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          txId: result.txId,
          communityId: result.communityId || null
        }));

        const transactionData = {
          txId: result.txId,
          name: options.name,
          description: options.description,
          about: options.about,
          website: options.website,
          stxPayment: options.stxPayment,
          theme: options.theme,
          settings: options.settings,
          tags: options.tags,
          owner: user.stacksAddress,
          createdAt: new Date().toISOString(),
          network: network
        };

        await registerCommunityOnBackend(transactionData);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create community';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        throw err;
      }
    },
    [user, userSession]
  );

  const registerCommunityOnBackend = async (communityData: any) => {
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Backend registration error:', error);
      }
    } catch (error) {
      console.error('Failed to register community on backend:', error);
    }
  };

  const checkTransactionStatus = useCallback(
    async (txId: string) => {
      if (!userSession.isUserSignedIn()) {
        throw new Error('User not authenticated');
      }

      try {
        const contractAddress = process.env.NEXT_PUBLIC_COMMUNITY_MANAGER_ADDRESS;
        if (!contractAddress) {
          throw new Error('Community manager contract address not configured');
        }

        const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
        const manager = new CommunityContractManager(contractAddress, userSession, network);

        return await manager.validateTransactionStatus(txId);
      } catch (error) {
        console.error('Transaction status check failed:', error);
        throw error;
      }
    },
    [userSession]
  );

  return {
    ...state,
    createCommunity,
    resetState,
    checkTransactionStatus
  };
};
