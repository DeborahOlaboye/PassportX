// Chainhook types and event definitions for testing and integration

/**
 * Chainhook Event Types
 * Represents different blockchain events that Chainhook can monitor
 */

export enum EventType {
  TX = 'tx',
  BLOCK = 'block',
  MICROBLOCK = 'microblock'
}

export interface ChainhookEvent {
  type: EventType;
  timestamp: number;
  blockHeight: number;
  blockHash: string;
  txHash?: string;
}

/**
 * STX Transfer Event
 * Used for tracking badge minting and payments
 */
export interface STXTransferEvent extends ChainhookEvent {
  type: EventType.TX;
  sender: string;
  recipient: string;
  amount: bigint;
  txIndex: number;
}

/**
 * Contract Call Event
 * Used for tracking badge issuance and community creation
 */
export interface ContractCallEvent extends ChainhookEvent {
  type: EventType.TX;
  contract: string;
  function: string;
  args: Record<string, any>;
  txIndex: number;
  success: boolean;
}

/**
 * NFT Mint Event
 * Specifically for badge NFT minting
 */
export interface NFTMintEvent extends ChainhookEvent {
  type: EventType.TX;
  tokenId: string;
  recipient: string;
  contractAddress: string;
  metadata?: Record<string, any>;
}

/**
 * Metadata Update Event
 * For tracking badge metadata changes
 */
export interface MetadataUpdateEvent extends ChainhookEvent {
  type: EventType.TX;
  entityId: string;
  entityType: 'badge' | 'community' | 'profile';
  changes: Record<string, any>;
  previousValues?: Record<string, any>;
}

/**
 * Reorg Event
 * Represents blockchain reorganization
 */
export interface ReorgEvent extends ChainhookEvent {
  type: EventType.BLOCK;
  reorgDepth: number;
  commonAncestorHeight: number;
  removedBlockHashes: string[];
  addedBlockHashes: string[];
  affectedTransactions: string[];
}

/**
 * Connection Event
 * For monitoring Chainhook connection status
 */
export interface ConnectionEvent {
  timestamp: number;
  status: 'connected' | 'disconnected' | 'reconnecting';
  reason?: string;
  retryCount?: number;
}

/**
 * Predicate Configuration
 * Defines what events to listen for
 */
export interface PredicateConfig {
  id: string;
  name: string;
  network: 'mainnet' | 'testnet';
  contractAddress?: string;
  eventType: EventType;
  filters: {
    functionName?: string;
    sender?: string;
    recipient?: string;
    minAmount?: bigint;
  };
  enabled: boolean;
  createdAt: number;
}

/**
 * Predicate Result
 * Result of predicate evaluation
 */
export interface PredicateResult {
  predicateId: string;
  matched: boolean;
  event: ChainhookEvent;
  matchedAt: number;
  actions?: string[];
}

/**
 * Event Handler Response
 * Response from processing an event
 */
export interface EventHandlerResponse {
  success: boolean;
  eventHash: string;
  handledAt: number;
  processingTimeMs: number;
  actions: {
    name: string;
    status: 'success' | 'failed' | 'pending';
    result?: any;
    error?: string;
  }[];
}

/**
 * Chainhook Integration Config
 */
export interface ChainhookConfig {
  enabled: boolean;
  network: 'mainnet' | 'testnet';
  rpcEndpoint: string;
  webhookUrl?: string;
  pollingIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  predicates: PredicateConfig[];
}

/**
 * Badge Mint Predicate Event
 * Specific event for badge minting
 */
export interface BadgeMintPredicateEvent extends ChainhookEvent {
  type: EventType.TX;
  badgeId: string;
  recipientAddress: string;
  issuerAddress: string;
  communityId: string;
  level: number;
  timestamp: number;
}

/**
 * Community Creation Predicate Event
 */
export interface CommunityCreationEvent extends ChainhookEvent {
  type: EventType.TX;
  communityId: string;
  creatorAddress: string;
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Revocation Event
 * For badge or community revocation
 */
export interface RevocationEvent extends ChainhookEvent {
  type: EventType.TX;
  revokedEntityId: string;
  revokedEntityType: 'badge' | 'community';
  revokedByAddress: string;
  reason: string;
  timestamp: number;
}
