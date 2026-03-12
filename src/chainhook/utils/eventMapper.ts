import {
  ChainhookEventPayload,
  NotificationType,
  BadgeMintEvent,
  BadgeVerificationEvent,
  BadgeMetadataUpdateEvent,
  BadgeRevocationEvent,
  CommunityUpdateEvent,
  CommunityCreationEvent,
} from '../types/handlers';

export class EventMapper {
  private static logger = {
    debug: (msg: string, ...args: unknown[]) =>
      console.debug(`[EventMapper] ${msg}`, ...args),
    info: (msg: string, ...args: unknown[]) =>
      console.info(`[EventMapper] ${msg}`, ...args),
    warn: (msg: string, ...args: unknown[]) =>
      console.warn(`[EventMapper] ${msg}`, ...args),
    error: (msg: string, ...args: unknown[]) =>
      console.error(`[EventMapper] ${msg}`, ...args),
  };

  static mapBadgeMintEvent(payload: Record<string, unknown>): BadgeMintEvent {
    try {
      const event: BadgeMintEvent = {
        userId: String(payload.userId || payload.user_id || ''),
        badgeId: String(payload.badgeId || payload.badge_id || ''),
        badgeName: String(payload.badgeName || payload.badge_name || ''),
        criteria: String(payload.criteria || ''),
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
      };

      this.logger.debug('Mapped badge mint event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge mint event:', error);
      throw error;
    }
  }

  static mapBadgeVerificationEvent(
    payload: Record<string, unknown>
  ): BadgeVerificationEvent {
    try {
      const event: BadgeVerificationEvent = {
        userId: String(payload.userId || payload.user_id || ''),
        badgeId: String(payload.badgeId || payload.badge_id || ''),
        badgeName: String(payload.badgeName || payload.badge_name || ''),
        verificationData: (payload.verificationData ||
          payload.verification_data ||
          {}) as unknown,
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
      };

      this.logger.debug('Mapped badge verification event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge verification event:', error);
      throw error;
    }
  }

  static mapBadgeMetadataUpdateEvent(
    payload: Record<string, unknown>
  ): BadgeMetadataUpdateEvent {
    try {
      const event: BadgeMetadataUpdateEvent = {
        badgeId: String(payload.badgeId || payload.badge_id || ''),
        badgeName: String(payload.badgeName || payload.badge_name || ''),
        level:
          payload.level !== undefined
            ? Number(payload.level)
            : payload.badge_level !== undefined
            ? Number(payload.badge_level)
            : undefined,
        category: payload.category
          ? String(payload.category)
          : payload.badge_category
          ? String(payload.badge_category)
          : undefined,
        description: payload.description
          ? String(payload.description)
          : payload.badge_description
          ? String(payload.badge_description)
          : undefined,
        previousLevel:
          payload.previousLevel !== undefined
            ? Number(payload.previousLevel)
            : payload.previous_level !== undefined
            ? Number(payload.previous_level)
            : undefined,
        previousCategory: payload.previousCategory
          ? String(payload.previousCategory)
          : payload.previous_category
          ? String(payload.previous_category)
          : undefined,
        previousDescription: payload.previousDescription
          ? String(payload.previousDescription)
          : payload.previous_description
          ? String(payload.previous_description)
          : undefined,
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
      };

      this.logger.debug('Mapped badge metadata update event', {
        badgeId: event.badgeId,
        level: event.level,
        category: event.category,
      });
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge metadata update event:', error);
      throw error;
    }
  }

  static mapBadgeRevocationEvent(
    payload: Record<string, unknown>
  ): BadgeRevocationEvent {
    try {
      const revocationType = String(
        payload.revocationType || payload.revocation_type || 'soft'
      ) as 'soft' | 'hard';

      const event: BadgeRevocationEvent = {
        userId: String(payload.userId || payload.user_id || ''),
        badgeId: String(payload.badgeId || payload.badge_id || ''),
        badgeName: String(payload.badgeName || payload.badge_name || ''),
        revocationType,
        reason: payload.reason ? String(payload.reason) : undefined,
        issuerId: String(payload.issuerId || payload.issuer_id || ''),
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
        previousActive:
          payload.previousActive !== undefined
            ? Boolean(payload.previousActive)
            : true,
      };

      this.logger.debug('Mapped badge revocation event', {
        badgeId: event.badgeId,
        userId: event.userId,
        revocationType: event.revocationType,
      });
      return event;
    } catch (error) {
      this.logger.error('Error mapping badge revocation event:', error);
      throw error;
    }
  }

