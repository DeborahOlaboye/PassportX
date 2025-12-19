import {
  ChainhookEventPayload,
  NotificationType,
  BadgeMintEvent,
  BadgeVerificationEvent,
  CommunityUpdateEvent
} from '../types/handlers';

export class EventMapper {
  static mapBadgeMintEvent(payload: any): BadgeMintEvent {
    return {
      userId: payload.userId || payload.user_id || '',
      badgeId: payload.badgeId || payload.badge_id || '',
      badgeName: payload.badgeName || payload.badge_name || '',
      criteria: payload.criteria || '',
      contractAddress: payload.contractAddress || payload.contract_address || '',
      transactionHash: payload.transactionHash || payload.tx_hash || '',
      blockHeight: payload.blockHeight || payload.block_height || 0,
      timestamp: payload.timestamp || Date.now()
    };
  }

  static mapBadgeVerificationEvent(payload: any): BadgeVerificationEvent {
    return {
      userId: payload.userId || payload.user_id || '',
      badgeId: payload.badgeId || payload.badge_id || '',
      badgeName: payload.badgeName || payload.badge_name || '',
      verificationData: payload.verificationData || payload.verification_data || {},
      contractAddress: payload.contractAddress || payload.contract_address || '',
      transactionHash: payload.transactionHash || payload.tx_hash || '',
      blockHeight: payload.blockHeight || payload.block_height || 0,
      timestamp: payload.timestamp || Date.now()
    };
  }

  static mapCommunityUpdateEvent(payload: any): CommunityUpdateEvent {
    return {
      communityId: payload.communityId || payload.community_id || '',
      communityName: payload.communityName || payload.community_name || '',
      updateType: payload.updateType || payload.update_type || 'announcement',
      affectedUsers: payload.affectedUsers || payload.affected_users || [],
      data: payload.data || {},
      contractAddress: payload.contractAddress || payload.contract_address || '',
      transactionHash: payload.transactionHash || payload.tx_hash || '',
      blockHeight: payload.blockHeight || payload.block_height || 0,
      timestamp: payload.timestamp || Date.now()
    };
  }

  static getNotificationTypeFromEvent(eventType: string): NotificationType {
    const typeMap: Record<string, NotificationType> = {
      'badge-mint': 'badge_received',
      'badge_mint': 'badge_received',
      'badge-issued': 'badge_issued',
      'badge_issued': 'badge_issued',
      'badge-verify': 'badge_verified',
      'badge_verify': 'badge_verified',
      'badge-verified': 'badge_verified',
      'badge_verified': 'badge_verified',
      'community-update': 'community_update',
      'community_update': 'community_update',
      'community-invite': 'community_invite',
      'community_invite': 'community_invite',
      'system-announcement': 'system_announcement',
      'system_announcement': 'system_announcement'
    };

    return typeMap[eventType] || 'system_announcement';
  }

  static extractEventType(chainhookEvent: ChainhookEventPayload): string | null {
    if (!chainhookEvent.transactions) {
      return null;
    }

    for (const tx of chainhookEvent.transactions) {
      if (!tx.operations) continue;

      for (const op of tx.operations) {
        if (op.type === 'contract_call' && op.contract_call) {
          const method = op.contract_call.method;
          
          if (method === 'mint' || method === 'mint-badge') {
            return 'badge-mint';
          }
          
          if (method === 'verify' || method === 'verify-badge') {
            return 'badge-verify';
          }
          
          if (method === 'issue-badge') {
            return 'badge-issued';
          }
        }

        if (op.events) {
          for (const event of op.events) {
            if (event.topic && event.topic.includes('badge')) {
              if (event.topic.includes('mint')) {
                return 'badge-mint';
              }
              if (event.topic.includes('verify')) {
                return 'badge-verify';
              }
              if (event.topic.includes('issue')) {
                return 'badge-issued';
              }
            }
          }
        }
      }
    }

    return null;
  }

  static extractUserIdFromEvent(chainhookEvent: ChainhookEventPayload, eventPayload: any): string | null {
    return eventPayload.userId || eventPayload.user_id || null;
  }

  static extractTransactionHash(chainhookEvent: ChainhookEventPayload): string {
    if (chainhookEvent.transactions && chainhookEvent.transactions.length > 0) {
      return chainhookEvent.transactions[0].transaction_hash || '';
    }
    return '';
  }

  static extractBlockHeight(chainhookEvent: ChainhookEventPayload): number {
    return chainhookEvent.block_identifier?.index || 0;
  }
}
