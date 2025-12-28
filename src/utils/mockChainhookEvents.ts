// Mock event generator for Chainhook testing
import {
  ChainhookEvent,
  EventType,
  STXTransferEvent,
  ContractCallEvent,
  NFTMintEvent,
  MetadataUpdateEvent,
  BadgeMintPredicateEvent,
  CommunityCreationEvent,
  RevocationEvent,
  ReorgEvent
} from '../types/chainhook';

/**
 * Mock Chainhook Event Factory
 * Creates realistic mock events for testing
 */
export class MockChainhookEventFactory {
  private static counter = 0;

  private static reset(): void {
    this.counter = 0;
  }

  private static getNextId(): number {
    return ++this.counter;
  }

  /**
   * Create a mock STX transfer event
   */
  static createSTXTransferEvent(
    overrides?: Partial<STXTransferEvent>
  ): STXTransferEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      sender: overrides?.sender || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      recipient: overrides?.recipient || 'ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT',
      amount: overrides?.amount || BigInt(1000000),
      txIndex: overrides?.txIndex || 0,
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock contract call event
   */
  static createContractCallEvent(
    overrides?: Partial<ContractCallEvent>
  ): ContractCallEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      contract: overrides?.contract || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      function: overrides?.function || 'mint-badge',
      args: overrides?.args || { recipientAddress: 'ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT' },
      txIndex: overrides?.txIndex || 0,
      success: overrides?.success !== undefined ? overrides.success : true,
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock NFT mint event
   */
  static createNFTMintEvent(
    overrides?: Partial<NFTMintEvent>
  ): NFTMintEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      tokenId: overrides?.tokenId || `badge-${this.getNextId()}`,
      recipient: overrides?.recipient || 'ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT',
      contractAddress: overrides?.contractAddress || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      metadata: overrides?.metadata || { level: 1, category: 'achievement' },
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock metadata update event
   */
  static createMetadataUpdateEvent(
    overrides?: Partial<MetadataUpdateEvent>
  ): MetadataUpdateEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      entityId: overrides?.entityId || `entity-${this.getNextId()}`,
      entityType: overrides?.entityType || 'badge',
      changes: overrides?.changes || { name: 'Updated Badge Name' },
      previousValues: overrides?.previousValues || { name: 'Old Badge Name' },
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock badge mint predicate event
   */
  static createBadgeMintEvent(
    overrides?: Partial<BadgeMintPredicateEvent>
  ): BadgeMintPredicateEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      badgeId: overrides?.badgeId || `badge-${this.getNextId()}`,
      recipientAddress: overrides?.recipientAddress || 'ST2CY5V39NAYQ07NNC5V4FQ7QG7V5K2KKG3TZYJCT',
      issuerAddress: overrides?.issuerAddress || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      communityId: overrides?.communityId || 'community-1',
      level: overrides?.level || 1,
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock community creation event
   */
  static createCommunityCreationEvent(
    overrides?: Partial<CommunityCreationEvent>
  ): CommunityCreationEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      communityId: overrides?.communityId || `community-${this.getNextId()}`,
      creatorAddress: overrides?.creatorAddress || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      name: overrides?.name || `Test Community ${this.getNextId()}`,
      description: overrides?.description || 'A test community',
      metadata: overrides?.metadata || { tags: ['test'] },
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock revocation event
   */
  static createRevocationEvent(
    overrides?: Partial<RevocationEvent>
  ): RevocationEvent {
    const timestamp = Date.now();
    return {
      type: EventType.TX,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      revokedEntityId: overrides?.revokedEntityId || `badge-${this.getNextId()}`,
      revokedEntityType: overrides?.revokedEntityType || 'badge',
      revokedByAddress: overrides?.revokedByAddress || 'ST1PQHQV0NNYJXWZ98C0JHRCJMZC0Y4SKTMM0GCXG',
      reason: overrides?.reason || 'Policy violation',
      txHash: overrides?.txHash || `0x${this.getNextId().toString().padStart(64, '0')}`,
      ...overrides
    };
  }

  /**
   * Create a mock reorg event
   */
  static createReorgEvent(
    overrides?: Partial<ReorgEvent>
  ): ReorgEvent {
    const timestamp = Date.now();
    return {
      type: EventType.BLOCK,
      timestamp,
      blockHeight: 100000 + this.getNextId(),
      blockHash: `0x${'0'.repeat(64)}`,
      reorgDepth: overrides?.reorgDepth || 3,
      commonAncestorHeight: overrides?.commonAncestorHeight || 99997,
      removedBlockHashes: overrides?.removedBlockHashes || [
        `0x${this.getNextId().toString().padStart(64, '0')}`,
        `0x${this.getNextId().toString().padStart(64, '0')}`
      ],
      addedBlockHashes: overrides?.addedBlockHashes || [
        `0x${this.getNextId().toString().padStart(64, '0')}`,
        `0x${this.getNextId().toString().padStart(64, '0')}`
      ],
      affectedTransactions: overrides?.affectedTransactions || [
        `0x${this.getNextId().toString().padStart(64, '0')}`,
        `0x${this.getNextId().toString().padStart(64, '0')}`
      ],
      ...overrides
    };
  }

  /**
   * Create a batch of random events for testing
   */
  static createEventBatch(
    count: number = 10,
    types: EventType[] = [EventType.TX]
  ): ChainhookEvent[] {
    this.reset();
    const events: ChainhookEvent[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      let event: ChainhookEvent;

      switch (type) {
        case EventType.TX:
          const eventTypeChoice = i % 3;
          if (eventTypeChoice === 0) {
            event = this.createSTXTransferEvent();
          } else if (eventTypeChoice === 1) {
            event = this.createContractCallEvent();
          } else {
            event = this.createNFTMintEvent();
          }
          break;
        case EventType.BLOCK:
          event = this.createReorgEvent();
          break;
        default:
          event = this.createSTXTransferEvent();
      }

      events.push(event);
    }

    return events;
  }
}
