export type NotificationType = 
  | 'badge_received' 
  | 'badge_issued' 
  | 'badge_verified' 
  | 'badge_metadata_updated'
  | 'community_update' 
  | 'community_created'
  | 'community_invite' 
  | 'system_announcement';

export interface ChainhookEventPayload {
  block_identifier: {
    index: number;
    hash: string;
  };
  parent_block_identifier: {
    index: number;
    hash: string;
  };
  type: string;
  timestamp: number;
  transactions: ChainhookTransaction[];
  metadata: {
    bitcoin_anchor_block_identifier: {
      index: number;
      hash: string;
    };
    pox_cycle_index: number;
    pox_cycle_position: number;
    pox_cycle_length: number;
  };
}

export interface ChainhookTransaction {
  transaction_index: number;
  transaction_hash: string;
  operations: ChainhookOperation[];
}

export interface ChainhookOperation {
  type: string;
  contract_call?: {
    contract: string;
    method: string;
    args?: any[];
  };
  events?: ChainhookContractEvent[];
}

export interface ChainhookContractEvent {
  type: string;
  contract_address: string;
  topic: string;
  value?: any;
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

export interface BadgeVerificationEvent {
  userId: string;
  badgeId: string;
  badgeName: string;
  verificationData: any;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}

export interface CommunityUpdateEvent {
  communityId: string;
  communityName: string;
  updateType: 'member_joined' | 'member_left' | 'announcement' | 'event';
  affectedUsers: string[];
  data: any;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}

export interface CommunityCreationEvent {
  communityId: string;
  communityName: string;
  description: string;
  ownerAddress: string;
  createdAtBlockHeight: number;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}

export interface BadgeMetadataUpdateEvent {
  badgeId: string;
  badgeName: string;
  level?: number;
  category?: string;
  description?: string;
  previousLevel?: number;
  previousCategory?: string;
  previousDescription?: string;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: {
    eventType: string;
    transactionHash: string;
    blockHeight: number;
    timestamp: number;
    [key: string]: any;
  };
}

export interface ChainhookEventHandler {
  canHandle(event: ChainhookEventPayload): boolean;
  handle(event: ChainhookEventPayload): Promise<NotificationPayload[]>;
  getEventType(): string;
}

export interface UserNotificationPreferences {
  userId: string;
  badges: {
    enabled: boolean;
    mint: boolean;
    verify: boolean;
  };
  community: {
    enabled: boolean;
    updates: boolean;
    invites: boolean;
  };
  system: {
    enabled: boolean;
    announcements: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
