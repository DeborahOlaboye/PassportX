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
