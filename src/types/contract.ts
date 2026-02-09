export type ContractCallStatus = 'pending' | 'confirmed' | 'failed';

export interface BaseContractResponse {
  txId: string;
  status: ContractCallStatus;
}

export interface BadgeIssuanceBackendPayload {
  txId: string;
  recipientAddress: string;
  templateId: number;
  communityId: number;
  issuerAddress: string;
  recipientName?: string;
  recipientEmail?: string;
  network: 'testnet' | 'mainnet';
  createdAt: string;
}

export interface BackendApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface CommunityBackendPayload {
  txId: string;
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
  owner: string;
  createdAt: string;
  network: 'testnet' | 'mainnet';
}
