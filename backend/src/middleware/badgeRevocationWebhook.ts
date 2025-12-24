import { Request, Response, NextFunction } from 'express';
import BadgeRevocationCoordinator from '../services/badgeRevocationCoordinator';
import { BadgeRevocationEvent } from '../chainhook/types/handlers';

export interface RevocationWebhookConfig {
  enabled: boolean;
  validateSignature: boolean;
  validateContentType: boolean;
  validatePayload: boolean;
  logger?: any;
}

export class BadgeRevocationWebhookMiddleware {
  private coordinator: BadgeRevocationCoordinator;
  private config: RevocationWebhookConfig;
  private logger: any;
  private processingStats = {
    totalWebhooks: 0,
    successfulWebhooks: 0,
    failedWebhooks: 0,
    validationErrors: 0,
    lastProcessedTime: 0,
    softRevokes: 0,
    hardRevokes: 0
  };

  constructor(
    coordinator: BadgeRevocationCoordinator,
    config: Partial<RevocationWebhookConfig> = {},
    logger?: any
  ) {
    this.coordinator = coordinator;
    this.config = {
      enabled: config.enabled ?? true,
      validateSignature: config.validateSignature ?? true,
      validateContentType: config.validateContentType ?? true,
      validatePayload: config.validatePayload ?? true
    };

    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeRevocationWebhook] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeRevocationWebhook] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeRevocationWebhook] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeRevocationWebhook] ${msg}`, ...args)
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      try {
        this.processingStats.totalWebhooks++;
        const startTime = Date.now();

        if (this.config.validateContentType && req.headers['content-type'] !== 'application/json') {
          this.processingStats.validationErrors++;
          this.logger.warn('Invalid content type for revocation webhook', {
            contentType: req.headers['content-type']
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid content type. Expected application/json'
          });
        }

        if (this.config.validatePayload && !this.isValidPayload(req.body)) {
          this.processingStats.validationErrors++;
          this.logger.warn('Invalid revocation webhook payload structure', {
            body: req.body
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid payload structure'
          });
        }

        if (this.config.validateSignature && !this.validateSignature(req)) {
          this.processingStats.validationErrors++;
          this.logger.warn('Revocation webhook signature validation failed');
          return res.status(401).json({
            success: false,
            error: 'Signature validation failed'
          });
        }

        const event: BadgeRevocationEvent = req.body;

        const result = await this.coordinator.processBadgeRevocation(event);

        if (result.success) {
          this.processingStats.successfulWebhooks++;
          if (event.revocationType === 'soft') {
            this.processingStats.softRevokes++;
          } else {
            this.processingStats.hardRevokes++;
          }
        } else {
          this.processingStats.failedWebhooks++;
        }

        this.processingStats.lastProcessedTime = Date.now() - startTime;

        this.logger.info('Revocation webhook processed', {
          badgeId: event.badgeId,
          userId: event.userId,
          revocationType: event.revocationType,
          success: result.success,
          processingTime: this.processingStats.lastProcessedTime
        });

        return res.status(200).json({
          success: true,
          badgeId: event.badgeId,
          userId: event.userId,
          revocationType: event.revocationType,
          auditLogged: result.auditLogged,
          cacheInvalidated: result.cacheInvalidated,
          notified: result.notified,
          countUpdated: result.countUpdated
        });
      } catch (error) {
        this.processingStats.failedWebhooks++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        this.logger.error('Error processing revocation webhook', {
          error: errorMessage
        });

        return res.status(500).json({
          success: false,
          error: 'Failed to process revocation webhook'
        });
      }
    };
  }

  private isValidPayload(payload: any): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const requiredFields = ['userId', 'badgeId', 'revocationType', 'transactionHash', 'blockHeight'];
    return requiredFields.every(field => field in payload);
  }

  private validateSignature(req: Request): boolean {
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = this.computeSignature(payload);

    return signature === expectedSignature;
  }

  private computeSignature(payload: string): string {
    const crypto = require('crypto');
    const secret = process.env.BADGE_REVOCATION_WEBHOOK_SECRET || 'default-secret';
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  getStats() {
    return {
      ...this.processingStats,
      failureRate:
        this.processingStats.totalWebhooks > 0
          ? ((this.processingStats.failedWebhooks + this.processingStats.validationErrors) /
              this.processingStats.totalWebhooks *
              100).toFixed(2) + '%'
          : '0%',
      softRevokePercentage:
        this.processingStats.totalWebhooks > 0
          ? ((this.processingStats.softRevokes / this.processingStats.totalWebhooks) * 100).toFixed(2) + '%'
          : '0%'
    };
  }

  resetStats(): void {
    this.processingStats = {
      totalWebhooks: 0,
      successfulWebhooks: 0,
      failedWebhooks: 0,
      validationErrors: 0,
      lastProcessedTime: 0,
      softRevokes: 0,
      hardRevokes: 0
    };
    this.logger.info('Revocation webhook processing statistics reset');
  }
}

export default BadgeRevocationWebhookMiddleware;
