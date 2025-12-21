import { Request, Response, NextFunction } from 'express';
import BadgeMetadataUpdateService from '../services/badgeMetadataUpdateService';
import { BadgeMetadataUpdateEvent } from '../chainhook/types/handlers';

export interface WebhookValidationConfig {
  enabled: boolean;
  validateSignature: boolean;
  validateContentType: boolean;
  validatePayload: boolean;
  logger?: any;
}

export class BadgeMetadataUpdateWebhookMiddleware {
  private service: BadgeMetadataUpdateService;
  private config: WebhookValidationConfig;
  private logger: any;
  private processingStats = {
    totalWebhooks: 0,
    successfulWebhooks: 0,
    failedWebhooks: 0,
    validationErrors: 0,
    lastProcessedTime: 0
  };

  constructor(
    service: BadgeMetadataUpdateService,
    config: Partial<WebhookValidationConfig> = {},
    logger?: any
  ) {
    this.service = service;
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
      debug: (msg: string, ...args: any[]) => console.debug(`[BadgeMetadataWebhook] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[BadgeMetadataWebhook] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[BadgeMetadataWebhook] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[BadgeMetadataWebhook] ${msg}`, ...args)
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
          this.logger.warn('Invalid content type for webhook', {
            contentType: req.headers['content-type']
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid content type. Expected application/json'
          });
        }

        if (this.config.validatePayload && !this.isValidPayload(req.body)) {
          this.processingStats.validationErrors++;
          this.logger.warn('Invalid webhook payload structure', {
            body: req.body
          });
          return res.status(400).json({
            success: false,
            error: 'Invalid payload structure'
          });
        }

        if (this.config.validateSignature && !this.validateSignature(req)) {
          this.processingStats.validationErrors++;
          this.logger.warn('Webhook signature validation failed');
          return res.status(401).json({
            success: false,
            error: 'Signature validation failed'
          });
        }

        const event: BadgeMetadataUpdateEvent = req.body;

        const result = await this.service.processMetadataUpdate(event);

        if (result.success) {
          this.processingStats.successfulWebhooks++;
        } else {
          this.processingStats.failedWebhooks++;
        }

        this.processingStats.lastProcessedTime = Date.now() - startTime;

        this.logger.info('Webhook processed', {
          badgeId: event.badgeId,
          success: result.success,
          processingTime: this.processingStats.lastProcessedTime,
          changes: result.changeCount
        });

        return res.status(200).json({
          success: true,
          badgeId: event.badgeId,
          invalidated: result.invalidated,
          uiNotified: result.uiNotified,
          changeCount: result.changeCount
        });
      } catch (error) {
        this.processingStats.failedWebhooks++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        this.logger.error('Error processing webhook', {
          error: errorMessage
        });

        return res.status(500).json({
          success: false,
          error: 'Failed to process webhook'
        });
      }
    };
  }

  private isValidPayload(payload: any): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const requiredFields = ['badgeId', 'transactionHash', 'blockHeight'];
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
    const secret = process.env.BADGE_METADATA_WEBHOOK_SECRET || 'default-secret';
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
          : '0%'
    };
  }

  resetStats(): void {
    this.processingStats = {
      totalWebhooks: 0,
      successfulWebhooks: 0,
      failedWebhooks: 0,
      validationErrors: 0,
      lastProcessedTime: 0
    };
    this.logger.info('Webhook processing statistics reset');
  }
}

export default BadgeMetadataUpdateWebhookMiddleware;
