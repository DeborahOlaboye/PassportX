import {
  ChainhookEventPayload,
  NotificationType,
  BadgeMintEvent,
  BadgeVerificationEvent,
  BadgeMetadataUpdateEvent,
  CommunityUpdateEvent,
  CommunityCreationEvent
} from '../types/handlers';

export class EventMapper {
  private static logger = {
    debug: (msg: string, ...args: any[]) => console.debug(`[EventMapper] ${msg}`, ...args),
    info: (msg: string, ...args: any[]) => console.info(`[EventMapper] ${msg}`, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[EventMapper] ${msg}`, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[EventMapper] ${msg}`, ...args)
  };

  static mapBadgeMintEvent(payload: any): BadgeMintEvent {
    try {
      const event: BadgeMintEvent = {
        userId: payload.userId || payload.user_id || '',
        badgeId: payload.badgeId || payload.badge_id || '',
        badgeName: payload.badgeName || payload.badge_name || '',
        criteria: payload.criteria || '',
        contractAddress: payload.contractAddress || payload.contract_address || '',
        transactionHash: payload.transactionHash || payload.tx_hash || '',
        blockHeight: payload.blockHeight || payload.block_height || 0,
        timestamp: payload.timestamp || Date.now()
      };
      
      this.logger.debug('Mapped badge mint event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge mint event:', error);
      throw error;
    }
  }

  static mapBadgeVerificationEvent(payload: any): BadgeVerificationEvent {
    try {
      const event: BadgeVerificationEvent = {
        userId: payload.userId || payload.user_id || '',
        badgeId: payload.badgeId || payload.badge_id || '',
        badgeName: payload.badgeName || payload.badge_name || '',
        verificationData: payload.verificationData || payload.verification_data || {},
        contractAddress: payload.contractAddress || payload.contract_address || '',
        transactionHash: payload.transactionHash || payload.tx_hash || '',
        blockHeight: payload.blockHeight || payload.block_height || 0,
        timestamp: payload.timestamp || Date.now()
      };
      
      this.logger.debug('Mapped badge verification event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge verification event:', error);
      throw error;
    }
  }

