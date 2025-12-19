import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  BadgeMintEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class BadgeMintHandler implements ChainhookEventHandler {
  canHandle(event: ChainhookEventPayload): boolean {
    const eventType = EventMapper.extractEventType(event);
    return eventType === 'badge-mint';
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
            
            if (method === 'mint' || method === 'mint-badge') {
              const args = op.contract_call.args || [];
              
              const badgeEvent: BadgeMintEvent = {
                userId: this.extractUserId(args),
                badgeId: this.extractBadgeId(args),
                badgeName: this.extractBadgeName(args),
                criteria: this.extractCriteria(args),
                contractAddress: op.contract_call.contract,
                transactionHash: tx.transaction_hash,
                blockHeight: event.block_identifier.index,
                timestamp: event.metadata?.pox_cycle_position || Date.now()
              };

              if (badgeEvent.userId) {
                const notification = this.createNotification(badgeEvent);
                notifications.push(notification);
              }
            }
          }

          if (op.events) {
            for (const evt of op.events) {
              if (evt.topic && evt.topic.includes('mint')) {
                const badgeEvent = EventMapper.mapBadgeMintEvent({
                  ...evt.value,
                  contractAddress: evt.contract_address,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier.index,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                });

                if (badgeEvent.userId) {
                  const notification = this.createNotification(badgeEvent);
                  notifications.push(notification);
                }
              }
            }
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error in BadgeMintHandler:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'badge-mint';
  }

  private extractUserId(args: any[]): string {
    if (!args || args.length === 0) return '';
    return args[0]?.value || args[0] || '';
  }

  private extractBadgeId(args: any[]): string {
    if (!args || args.length < 2) return '';
    return args[1]?.value || args[1] || '';
  }

  private extractBadgeName(args: any[]): string {
    if (!args || args.length < 3) return '';
    return args[2]?.value || args[2] || '';
  }

  private extractCriteria(args: any[]): string {
    if (!args || args.length < 4) return '';
    return args[3]?.value || args[3] || '';
  }

  private createNotification(badgeEvent: BadgeMintEvent): NotificationPayload {
    return {
      userId: badgeEvent.userId,
      type: 'badge_received',
      title: `Badge Received: ${badgeEvent.badgeName}`,
      message: `Congratulations! You've received the ${badgeEvent.badgeName} badge for ${badgeEvent.criteria}`,
      data: {
        eventType: 'badge-mint',
        badgeId: badgeEvent.badgeId,
        badgeName: badgeEvent.badgeName,
        criteria: badgeEvent.criteria,
        contractAddress: badgeEvent.contractAddress,
        transactionHash: badgeEvent.transactionHash,
        blockHeight: badgeEvent.blockHeight,
        timestamp: badgeEvent.timestamp
      }
    };
  }
}
