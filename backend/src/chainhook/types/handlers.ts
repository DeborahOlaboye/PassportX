export interface BadgeMetadataUpdateEvent {
  badgeId: string;
  transactionHash: string;
  blockHeight?: number;
  timestamp?: number;
  category?: string;
  [key: string]: unknown;
}

export interface BadgeMintEvent {
  userId: string;
  badgeId: string;
  badgeName: string;
  criteria: string;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}
