import Badge from '../models/Badge';
import BadgeTemplate from '../models/BadgeTemplate';
import User from '../models/User';
import Community from '../models/Community';
import { BadgeMintEvent } from '../chainhook/types/handlers';

export interface BadgeMintResult {
  success: boolean;
  badgeId?: string;
  message: string;
  error?: string;
  errorMessage?: string;
}

export interface AuditLog {
  timestamp: Date;
  eventType: string;
  badgeId: string;
  badgeName: string;
  recipientAddress: string;
  issuerAddress?: string;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export class BadgeMintService {
  private logger: any;
  private auditLogs: AuditLog[] = [];
  private readonly MAX_AUDIT_LOGS = 10000;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeMintService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeMintService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeMintService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeMintService] ${msg}`, ...args)
    };
  }

  private validateBadgeEvent(event: BadgeMintEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event) {
      errors.push('Event is required');
    } else {
      if (!event.userId || typeof event.userId !== 'string' || event.userId.length === 0) {
        errors.push('Valid userId is required');
      }

      if (!event.userId.match(/^[a-zA-Z0-9]+$/)) {
        errors.push('Invalid userId format');
      }

      if (!event.contractAddress || event.contractAddress.length === 0) {
        errors.push('Contract address is required');
      }

      if (!event.transactionHash || event.transactionHash.length === 0) {
        errors.push('Transaction hash is required');
      }

      if (event.blockHeight < 0) {
        errors.push('Block height must be non-negative');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private logAudit(log: AuditLog): void {
    try {
      this.auditLogs.push(log);

      if (this.auditLogs.length > this.MAX_AUDIT_LOGS) {
        this.auditLogs = this.auditLogs.slice(-this.MAX_AUDIT_LOGS);
      }
    } catch (error) {
      this.logger.error('Failed to log audit entry:', error);
    }
  }

  getAuditLogs(limit: number = 100, offset: number = 0): AuditLog[] {
    return this.auditLogs.slice(-offset - limit, offset === 0 ? undefined : -offset);
  }

  getAuditLogsByRecipient(recipientAddress: string): AuditLog[] {
    return this.auditLogs.filter(log => log.recipientAddress === recipientAddress);
  }

  getAuditLogsByBadge(badgeId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.badgeId === badgeId);
  }

  async processBadgeMintEvent(event: BadgeMintEvent): Promise<BadgeMintResult> {
    try {
      this.logger.debug('Processing badge mint event', {
        badgeId: event.badgeId,
        recipientAddress: event.userId,
        contractAddress: event.contractAddress
      });

      const validation = this.validateBadgeEvent(event);
      if (!validation.valid) {
        this.logger.warn('Invalid badge mint event', { errors: validation.errors });

        this.logAudit({
          timestamp: new Date(),
          eventType: 'badge_minted',
          badgeId: event.badgeId || 'unknown',
          badgeName: event.badgeName || 'unknown',
          recipientAddress: event.userId || 'unknown',
          contractAddress: event.contractAddress || 'unknown',
          transactionHash: event.transactionHash || 'unknown',
          blockHeight: event.blockHeight || 0,
          status: 'failure',
          errorMessage: 'Validation failed: ' + validation.errors.join(', ')
        });

        return {
          success: false,
          message: 'Invalid badge mint event: ' + validation.errors.join(', '),
          error: 'Validation failed'
        };
      }

      let recipientUser: any;
      try {
        recipientUser = await User.findOne({ stacksAddress: event.userId });

        if (!recipientUser) {
          try {
            recipientUser = await User.create({
              stacksAddress: event.userId,
              email: '',
              communities: [],
              adminCommunities: [],
              notifications: [],
              createdAt: new Date(),
              updatedAt: new Date()
            });

            this.logger.info('Created new user from badge minting event', {
              stacksAddress: event.userId,
              userId: recipientUser._id
            });
          } catch (userError) {
            this.logger.error('Failed to create user for badge recipient', userError);
            return {
              success: false,
              message: 'Failed to create user record for badge recipient',
              error: userError instanceof Error ? userError.message : 'Unknown error'
            };
          }
        }
      } catch (userLookupError) {
        this.logger.error('Failed to look up recipient user', userLookupError);
        return {
          success: false,
          message: 'Failed to look up recipient user',
          error: userLookupError instanceof Error ? userLookupError.message : 'Unknown error'
        };
      }

      const checkExisting = await Badge.findOne({
        owner: event.userId,
        contractAddress: event.contractAddress,
        transactionId: event.transactionHash
      });

      if (checkExisting) {
        this.logger.warn('Badge already exists in database', {
          badgeId: event.badgeId,
          recipientAddress: event.userId
        });
        return {
          success: true,
          badgeId: checkExisting._id?.toString(),
          message: 'Badge already exists'
        };
      }

      let badgeData: any = {
        owner: event.userId,
        issuer: 'blockchain-mint',
        community: null,
        transactionId: event.transactionHash,
        metadata: {
          level: 1,
          category: 'achievement',
          timestamp: event.timestamp
        },
        issuedAt: new Date(event.timestamp)
      };

      if (event.badgeId && event.badgeId.length > 0) {
        try {
          const template = await BadgeTemplate.findOne({ externalId: event.badgeId });
          if (template) {
            badgeData.templateId = template._id;
            badgeData.community = template.community;
            badgeData.metadata.level = (template as any).level || 1;
            badgeData.metadata.category = (template as any).category || 'achievement';
          } else {
            badgeData.templateId = null;
          }
        } catch (templateError) {
          this.logger.warn('Failed to find badge template', templateError);
          badgeData.templateId = null;
        }
      }

      let badge: any;
      try {
        badge = await Badge.create(badgeData);

        this.logger.info('Badge minted from blockchain event', {
          badgeId: badge._id,
          externalBadgeId: event.badgeId,
          recipientAddress: event.userId,
          contractAddress: event.contractAddress
        });
      } catch (badgeError) {
        this.logger.error('Failed to create badge in database', badgeError);
        return {
          success: false,
          message: 'Failed to create badge in database',
          error: badgeError instanceof Error ? badgeError.message : 'Unknown error'
        };
      }

      try {
        await User.findByIdAndUpdate(
          recipientUser._id,
          {
            $addToSet: {
              badges: badge._id
            }
          },
          { new: true }
        );

        this.logger.info('User updated with new badge', {
          userId: recipientUser._id,
          badgeId: badge._id
        });
      } catch (updateError) {
        this.logger.error('Failed to update user with badge', updateError);
        return {
          success: false,
          message: 'Badge minted but failed to link to user',
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
          badgeId: badge._id?.toString()
        };
      }

      this.logAudit({
        timestamp: new Date(),
        eventType: 'badge_minted',
        badgeId: event.badgeId,
        badgeName: event.badgeName,
        recipientAddress: event.userId,
        contractAddress: event.contractAddress,
        transactionHash: event.transactionHash,
        blockHeight: event.blockHeight,
        status: 'success'
      });

      return {
        success: true,
        badgeId: badge._id?.toString(),
        message: `Badge "${event.badgeName}" minted successfully for ${event.userId}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process badge mint event', error);

      this.logAudit({
        timestamp: new Date(),
        eventType: 'badge_minted',
        badgeId: event.badgeId,
        badgeName: event.badgeName,
        recipientAddress: event.userId,
        contractAddress: event.contractAddress,
        transactionHash: event.transactionHash,
        blockHeight: event.blockHeight,
        status: 'failure',
        errorMessage
      });

      return {
        success: false,
        message: 'Failed to process badge mint event',
        error: errorMessage
      };
    }
  }

  async syncBadgeFromBlockchain(
    badgeId: string,
    contractAddress: string,
    recipientAddress: string,
    badgeName: string,
    criteria: string = 'completing a task'
  ): Promise<BadgeMintResult> {
    try {
      const event: BadgeMintEvent = {
        badgeId,
        userId: recipientAddress,
        badgeName,
        criteria,
        contractAddress,
        transactionHash: '',
        blockHeight: 0,
        timestamp: Date.now()
      };

      return await this.processBadgeMintEvent(event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to sync badge from blockchain', error);

      return {
        success: false,
        message: 'Failed to sync badge from blockchain',
        error: errorMessage
      };
    }
  }
}

export default BadgeMintService;