  static mapBadgeMetadataUpdateEvent(payload: any): BadgeMetadataUpdateEvent {
    try {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: payload.badgeId || payload.badge_id || '',
        badgeName: payload.badgeName || payload.badge_name || '',
        level: payload.level || payload.badge_level || undefined,
        category: payload.category || payload.badge_category || undefined,
        description: payload.description || payload.badge_description || undefined,
        previousLevel: payload.previousLevel || payload.previous_level || undefined,
        previousCategory: payload.previousCategory || payload.previous_category || undefined,
        previousDescription: payload.previousDescription || payload.previous_description || undefined,
        contractAddress: payload.contractAddress || payload.contract_address || '',
        transactionHash: payload.transactionHash || payload.tx_hash || '',
        blockHeight: payload.blockHeight || payload.block_height || 0,
        timestamp: payload.timestamp || Date.now()
      };
      
      this.logger.debug('Mapped badge metadata update event', {
        badgeId: event.badgeId,
        level: event.level,
        category: event.category
      });
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge metadata update event:', error);
      throw error;
    }
  }

  static mapCommunityUpdateEvent(payload: any): CommunityUpdateEvent {
    try {
      const event: CommunityUpdateEvent = {
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
      
      this.logger.debug('Mapped community update event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping community update event:', error);
      throw error;
    }
  }

  static mapCommunityCreationEvent(payload: any): CommunityCreationEvent {
    try {
      const event: CommunityCreationEvent = {
        communityId: payload.communityId || payload.community_id || '',
        communityName: payload.communityName || payload.community_name || '',
        description: payload.description || '',
        ownerAddress: payload.ownerAddress || payload.owner_address || '',
        createdAtBlockHeight: payload.createdAtBlockHeight || payload.created_at_block_height || 0,
        contractAddress: payload.contractAddress || payload.contract_address || '',
        transactionHash: payload.transactionHash || payload.tx_hash || '',
        blockHeight: payload.blockHeight || payload.block_height || 0,
        timestamp: payload.timestamp || Date.now()
      };
      
      this.logger.debug('Mapped community creation event', {
        communityId: event.communityId,
        communityName: event.communityName,
        ownerAddress: event.ownerAddress
      });
      return event;
    } catch (error) {
      this.logger.error('Error mapping community creation event:', error);
      throw error;
    }
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
      'badge-metadata-update': 'badge_metadata_updated',
      'badge_metadata_update': 'badge_metadata_updated',
      'badge-metadata-updated': 'badge_metadata_updated',
      'badge_metadata_updated': 'badge_metadata_updated',
      'community-update': 'community_update',
      'community_update': 'community_update',
      'community-created': 'community_created',
      'community_created': 'community_created',
      'community-creation': 'community_created',
      'community_creation': 'community_created',
      'community-invite': 'community_invite',
      'community_invite': 'community_invite',
      'system-announcement': 'system_announcement',
      'system_announcement': 'system_announcement'
    };

    const notificationType = typeMap[eventType] || 'system_announcement';
    this.logger.debug(`Mapped event type '${eventType}' to notification type '${notificationType}'`);
    return notificationType;
  }

  static extractEventType(chainhookEvent: ChainhookEventPayload): string | null {
    try {
      if (!chainhookEvent || !chainhookEvent.transactions) {
        this.logger.debug('No transactions found in chainhook event');
        return null;
      }

      for (const tx of chainhookEvent.transactions) {
        if (!tx || !tx.operations) continue;

        for (const op of tx.operations) {
          if (!op) continue;

          if (op.type === 'contract_call' && op.contract_call) {
            const method = op.contract_call.method;
            
            if (method === 'mint' || method === 'mint-badge') {
              this.logger.debug('Detected badge-mint event');
              return 'badge-mint';
            }
            
            if (method === 'verify' || method === 'verify-badge') {
              this.logger.debug('Detected badge-verify event');
              return 'badge-verify';
            }
            
            if (method === 'issue-badge') {
              this.logger.debug('Detected badge-issued event');
              return 'badge-issued';
            }

            if (method === 'update-metadata' || method === 'set-metadata' || method === 'metadata-update') {
              this.logger.debug('Detected badge-metadata-update event');
              return 'badge-metadata-update';
            }

            if (method === 'create-community') {
              this.logger.debug('Detected community-creation event');
              return 'community-creation';
            }
          }

          if (op.events && Array.isArray(op.events)) {
            for (const event of op.events) {
              if (!event || !event.topic) continue;

              if (event.topic.includes('badge')) {
                if (event.topic.includes('mint')) {
                  this.logger.debug('Detected badge-mint event from topic');
                  return 'badge-mint';
                }
                if (event.topic.includes('verify')) {
                  this.logger.debug('Detected badge-verify event from topic');
                  return 'badge-verify';
                }
                if (event.topic.includes('issue')) {
                  this.logger.debug('Detected badge-issued event from topic');
                  return 'badge-issued';
                }
                if (event.topic.includes('metadata')) {
                  this.logger.debug('Detected badge-metadata-update event from topic');
                  return 'badge-metadata-update';
                }
              }

              if (event.topic.includes('community') && event.topic.includes('created')) {
                this.logger.debug('Detected community-creation event from topic');
                return 'community-creation';
              }
            }
          }
        }
      }

      this.logger.debug('No recognized event type found in chainhook event');
      return null;
    } catch (error) {
      this.logger.error('Error extracting event type:', error);
      return null;
    }
  }

  static extractUserIdFromEvent(chainhookEvent: ChainhookEventPayload, eventPayload: any): string | null {
    try {
      const userId = eventPayload?.userId || eventPayload?.user_id || null;
      if (userId) {
        this.logger.debug(`Extracted userId: ${userId}`);
      }
      return userId;
    } catch (error) {
      this.logger.error('Error extracting user ID:', error);
      return null;
    }
  }

  static extractTransactionHash(chainhookEvent: ChainhookEventPayload): string {
    try {
      if (chainhookEvent && chainhookEvent.transactions && chainhookEvent.transactions.length > 0) {
        const hash = chainhookEvent.transactions[0].transaction_hash || '';
        if (hash) {
          this.logger.debug(`Extracted transaction hash: ${hash.substring(0, 8)}...`);
        }
        return hash;
      }
      this.logger.debug('No transaction hash found');
      return '';
    } catch (error) {
      this.logger.error('Error extracting transaction hash:', error);
      return '';
    }
  }

  static extractBlockHeight(chainhookEvent: ChainhookEventPayload): number {
    try {
      const blockHeight = chainhookEvent?.block_identifier?.index || 0;
      this.logger.debug(`Extracted block height: ${blockHeight}`);
      return blockHeight;
    } catch (error) {
      this.logger.error('Error extracting block height:', error);
      return 0;
    }
  }
}
