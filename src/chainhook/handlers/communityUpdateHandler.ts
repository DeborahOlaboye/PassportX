import {
  ChainhookEventPayload,
  ChainhookEventHandler,
  NotificationPayload,
  CommunityUpdateEvent
} from '../types/handlers';
import { EventMapper } from '../utils/eventMapper';

export class CommunityUpdateHandler implements ChainhookEventHandler {
  canHandle(event: ChainhookEventPayload): boolean {
    const eventType = EventMapper.extractEventType(event);
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
            
            if (this.isCommunityMethod(method)) {
              const args = op.contract_call.args || [];
              const updateType = this.extractUpdateType(method, args);
              
              const communityEvent: CommunityUpdateEvent = {
                communityId: this.extractCommunityId(args),
                communityName: this.extractCommunityName(args),
                updateType,
                affectedUsers: this.extractAffectedUsers(args),
                data: this.extractEventData(args),
                contractAddress: op.contract_call.contract,
                transactionHash: tx.transaction_hash,
                blockHeight: event.block_identifier.index,
                timestamp: event.metadata?.pox_cycle_position || Date.now()
              };

              const affectedNotifications = this.createNotifications(communityEvent);
              notifications.push(...affectedNotifications);
            }
          }

          if (op.events) {
            for (const evt of op.events) {
              if (evt.topic && evt.topic.includes('community')) {
                const communityEvent = EventMapper.mapCommunityUpdateEvent({
                  ...evt.value,
                  contractAddress: evt.contract_address,
                  transactionHash: tx.transaction_hash,
                  blockHeight: event.block_identifier.index,
                  timestamp: event.metadata?.pox_cycle_position || Date.now()
                });

                const affectedNotifications = this.createNotifications(communityEvent);
                notifications.push(...affectedNotifications);
              }
            }
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error in CommunityUpdateHandler:', error);
      return [];
    }
  }

  getEventType(): string {
    return 'community-update';
  }

  private isCommunityMethod(method: string): boolean {
    const communityMethods = [
      'join-community',
      'leave-community',
      'create-community',
      'update-community',
      'invite-member',
      'announce',
      'post-update'
    ];
    return communityMethods.includes(method);
  }

  private extractUpdateType(
    method: string,
    args: any[]
  ): 'member_joined' | 'member_left' | 'announcement' | 'event' {
    const typeMap: Record<string, 'member_joined' | 'member_left' | 'announcement' | 'event'> = {
      'join-community': 'member_joined',
      'leave-community': 'member_left',
      'create-community': 'event',
      'update-community': 'announcement',
      'invite-member': 'announcement',
      'announce': 'announcement',
      'post-update': 'announcement'
    };

    return typeMap[method] || 'announcement';
  }

  private extractCommunityId(args: any[]): string {
    if (!args || args.length === 0) return '';
    return args[0]?.value || args[0] || '';
  }

  private extractCommunityName(args: any[]): string {
    if (!args || args.length < 2) return '';
    return args[1]?.value || args[1] || '';
  }

  private extractAffectedUsers(args: any[]): string[] {
    if (!args || args.length < 3) return [];
    
    const usersArg = args[2];
    
    if (Array.isArray(usersArg)) {
      return usersArg.map(u => u?.value || u || '').filter(Boolean);
    }
    
    if (usersArg?.value) {
      return Array.isArray(usersArg.value) ? usersArg.value : [usersArg.value];
    }
    
    return [usersArg] ? [usersArg] : [];
  }

  private extractEventData(args: any[]): Record<string, any> {
    if (!args || args.length < 4) return {};
    
    const data = args[3];
    
    if (typeof data === 'object') {
      return data;
    }
    
    return { raw: data };
  }

  private createNotifications(communityEvent: CommunityUpdateEvent): NotificationPayload[] {
    const notifications: NotificationPayload[] = [];

    for (const userId of communityEvent.affectedUsers) {
      const notification = this.createNotification(communityEvent, userId);
      notifications.push(notification);
    }

    return notifications;
  }

  private createNotification(
    communityEvent: CommunityUpdateEvent,
    userId: string
  ): NotificationPayload {
    const { title, message } = this.getNotificationContent(
      communityEvent.communityName,
      communityEvent.updateType
    );

    const notificationType = communityEvent.updateType === 'announcement' 
      ? 'community_update'
      : communityEvent.updateType === 'member_joined' || communityEvent.updateType === 'member_left'
      ? 'community_update'
      : 'community_invite';

    return {
      userId,
      type: notificationType,
      title,
      message,
      data: {
        eventType: 'community-update',
        communityId: communityEvent.communityId,
        communityName: communityEvent.communityName,
        updateType: communityEvent.updateType,
        contractAddress: communityEvent.contractAddress,
        transactionHash: communityEvent.transactionHash,
        blockHeight: communityEvent.blockHeight,
        timestamp: communityEvent.timestamp,
        eventData: communityEvent.data
      }
    };
  }

  private getNotificationContent(
    communityName: string,
    updateType: 'member_joined' | 'member_left' | 'announcement' | 'event'
  ): { title: string; message: string } {
    const contentMap: Record<typeof updateType, { title: string; message: string }> = {
      'member_joined': {
        title: `New Member in ${communityName}`,
        message: `A new member has joined the ${communityName} community`
      },
      'member_left': {
        title: `Member Left ${communityName}`,
        message: `A member has left the ${communityName} community`
      },
      'announcement': {
        title: `Announcement from ${communityName}`,
        message: `New announcement from the ${communityName} community`
      },
      'event': {
        title: `Event in ${communityName}`,
        message: `New event in the ${communityName} community`
      }
    };

    return contentMap[updateType];
  }
}
