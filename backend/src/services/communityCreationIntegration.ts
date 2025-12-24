import CommunityCreationService, { CommunityCreationEvent } from './communityCreationService';
import CommunityCreationNotificationService from './communityCreationNotificationService';
import CommunityCacheService from './communityCacheService';
import { NotificationPayload } from '../types';

export interface ChainhookEventPayload {
  block_identifier: {
    index: number;
    hash: string;
  };
  parent_block_identifier: {
    index: number;
    hash: string;
  };
  type: string;
  timestamp: number;
  transactions: Array<{
    transaction_index: number;
    transaction_hash: string;
    operations: any[];
  }>;
  metadata: {
    bitcoin_anchor_block_identifier: {
      index: number;
      hash: string;
    };
    pox_cycle_index: number;
    pox_cycle_position: number;
    pox_cycle_length: number;
  };
}

export class CommunityCreationIntegration {
  private communityService: CommunityCreationService;
  private notificationService: CommunityCreationNotificationService;
  private cacheService: CommunityCacheService;
  private logger: any;

  constructor(
    logger?: any,
    communityService?: CommunityCreationService,
    notificationService?: CommunityCreationNotificationService,
    cacheService?: CommunityCacheService
  ) {
    this.logger = logger || this.getDefaultLogger();
    this.communityService = communityService || new CommunityCreationService(this.logger);
    this.notificationService = notificationService || new CommunityCreationNotificationService(this.logger);
    this.cacheService = cacheService || new CommunityCacheService(
      { enabled: true, ttl: 300, provider: 'memory' },
      this.logger
    );
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCreationIntegration] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCreationIntegration] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCreationIntegration] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCreationIntegration] ${msg}`, ...args)
    };
  }

  async processCommunityCreation(event: CommunityCreationEvent): Promise<{
    success: boolean;
    notifications: NotificationPayload[];
    message: string;
    errors?: string[];
  }> {
    try {
      this.logger.debug('Processing community creation event', {
        communityId: event.communityId,
        communityName: event.communityName
      });

      const errors: string[] = [];

      // Sync community to database
      const communityResult = await this.communityService.processCommunityCreationEvent(event);

      if (!communityResult.success) {
        this.logger.error('Failed to sync community to database', communityResult);
        errors.push(communityResult.message);
      }

      // Create notifications
      const notifications = await this.notificationService.buildNotificationBatch(event, [event.ownerAddress]);

      if (notifications.length === 0) {
        this.logger.warn('No notifications generated for community creation');
      }

      // Invalidate cache
      this.cacheService.onCommunityCreated(event);

      return {
        success: errors.length === 0,
        notifications,
        message: `Community creation processed (${notifications.length} notifications)`,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process community creation', error);

      return {
        success: false,
        notifications: [],
        message: 'Failed to process community creation',
        errors: [errorMsg]
      };
    }
  }

  getCommunityService(): CommunityCreationService {
    return this.communityService;
  }

  getNotificationService(): CommunityCreationNotificationService {
    return this.notificationService;
  }

  getCacheService(): CommunityCacheService {
    return this.cacheService;
  }
}

export default CommunityCreationIntegration;
