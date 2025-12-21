import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  CommunityCreationEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class CommunityCreationHandler implements ChainhookEventHandler {
  private logger: any;
  private readonly SUPPORTED_METHODS = ['create-community', 'create-comm'];
  private readonly SUPPORTED_TOPICS = ['community-created', 'community-creation'];
  private compiledMethodFilter: Set<string>;
  private compiledTopicFilter: Set<string>;
  private lastHitTime = 0;
  private hitCache: Map<string, boolean> = new Map();
  private readonly CACHE_TTL_MS = 5000;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
    this.compiledMethodFilter = new Set(this.SUPPORTED_METHODS);
    this.compiledTopicFilter = new Set(this.SUPPORTED_TOPICS);
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCreationHandler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCreationHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCreationHandler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCreationHandler] ${msg}`, ...args)
    };
  }

  private getCacheKey(event: ChainhookEventPayload): string {
    return `${event.block_identifier?.index}:${event.transactions?.[0]?.transaction_hash || ''}`;
  }

  private isCacheValid(cachedTime: number): boolean {
    return Date.now() - cachedTime < this.CACHE_TTL_MS;
  }

  canHandle(event: ChainhookEventPayload): boolean {
    try {
      if (!event || !event.transactions || event.transactions.length === 0) {
        return false;
      }

      const cacheKey = this.getCacheKey(event);
      const cachedResult = this.hitCache.get(cacheKey);

      if (cachedResult !== undefined && this.isCacheValid(this.lastHitTime)) {
        this.logger.debug('Cache hit for event canHandle check');
        return cachedResult;
      }

      let result = false;

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          if (op.type === 'contract_call' && op.contract_call) {
            const method = op.contract_call.method;
            if (this.compiledMethodFilter.has(method)) {
              this.logger.debug('Detected create-community contract call');
              result = true;
              break;
            }
          }

          if (!result && op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && evt.topic) {
                for (const topic of this.compiledTopicFilter) {
                  if (evt.topic.includes(topic)) {
                    this.logger.debug('Detected community-created event');
                    result = true;
                    break;
                  }
                }
              }
              if (result) break;
            }
          }

          if (result) break;
        }

        if (result) break;
      }

      this.lastHitTime = Date.now();
      this.hitCache.set(cacheKey, result);

      if (this.hitCache.size > 1000) {
        const oldestKey = this.hitCache.keys().next().value;
        this.hitCache.delete(oldestKey);
      }

      return result;
    } catch (error) {
      this.logger.error('Error in canHandle method:', error);
      return false;
    }
  }

  async handle(event: ChainhookEventPayload): Promise<NotificationPayload[]> {
    try {
      if (!event) {
        this.logger.warn('Received null or undefined event');
        return [];
      }

      const notifications: NotificationPayload[] = [];

      if (!event.transactions || event.transactions.length === 0) {
        this.logger.debug('No transactions in event');
        return notifications;
      }

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          try {
            if (op.type === 'contract_call' && op.contract_call) {
              const method = op.contract_call.method;

              if (method === 'create-community') {
                const args = op.contract_call.args || [];
                const ownerAddress = this.extractOwnerAddress(op.contract_call, tx);

                if (!ownerAddress) {
                  this.logger.warn('Failed to extract ownerAddress from contract call');
                  continue;
                }

                const communityEvent: CommunityCreationEvent = {
                  communityId: this.extractCommunityId(args),
                  communityName: this.extractCommunityName(args),
                  description: this.extractDescription(args),
                  ownerAddress,
                  createdAtBlockHeight: event.block_identifier?.index || 0,
                  contractAddress: op.contract_call.contract,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier?.index || 0,
                  timestamp: this.extractTimestamp(event)
                };

                if (!this.validateCommunityEvent(communityEvent)) {
                  this.logger.warn('Invalid community event data', communityEvent);
                  continue;
                }

                const notification = this.createNotification(communityEvent);
                notifications.push(notification);
                this.logger.info('Created community creation notification', {
                  communityId: communityEvent.communityId,
                  communityName: communityEvent.communityName
                });
              }
            }

            if (op.events && Array.isArray(op.events)) {
              for (const evt of op.events) {
                if (!evt || !evt.topic) continue;

                if (evt.topic.includes('community') && evt.topic.includes('created')) {
                  const communityEvent = EventMapper.mapCommunityCreationEvent({
                    ...evt.value,
                    contractAddress: evt.contract_address,
                    transactionHash: tx.transaction_hash,
                    blockHeight: event.block_identifier?.index || 0,
                    timestamp: this.extractTimestamp(event)
                  });

                  if (communityEvent && this.validateCommunityEvent(communityEvent)) {
                    const notification = this.createNotification(communityEvent);
                    notifications.push(notification);
                    this.logger.info('Created event-based community creation notification', {
                      communityId: communityEvent.communityId,
                      communityName: communityEvent.communityName
                    });
                  }
                }
              }
            }
          } catch (opError) {
            this.logger.error('Error processing operation:', opError);
            continue;
          }
        }
      }

      return notifications;
    } catch (error) {
      this.logger.error('Error in CommunityCreationHandler.handle:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'community-creation';
  }

  private extractCommunityId(args: any[]): string {
    try {
      if (!args || !Array.isArray(args) || args.length === 0) {
        this.logger.debug('No community ID found in args');
        return '';
      }
      const id = args[0]?.value || args[0] || '';
      if (id && typeof id === 'string') {
        this.logger.debug('Extracted community ID', { id });
        return id;
      }
      return '';
    } catch (error) {
      this.logger.error('Error extracting community ID:', error);
      return '';
    }
  }

  private extractCommunityName(args: any[]): string {
    try {
      if (!args || !Array.isArray(args) || args.length < 2) {
        this.logger.debug('No community name found in args');
        return '';
      }
      const name = args[1]?.value || args[1] || '';
      if (name && typeof name === 'string') {
        this.logger.debug('Extracted community name', { name });
        return name;
      }
      return '';
    } catch (error) {
      this.logger.error('Error extracting community name:', error);
      return '';
    }
  }

  private extractDescription(args: any[]): string {
    try {
      if (!args || !Array.isArray(args) || args.length < 3) {
        this.logger.debug('No description found in args');
        return '';
      }
      const description = args[2]?.value || args[2] || '';
      if (description && typeof description === 'string') {
        this.logger.debug('Extracted description');
        return description;
      }
      return '';
    } catch (error) {
      this.logger.error('Error extracting description:', error);
      return '';
    }
  }

  private extractOwnerAddress(contractCall: any, tx: any): string {
    try {
      if (contractCall?.args && Array.isArray(contractCall.args) && contractCall.args.length > 3) {
        const arg = contractCall.args[3];
        const ownerFromArgs = arg?.value || arg;
        if (typeof ownerFromArgs === 'string' && ownerFromArgs.trim().length > 0) {
          this.logger.debug('Extracted owner address from contract args', { address: ownerFromArgs });
          return ownerFromArgs;
        }
      }

      if (tx?.transaction_sender && typeof tx.transaction_sender === 'string') {
        this.logger.debug('Using transaction sender as owner address', { address: tx.transaction_sender });
        return tx.transaction_sender;
      }

      if (tx?.sender && typeof tx.sender === 'string') {
        this.logger.debug('Using tx.sender as owner address', { address: tx.sender });
        return tx.sender;
      }

      if (tx?.tx_sender && typeof tx.tx_sender === 'string') {
        this.logger.debug('Using tx.tx_sender as owner address', { address: tx.tx_sender });
        return tx.tx_sender;
      }

      this.logger.warn('Unable to extract owner address from contract call or transaction');
      return '';
    } catch (error) {
      this.logger.error('Error extracting owner address:', error);
      return '';
    }
  }

  private extractTimestamp(event: ChainhookEventPayload): number {
    try {
      if (event?.metadata?.pox_cycle_position && typeof event.metadata.pox_cycle_position === 'number') {
        this.logger.debug('Using pox_cycle_position as timestamp', { timestamp: event.metadata.pox_cycle_position });
        return event.metadata.pox_cycle_position;
      }

      if (event?.timestamp && typeof event.timestamp === 'number') {
        this.logger.debug('Using event timestamp', { timestamp: event.timestamp });
        return event.timestamp;
      }

      const now = Date.now();
      this.logger.debug('Using current timestamp', { timestamp: now });
      return now;
    } catch (error) {
      this.logger.error('Error extracting timestamp:', error);
      return Date.now();
    }
  }

  private validateCommunityEvent(event: CommunityCreationEvent): boolean {
    return !!(
      event.communityId &&
      event.communityName &&
      event.ownerAddress &&
      event.contractAddress &&
      event.transactionHash
    );
  }

  private createNotification(communityEvent: CommunityCreationEvent): NotificationPayload {
    return {
      userId: communityEvent.ownerAddress,
      type: 'community_created',
      title: `Community Created: ${communityEvent.communityName}`,
      message: `Your new community "${communityEvent.communityName}" has been successfully created on the blockchain`,
      data: {
        eventType: 'community-creation',
        communityId: communityEvent.communityId,
        communityName: communityEvent.communityName,
        description: communityEvent.description,
        ownerAddress: communityEvent.ownerAddress,
        contractAddress: communityEvent.contractAddress,
        transactionHash: communityEvent.transactionHash,
        blockHeight: communityEvent.blockHeight,
        timestamp: communityEvent.timestamp
      }
    };
  }
}
