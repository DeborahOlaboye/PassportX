import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  CommunityCreationEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class CommunityCreationHandler implements ChainhookEventHandler {
  canHandle(event: ChainhookEventPayload): boolean {
    if (!event.transactions || event.transactions.length === 0) {
      return false;
    }

    for (const tx of event.transactions) {
      if (!tx.operations) continue;

      for (const op of tx.operations) {
        if (op.type === 'contract_call' && op.contract_call) {
          if (op.contract_call.method === 'create-community') {
            return true;
          }
        }

        if (op.events) {
          for (const evt of op.events) {
            if (evt.topic && evt.topic.includes('community') && evt.topic.includes('created')) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  async handle(event: ChainhookEventPayload): Promise<NotificationPayload[]> {
    try {
      const notifications: NotificationPayload[] = [];

      if (!event.transactions || event.transactions.length === 0) {
        return notifications;
      }

      for (const tx of event.transactions) {
        if (!tx.operations) continue;

        for (const op of tx.operations) {
          if (op.type === 'contract_call' && op.contract_call) {
            const method = op.contract_call.method;

            if (method === 'create-community') {
              const args = op.contract_call.args || [];

              const communityEvent: CommunityCreationEvent = {
                communityId: this.extractCommunityId(args),
                communityName: this.extractCommunityName(args),
                description: this.extractDescription(args),
                ownerAddress: tx.transaction_index.toString(),
                createdAtBlockHeight: event.block_identifier.index,
                contractAddress: op.contract_call.contract,
                transactionHash: tx.transaction_hash,
                blockHeight: event.block_identifier.index,
                timestamp: event.metadata?.pox_cycle_position || Date.now()
              };

              if (communityEvent.communityId && communityEvent.communityName) {
                const notification = this.createNotification(communityEvent);
                notifications.push(notification);
              }
            }
          }

          if (op.events) {
            for (const evt of op.events) {
              if (evt.topic && evt.topic.includes('community') && evt.topic.includes('created')) {
                const communityEvent = EventMapper.mapCommunityCreationEvent({
                  ...evt.value,
                  contractAddress: evt.contract_address,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier.index,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                });

                if (communityEvent && communityEvent.communityId) {
                  const notification = this.createNotification(communityEvent);
                  notifications.push(notification);
                }
              }
            }
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error in CommunityCreationHandler:', error);
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
