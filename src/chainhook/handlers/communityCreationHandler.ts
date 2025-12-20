import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  CommunityCreationEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class CommunityCreationHandler implements ChainhookEventHandler {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCreationHandler] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCreationHandler] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCreationHandler] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCreationHandler] ${msg}`, ...args)
    };
  }

  canHandle(event: ChainhookEventPayload): boolean {
    try {
      if (!event || !event.transactions || event.transactions.length === 0) {
        return false;
      }

      for (const tx of event.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          if (op.type === 'contract_call' && op.contract_call) {
            if (op.contract_call.method === 'create-community') {
              this.logger.debug('Detected create-community contract call');
              return true;
            }
          }

          if (op.events && Array.isArray(op.events)) {
            for (const evt of op.events) {
              if (evt && evt.topic && evt.topic.includes('community') && evt.topic.includes('created')) {
                this.logger.debug('Detected community-created event');
                return true;
              }
            }
          }
        }
      }

      return false;
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
    if (!args || args.length === 0) return '';
    return args[0]?.value || args[0] || '';
  }

  private extractCommunityName(args: any[]): string {
    if (!args || args.length < 2) return '';
    return args[1]?.value || args[1] || '';
  }

  private extractDescription(args: any[]): string {
    if (!args || args.length < 3) return '';
    return args[2]?.value || args[2] || '';
  }

  private extractOwnerAddress(contractCall: any, tx: any): string {
    if (contractCall?.args && contractCall.args.length > 3) {
      return contractCall.args[3]?.value || contractCall.args[3] || '';
    }
    return tx.transaction_sender || '';
  }

  private extractTimestamp(event: ChainhookEventPayload): number {
    if (event.metadata?.pox_cycle_position) {
      return event.metadata.pox_cycle_position;
    }
    return Date.now();
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
