/**
 * Contract call status types
 */
export type ContractCallStatus = 'pending' | 'confirmed' | 'failed';

/**
 * Base response interface for all contract calls
 */
export interface BaseContractResponse {
  txId: string;
  status: ContractCallStatus;
}

/**
 * Payload for registering badge issuance on backend
 */
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

/**
 * Generic backend API response wrapper
 */
export interface BackendApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Transaction status response from Stacks API
 */
export interface TransactionStatusResponse {
  tx_id: string;
  tx_status:
    | 'pending'
    | 'success'
    | 'abort_by_response'
    | 'abort_by_post_condition';
  tx_result?: {
    hex: string;
    repr: string;
  };
  block_height?: number;
  block_hash?: string;
  block_time?: number;
  burn_block_time?: number;
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

/**
 * Contract read function call options
 */
export interface ContractReadOptions {
  sender?: string;
}

/**
 * Contract write function call options
 */
export interface ContractWriteOptions {
  sender: string;
  network: 'testnet' | 'mainnet';
}

/**
 * Parameters for creating a passport badge
 */
export interface CreatePassportBadgeParams {
  recipient: string;
  templateId: number;
  communityId: number;
}

/**
 * Response from badge creation
 */
export interface CreateBadgeResponse extends BaseContractResponse {
  badgeId?: string;
  recipient?: string;
}

/**
 * Parameters for setup community issuer
 */
export interface SetupCommunityIssuerParams {
  communityId: number;
  issuer: string;
}

/**
 * Passport summary response
 */
export interface PassportSummary {
  totalBadges: number;
  activeBadges: number;
  badgeIds: string[];
}
