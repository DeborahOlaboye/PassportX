export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'success';

export interface BaseContractResponse {
  txId: string;
  status: TransactionStatus;
  error?: string;
}

/**
 * Response returned after a badge is successfully issued (transaction broadcast)
 */
export interface IssueBadgeResponse extends BaseContractResponse {
  badgeId: number | null;
  recipientAddress: string;
}

/**
 * Response returned after a community is successfully created (transaction broadcast)
 */
export interface CreateCommunityResponse extends BaseContractResponse {
  communityId: number | null;
  name: string;
}

/**
 * Response for revoking a badge
 */
export interface RevokeBadgeResponse extends BaseContractResponse {
  badgeId: number;
}

/**
 * Response for transaction status checks
 */
export interface TransactionStatusResponse {
  txId: string;
  status: TransactionStatus;
  blockHeight?: number;
  confirmations?: number;
}
