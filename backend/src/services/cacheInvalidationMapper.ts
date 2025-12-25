import { ChainhookEventPayload } from '../chainhook/types/handlers';
import { EventDrivenCacheInvalidator } from './eventDrivenCacheInvalidator';

export interface CacheInvalidationMapping {
  eventType: string;
  extractData: (event: ChainhookEventPayload) => any;
  conditions: ((event: ChainhookEventPayload) => boolean)[];
  priority: 'high' | 'medium' | 'low';
}

export class CacheInvalidationMapper {
  private invalidator: EventDrivenCacheInvalidator;
  private mappings: Map<string, CacheInvalidationMapping> = new Map();
  private logger: any;

  constructor(invalidator: EventDrivenCacheInvalidator, logger?: any) {
    this.invalidator = invalidator;
    this.logger = logger || this.getDefaultLogger();
    this.initializeMappings();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CacheInvalidationMapper] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CacheInvalidationMapper] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CacheInvalidationMapper] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CacheInvalidationMapper] ${msg}`, ...args)
    };
  }

  private initializeMappings(): void {
    // Badge minting mapping
    this.mappings.set('badge-mint', {
      eventType: 'badge-mint',
      extractData: (event) => this.extractBadgeMintData(event),
      conditions: [
        (event) => this.isBadgeMintEvent(event),
        (event) => this.hasValidTransaction(event)
      ],
      priority: 'high'
    });

    // Badge metadata update mapping
    this.mappings.set('badge-metadata-update', {
      eventType: 'badge-metadata-update',
      extractData: (event) => this.extractBadgeMetadataData(event),
      conditions: [
        (event) => this.isBadgeMetadataUpdateEvent(event),
        (event) => this.hasValidTransaction(event)
      ],
      priority: 'medium'
    });

    // Badge revocation mapping
    this.mappings.set('badge-revocation', {
      eventType: 'badge-revocation',
      extractData: (event) => this.extractBadgeRevocationData(event),
      conditions: [
        (event) => this.isBadgeRevocationEvent(event),
        (event) => this.hasValidTransaction(event)
      ],
      priority: 'high'
    });

    // Community creation mapping
    this.mappings.set('community-creation', {
      eventType: 'community-creation',
      extractData: (event) => this.extractCommunityCreationData(event),
      conditions: [
        (event) => this.isCommunityCreationEvent(event),
        (event) => this.hasValidTransaction(event)
      ],
      priority: 'medium'
    });

    this.logger.info(`Initialized ${this.mappings.size} cache invalidation mappings`);
  }

  async mapAndInvalidate(event: ChainhookEventPayload): Promise<void> {
    try {
      for (const [mappingKey, mapping] of this.mappings) {
        if (this.shouldApplyMapping(event, mapping)) {
          const eventData = mapping.extractData(event);

          this.logger.info(`Mapping Chainhook event to cache invalidation`, {
            mappingKey,
            eventType: mapping.eventType,
            priority: mapping.priority,
            hasData: !!eventData
          });

          await this.invalidator.invalidateCacheForEvent(mapping.eventType, eventData);
          break; // Only apply the first matching mapping
        }
      }
    } catch (error) {
      this.logger.error('Error in cache invalidation mapping:', error);
    }
  }

  private shouldApplyMapping(event: ChainhookEventPayload, mapping: CacheInvalidationMapping): boolean {
    return mapping.conditions.every(condition => condition(event));
  }

  private isBadgeMintEvent(event: ChainhookEventPayload): boolean {
    if (!event.transactions || event.transactions.length === 0) return false;

    return event.transactions.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        op.contract_call?.method &&
        ['mint', 'mint-badge', 'nft-mint'].includes(op.contract_call.method)
      ) ||
      tx.operations?.some(op =>
        op.events?.some(evt =>
          evt.topic && (
            evt.topic.includes('mint') ||
            evt.topic.includes('nft') ||
            evt.topic.includes('badge-mint')
          )
        )
      )
    );
  }

  private isBadgeMetadataUpdateEvent(event: ChainhookEventPayload): boolean {
    if (!event.transactions || event.transactions.length === 0) return false;

    return event.transactions.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        op.contract_call?.method &&
        ['update-metadata', 'update-badge', 'set-metadata'].includes(op.contract_call.method)
      ) ||
      tx.operations?.some(op =>
        op.events?.some(evt =>
          evt.topic && (
            evt.topic.includes('metadata') ||
            evt.topic.includes('update') ||
            evt.topic.includes('badge-update')
          )
        )
      )
    );
  }

  private isBadgeRevocationEvent(event: ChainhookEventPayload): boolean {
    if (!event.transactions || event.transactions.length === 0) return false;

    return event.transactions.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        op.contract_call?.method &&
        ['revoke', 'revoke-badge', 'burn'].includes(op.contract_call.method)
      ) ||
      tx.operations?.some(op =>
        op.events?.some(evt =>
          evt.topic && (
            evt.topic.includes('revoke') ||
            evt.topic.includes('revocation') ||
            evt.topic.includes('burn')
          )
        )
      )
    );
  }

  private isCommunityCreationEvent(event: ChainhookEventPayload): boolean {
    if (!event.transactions || event.transactions.length === 0) return false;

    return event.transactions.some(tx =>
      tx.operations?.some(op =>
        op.type === 'contract_call' &&
        op.contract_call?.method &&
        ['create-community', 'new-community', 'deploy-community'].includes(op.contract_call.method)
      ) ||
      tx.operations?.some(op =>
        op.events?.some(evt =>
          evt.topic && (
            evt.topic.includes('community') &&
            (evt.topic.includes('create') || evt.topic.includes('new'))
          )
        )
      )
    );
  }

  private hasValidTransaction(event: ChainhookEventPayload): boolean {
    return !!(event.transactions && event.transactions.length > 0);
  }

  private extractBadgeMintData(event: ChainhookEventPayload): any {
    const tx = event.transactions[0];
    if (!tx) return null;

    // Find the contract call operation
    const contractCallOp = tx.operations?.find(op =>
      op.type === 'contract_call' && op.contract_call
    );

    if (contractCallOp?.contract_call) {
      const args = contractCallOp.contract_call.args || [];
      return {
        userId: this.extractRecipientAddress(args, contractCallOp.contract_call, tx),
        badgeId: this.extractBadgeId(args),
        badgeName: this.extractBadgeName(args),
        criteria: this.extractCriteria(args),
        contractAddress: contractCallOp.contract_call.contract,
        transactionHash: tx.transaction_hash,
        blockHeight: event.block_identifier?.index || 0,
        timestamp: event.metadata?.pox_cycle_position || Date.now()
      };
    }

    // Try to extract from events
    const mintEvent = tx.operations?.find(op =>
      op.events?.some(evt => evt.topic && evt.topic.includes('mint'))
    )?.events?.find(evt => evt.topic && evt.topic.includes('mint'));

    if (mintEvent) {
      return {
        userId: mintEvent.value?.recipient || tx.sender,
        badgeId: mintEvent.value?.badgeId || '',
        badgeName: mintEvent.value?.badgeName || 'Achievement Badge',
        criteria: mintEvent.value?.criteria || 'completing a task',
        contractAddress: mintEvent.contract_address,
        transactionHash: tx.transaction_hash,
        blockHeight: event.block_identifier?.index || 0,
        timestamp: event.metadata?.pox_cycle_position || Date.now()
      };
    }

    return null;
  }

  private extractBadgeMetadataData(event: ChainhookEventPayload): any {
    const tx = event.transactions[0];
    if (!tx) return null;

    const contractCallOp = tx.operations?.find(op =>
      op.type === 'contract_call' && op.contract_call
    );

    if (contractCallOp?.contract_call) {
      const args = contractCallOp.contract_call.args || [];
      return {
        badgeId: this.extractBadgeId(args),
        changedFields: this.extractChangedFields(args),
        contractAddress: contractCallOp.contract_call.contract,
        transactionHash: tx.transaction_hash,
        blockHeight: event.block_identifier?.index || 0,
        timestamp: event.metadata?.pox_cycle_position || Date.now()
      };
    }

    return null;
  }

  private extractBadgeRevocationData(event: ChainhookEventPayload): any {
    const tx = event.transactions[0];
    if (!tx) return null;

    const contractCallOp = tx.operations?.find(op =>
      op.type === 'contract_call' && op.contract_call
    );

    if (contractCallOp?.contract_call) {
      const args = contractCallOp.contract_call.args || [];
      return {
        badgeId: this.extractBadgeId(args),
        userId: this.extractRecipientAddress(args, contractCallOp.contract_call, tx),
        revocationType: this.extractRevocationType(args),
        contractAddress: contractCallOp.contract_call.contract,
        transactionHash: tx.transaction_hash,
        blockHeight: event.block_identifier?.index || 0,
        timestamp: event.metadata?.pox_cycle_position || Date.now()
      };
    }

    return null;
  }

  private extractCommunityCreationData(event: ChainhookEventPayload): any {
    const tx = event.transactions[0];
    if (!tx) return null;

    const contractCallOp = tx.operations?.find(op =>
      op.type === 'contract_call' && op.contract_call
    );

    if (contractCallOp?.contract_call) {
      const args = contractCallOp.contract_call.args || [];
      return {
        communityId: this.extractCommunityId(args),
        communityName: this.extractCommunityName(args),
        ownerAddress: tx.sender,
        contractAddress: contractCallOp.contract_call.contract,
        transactionHash: tx.transaction_hash,
        blockHeight: event.block_identifier?.index || 0,
        timestamp: event.metadata?.pox_cycle_position || Date.now()
      };
    }

    return null;
  }

  private extractRecipientAddress(args: any[], contractCall: any, tx: any): string {
    if (!args || args.length === 0) return tx?.sender || '';
    const firstArg = args[0]?.value || args[0];
    return typeof firstArg === 'string' ? firstArg : tx?.sender || '';
  }

  private extractBadgeId(args: any[]): string {
    if (!args || args.length < 2) return '';
    return args[1]?.value || args[1] || '';
  }

  private extractBadgeName(args: any[]): string {
    if (!args || args.length < 3) return 'Achievement Badge';
    return args[2]?.value || args[2] || 'Achievement Badge';
  }

  private extractCriteria(args: any[]): string {
    if (!args || args.length < 4) return 'completing a task';
    return args[3]?.value || args[3] || 'completing a task';
  }

  private extractChangedFields(args: any[]): string[] {
    if (!args || args.length < 2) return [];
    const fieldsArg = args[1]?.value || args[1];
    return Array.isArray(fieldsArg) ? fieldsArg : [fieldsArg].filter(Boolean);
  }

  private extractRevocationType(args: any[]): 'soft' | 'hard' {
    if (!args || args.length < 3) return 'soft';
    const typeArg = args[2]?.value || args[2];
    return typeArg === 'hard' ? 'hard' : 'soft';
  }

  private extractCommunityId(args: any[]): string {
    if (!args || args.length < 1) return '';
    return args[0]?.value || args[0] || '';
  }

  private extractCommunityName(args: any[]): string {
    if (!args || args.length < 2) return '';
    return args[1]?.value || args[1] || '';
  }

  getMappings(): CacheInvalidationMapping[] {
    return Array.from(this.mappings.values());
  }

  addMapping(mapping: CacheInvalidationMapping): void {
    this.mappings.set(mapping.eventType, mapping);
    this.logger.info(`Added cache invalidation mapping for ${mapping.eventType}`);
  }

  removeMapping(eventType: string): boolean {
    const removed = this.mappings.delete(eventType);
    if (removed) {
      this.logger.info(`Removed cache invalidation mapping for ${eventType}`);
    }
    return removed;
  }
}

export default CacheInvalidationMapper;</content>
<parameter name="filePath">/Users/mac/Documents/DEBY/Personal Projects/PassportX/backend/src/services/cacheInvalidationMapper.ts