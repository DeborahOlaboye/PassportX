import { NotificationPayload } from '../types';
import { CommunityCreationEvent } from './communityCreationService';

export interface WelcomeNotificationOptions {
  includeInstructions?: boolean;
  includeDashboardLink?: boolean;
}

export class CommunityCreationNotificationService {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCreationNotificationService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCreationNotificationService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCreationNotificationService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCreationNotificationService] ${msg}`, ...args)
    };
  }

  createWelcomeNotification(
    event: CommunityCreationEvent,
    options: WelcomeNotificationOptions = {}
  ): NotificationPayload {
    const { includeInstructions = true, includeDashboardLink = true } = options;

    const message = this.buildWelcomeMessage(
      event.communityName,
      includeInstructions,
      includeDashboardLink
    );

    return {
      userId: event.ownerAddress,
      type: 'community_created',
      title: `🎉 ${event.communityName} Community Created`,
      message,
      data: {
        eventType: 'community-creation',
        communityId: event.communityId,
        communityName: event.communityName,
        description: event.description,
        ownerAddress: event.ownerAddress,
        contractAddress: event.contractAddress,
        transactionHash: event.transactionHash,
        blockHeight: event.blockHeight,
        timestamp: event.timestamp,
        dashboardUrl: `/communities/${event.communityId}`,
        settingsUrl: `/communities/${event.communityId}/settings`
      }
    };
  }

  private buildWelcomeMessage(
    communityName: string,
    includeInstructions: boolean,
    includeDashboardLink: boolean
  ): string {
    let message = `Welcome to ${communityName}! Your community has been successfully created on the blockchain.\n\n`;

    if (includeInstructions) {
      message += this.getSetupInstructions();
    }

    if (includeDashboardLink) {
      message += `\nVisit your community dashboard to customize settings and invite members.`;
    }

    return message;
  }

  private getSetupInstructions(): string {
    return `Next Steps:
1. 📝 Customize your community profile and settings
2. 🏷️ Create badge templates for member recognition
3. 👥 Invite community members
4. 🔧 Configure community rules and permissions`;
  }

  createAdminConfirmationNotification(
    communityId: string,
    communityName: string,
    adminAddress: string,
    communityUrl: string
  ): NotificationPayload {
    return {
      userId: adminAddress,
      type: 'community_created',
      title: `Admin: ${communityName} Community Created`,
      message: `You are now an admin of ${communityName}. You have full control to manage members, create badges, and configure community settings.`,
      data: {
        eventType: 'community-creation-admin',
        communityId,
        communityName,
        adminAddress,
        dashboardUrl: communityUrl,
        settingsUrl: `${communityUrl}/settings`,
        membersUrl: `${communityUrl}/members`,
        badgesUrl: `${communityUrl}/badges`,
        transactionHash: '',
        blockHeight: 0,
        timestamp: Date.now()
      }
    };
  }

  async buildNotificationBatch(
    event: CommunityCreationEvent,
    adminAddresses: string[],
    options: WelcomeNotificationOptions = {}
  ): Promise<NotificationPayload[]> {
    try {
      const notifications: NotificationPayload[] = [];

      // Primary admin welcome notification
      if (adminAddresses.length > 0) {
        const primaryAdmin = adminAddresses[0];
        const welcomeNotification = this.createWelcomeNotification(event, options);
        notifications.push(welcomeNotification);

        // Additional admin confirmations
        for (let i = 1; i < adminAddresses.length; i++) {
          const adminAddress = adminAddresses[i];
          const confirmationNotification = this.createAdminConfirmationNotification(
            event.communityId,
            event.communityName,
            adminAddress,
            `/communities/${event.communityId}`
          );
          notifications.push(confirmationNotification);
        }
      }

      this.logger.info('Built notification batch for community creation', {
        communityId: event.communityId,
        notificationCount: notifications.length
      });

      return notifications;
    } catch (error) {
      this.logger.error('Failed to build notification batch', error);
      throw error;
    }
  }

  validateNotificationPayload(notification: NotificationPayload): boolean {
    try {
      if (!notification.userId || !notification.title || !notification.message) {
        this.logger.warn('Invalid notification payload: missing required fields');
        return false;
      }

      if (!['community_created'].includes(notification.type)) {
        this.logger.warn(`Invalid notification type: ${notification.type}`);
        return false;
      }

      if (!notification.data?.communityId) {
        this.logger.warn('Invalid notification data: missing communityId');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to validate notification payload', error);
      return false;
    }
  }
}

export default CommunityCreationNotificationService;
