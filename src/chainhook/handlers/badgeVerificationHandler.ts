import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  BadgeVerificationEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class BadgeVerificationHandler implements ChainhookEventHandler {
  canHandle(event: ChainhookEventPayload): boolean {
    const eventType = EventMapper.extractEventType(event);
    return eventType === 'badge-verify';
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
            
            if (method === 'verify' || method === 'verify-badge') {
              const args = op.contract_call.args || [];
              
              const verificationEvent: BadgeVerificationEvent = {
                userId: this.extractUserId(args),
                badgeId: this.extractBadgeId(args),
                badgeName: this.extractBadgeName(args),
                verificationData: this.extractVerificationData(args),
                contractAddress: op.contract_call.contract,
                transactionHash: tx.transaction_hash,
                blockHeight: event.block_identifier.index,
                timestamp: event.metadata?.pox_cycle_position || Date.now()
              };

              if (verificationEvent.userId) {
                const notification = this.createNotification(verificationEvent);
                notifications.push(notification);
              }
            }
          }

          if (op.events) {
            for (const evt of op.events) {
              if (evt.topic && evt.topic.includes('verify')) {
                const verificationEvent = EventMapper.mapBadgeVerificationEvent({
                  ...evt.value,
                  contractAddress: evt.contract_address,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier.index,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                });

                if (verificationEvent.userId) {
                  const notification = this.createNotification(verificationEvent);
                  notifications.push(notification);
                }
              }
            }
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error in BadgeVerificationHandler:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'badge-verify';
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

  private extractVerificationData(args: any[]): Record<string, any> {
    if (!args || args.length < 4) return {};
    const data = args[3];
    
    if (typeof data === 'object') {
      return data;
    }
    
    return { raw: data };
  }

  private createNotification(verificationEvent: BadgeVerificationEvent): NotificationPayload {
    const verificationStatus = this.getVerificationStatus(verificationEvent.verificationData);
    
    return {
      userId: verificationEvent.userId,
      type: 'badge_verified',
      title: `Badge Verification Update: ${verificationEvent.badgeName}`,
      message: `Your ${verificationEvent.badgeName} badge has been verified. Status: ${verificationStatus}`,
      data: {
        eventType: 'badge-verify',
        badgeId: verificationEvent.badgeId,
        badgeName: verificationEvent.badgeName,
        verificationStatus,
        contractAddress: verificationEvent.contractAddress,
        transactionHash: verificationEvent.transactionHash,
        blockHeight: verificationEvent.blockHeight,
        timestamp: verificationEvent.timestamp,
        verificationData: verificationEvent.verificationData
      }
    };
  }

  private getVerificationStatus(verificationData: any): string {
    if (typeof verificationData === 'object' && verificationData.status) {
      return verificationData.status;
    }
    return 'verified';
  }
}