  static mapCommunityUpdateEvent(
    payload: Record<string, unknown>
  ): CommunityUpdateEvent {
    try {
      const updateType = String(
        payload.updateType || payload.update_type || 'announcement'
      ) as 'member_joined' | 'member_left' | 'announcement' | 'event';

      const affectedUsers = payload.affectedUsers || payload.affected_users;
      const event: CommunityUpdateEvent = {
        communityId: String(payload.communityId || payload.community_id || ''),
        communityName: String(
          payload.communityName || payload.community_name || ''
        ),
        updateType,
        affectedUsers: Array.isArray(affectedUsers)
          ? (affectedUsers as unknown[]).map(String)
          : [],
        data: (payload.data || {}) as unknown,
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
      };

      this.logger.debug('Mapped community update event', event);
      return event;
    } catch (error) {
      this.logger.error('Error mapping community update event:', error);
      throw error;
    }
  }

  static mapCommunityCreationEvent(
    payload: Record<string, unknown>
  ): CommunityCreationEvent {
    try {
      const event: CommunityCreationEvent = {
        communityId: String(payload.communityId || payload.community_id || ''),
        communityName: String(
          payload.communityName || payload.community_name || ''
        ),
        description: String(payload.description || ''),
        ownerAddress: String(
          payload.ownerAddress || payload.owner_address || ''
        ),
        createdAtBlockHeight: Number(
          payload.createdAtBlockHeight || payload.created_at_block_height || 0
        ),
        contractAddress: String(
          payload.contractAddress || payload.contract_address || ''
        ),
        transactionHash: String(
          payload.transactionHash || payload.tx_hash || ''
        ),
        blockHeight: Number(payload.blockHeight || payload.block_height || 0),
        timestamp: Number(payload.timestamp || Date.now()),
      };

      this.logger.debug('Mapped community creation event', {
        communityId: event.communityId,
        communityName: event.communityName,
        ownerAddress: event.ownerAddress,
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
      badge_mint: 'badge_received',
      'badge-issued': 'badge_issued',
      badge_issued: 'badge_issued',
      'badge-verify': 'badge_verified',
      badge_verify: 'badge_verified',
      'badge-verified': 'badge_verified',
      badge_verified: 'badge_verified',
      'badge-metadata-update': 'badge_metadata_updated',
      badge_metadata_update: 'badge_metadata_updated',
      'badge-metadata-updated': 'badge_metadata_updated',
      badge_metadata_updated: 'badge_metadata_updated',
      'badge-revocation': 'badge_revoked',
      badge_revocation: 'badge_revoked',
      'badge-revoked': 'badge_revoked',
      badge_revoked: 'badge_revoked',
      'community-update': 'community_update',
      community_update: 'community_update',
      'community-created': 'community_created',
      community_created: 'community_created',
      'community-creation': 'community_created',
      community_creation: 'community_created',
      'community-invite': 'community_invite',
      community_invite: 'community_invite',
      'system-announcement': 'system_announcement',
      system_announcement: 'system_announcement',
    };

    const notificationType = typeMap[eventType] || 'system_announcement';
    this.logger.debug(
      `Mapped event type '${eventType}' to notification type '${notificationType}'`
    );
    return notificationType;
  }

  static extractEventType(
    chainhookEvent: ChainhookEventPayload
  ): string | null {
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

            if (
              method === 'update-metadata' ||
              method === 'set-metadata' ||
              method === 'metadata-update'
            ) {
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
                  this.logger.debug(
                    'Detected badge-metadata-update event from topic'
                  );
                  return 'badge-metadata-update';
                }
              }

              if (
                event.topic.includes('community') &&
                event.topic.includes('created')
              ) {
                this.logger.debug(
                  'Detected community-creation event from topic'
                );
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

  static extractUserIdFromEvent(
    _chainhookEvent: ChainhookEventPayload,
    eventPayload: Record<string, unknown>
  ): string | null {
    try {
      const userId = eventPayload?.userId || eventPayload?.user_id || null;
      if (userId) {
        this.logger.debug(`Extracted userId: ${userId}`);
      }
      return userId ? String(userId) : null;
    } catch (error) {
      this.logger.error('Error extracting user ID:', error);
      return null;
    }
  }

  static extractTransactionHash(chainhookEvent: ChainhookEventPayload): string {
    try {
      if (
        chainhookEvent &&
        chainhookEvent.transactions &&
        chainhookEvent.transactions.length > 0
      ) {
        const hash = chainhookEvent.transactions[0].transaction_hash || '';
        if (hash) {
          this.logger.debug(
            `Extracted transaction hash: ${hash.substring(0, 8)}...`
          );
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
