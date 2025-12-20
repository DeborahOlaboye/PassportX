import { NotificationPayload } from '../types';
import { BadgeMintEvent } from '../chainhook/types/handlers';

export interface BadgeMintNotificationOptions {
  includeInstructions?: boolean;
  includePassportLink?: boolean;
  includeCommunityLink?: boolean;
}

export class BadgeMintNotificationService {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeMintNotificationService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeMintNotificationService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeMintNotificationService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeMintNotificationService] ${msg}`, ...args)
    };
  }

  createBadgeMintNotification(
    event: BadgeMintEvent,
    options: BadgeMintNotificationOptions = {}
  ): NotificationPayload {
    try {
      if (!event) {
        throw new Error('Event is required for notification creation');
      }

      if (!event.userId) {
        throw new Error('User ID is required for notification');
      }

      const { includeInstructions = true, includePassportLink = true, includeCommunityLink = false } = options;

      const message = this.buildBadgeMintMessage(
        event.badgeName || 'Achievement Badge',
        event.criteria || 'completing a task',
        includeInstructions,
        includePassportLink,
        includeCommunityLink
      );

      const notification: NotificationPayload = {
        userId: event.userId,
        type: 'badge_received',
        title: `🏆 ${event.badgeName || 'Badge Received'}`,
        message,
        data: {
          eventType: 'badge-mint',
          badgeId: event.badgeId || '',
          badgeName: event.badgeName || 'Achievement Badge',
          criteria: event.criteria || '',
          contractAddress: event.contractAddress || '',
          transactionHash: event.transactionHash || '',
          blockHeight: event.blockHeight || 0,
          timestamp: event.timestamp || Date.now(),
          passportUrl: '/passport',
          badgeDetailsUrl: event.badgeId ? `/badges/${event.badgeId}` : ''
        }
      };

      this.logger.info('Created badge mint notification', {
        badgeId: event.badgeId,
        userId: event.userId,
        badgeName: event.badgeName
      });

      return notification;
    } catch (error) {
      this.logger.error('Error creating badge mint notification:', error);
      throw error;
    }
  }

  private buildBadgeMintMessage(
    badgeName: string,
    criteria: string,
    includeInstructions: boolean,
    includePassportLink: boolean,
    includeCommunityLink: boolean
  ): string {
    let message = `Congratulations! 🎉 You've received the **${badgeName}** badge for ${criteria}.\n\n`;

    if (includeInstructions) {
      message += this.getNextSteps();
    }

    if (includePassportLink) {
      message += `\nView your badge and other achievements in your passport.`;
    }

    if (includeCommunityLink) {
      message += `\nShare this achievement with your community!`;
    }

    return message;
  }

  private getNextSteps(): string {
    return `Next Steps:
📱 View your badge in your passport
🔗 Share with your community
🎯 Keep working towards more badges!`;
  }

  createIssuanceConfirmationNotification(
    event: BadgeMintEvent,
    issuerAddress: string
  ): NotificationPayload {
    return {
      userId: issuerAddress,
      type: 'badge_issued',
      title: `✅ Badge Issued: ${event.badgeName}`,
      message: `You have successfully issued the ${event.badgeName} badge to ${event.userId.substring(0, 10)}... for ${event.criteria}`,
      data: {
        eventType: 'badge-mint-confirmation',
        badgeId: event.badgeId,
        badgeName: event.badgeName,
        recipientAddress: event.userId,
        criteria: event.criteria,
        contractAddress: event.contractAddress || '',
        transactionHash: event.transactionHash || '',
        blockHeight: event.blockHeight || 0,
        timestamp: event.timestamp || Date.now()
      }
    };
  }

  async buildNotificationBatch(
    event: BadgeMintEvent,
    recipientAddresses: string[],
    issuerAddresses: string[] = [],
    options: BadgeMintNotificationOptions = {}
  ): Promise<NotificationPayload[]> {
    try {
      if (!event) {
        throw new Error('Event is required for building notification batch');
      }

      const notifications: NotificationPayload[] = [];

      if (!Array.isArray(recipientAddresses) || recipientAddresses.length === 0) {
        this.logger.warn('No recipient addresses provided for notification batch', {
          badgeId: event.badgeId
        });
        return [];
      }

      for (const recipientAddress of recipientAddresses) {
        try {
          if (recipientAddress && typeof recipientAddress === 'string') {
            const badgeEvent = { ...event, userId: recipientAddress };
            const notification = this.createBadgeMintNotification(badgeEvent, options);
            notifications.push(notification);
            this.logger.debug('Added badge mint notification for recipient', { recipientAddress });
          }
        } catch (recipientError) {
          this.logger.error('Failed to create notification for recipient ' + recipientAddress, recipientError);
        }
      }

      for (const issuerAddress of issuerAddresses || []) {
        try {
          if (issuerAddress && typeof issuerAddress === 'string') {
            const confirmationNotification = this.createIssuanceConfirmationNotification(event, issuerAddress);
            notifications.push(confirmationNotification);
            this.logger.debug('Added issuance confirmation notification for issuer', { issuerAddress });
          }
        } catch (issuerError) {
          this.logger.error('Failed to create confirmation notification for issuer ' + issuerAddress, issuerError);
        }
      }

      this.logger.info('Built notification batch for badge minting', {
        badgeId: event.badgeId,
        notificationCount: notifications.length,
        recipientCount: recipientAddresses.length,
        issuerCount: issuerAddresses?.length || 0
      });

      return notifications;
    } catch (error) {
      this.logger.error('Failed to build notification batch', error);
      return [];
    }
  }

  validateNotificationPayload(notification: NotificationPayload): boolean {
    try {
      if (!notification.userId || !notification.title || !notification.message) {
        this.logger.warn('Invalid notification payload: missing required fields');
        return false;
      }

      if (!['badge_received', 'badge_issued'].includes(notification.type)) {
        this.logger.warn(`Invalid notification type: ${notification.type}`);
        return false;
      }

      if (!notification.data?.badgeId) {
        this.logger.warn('Invalid notification data: missing badgeId');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to validate notification payload', error);
      return false;
    }
  }
}

export default BadgeMintNotificationService;
